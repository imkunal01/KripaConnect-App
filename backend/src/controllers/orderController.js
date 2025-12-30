const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendMail } = require("../services/emailService");

// 🧾 Create order (customer checkout)
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const isRetailer = req.user.role === "retailer";

    // calculate total
    let total = 0;
    const orderItems = [];

    // Optimization: Fetch all products in one query
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (let item of items) {
      const product = productMap.get(item.product);
      
      if (!product) return res.status(404).json({ message: `Product ${item.product} not found` });
      if (product.stock < item.qty) return res.status(400).json({ message: `${product.name} is out of stock` });

      // Pricing logic: use bulk price for retailers if quantity meets minimum
      let unitPrice = product.price;
      if (isRetailer) {
        if (item.qty >= product.min_bulk_qty && product.price_bulk) {
          unitPrice = product.price_bulk;
        } else {
          unitPrice = product.retailer_price || product.price;
        }
      }

      // Validate minimum quantity for bulk orders
      if (isRetailer && product.min_bulk_qty > 0 && item.qty < product.min_bulk_qty && product.price_bulk) {
        return res.status(400).json({ 
          message: `${product.name} requires minimum quantity of ${product.min_bulk_qty} for bulk pricing` 
        });
      }

      total += item.qty * unitPrice;
      orderItems.push({ product: product._id, name: product.name, qty: item.qty, price: unitPrice });
      product.stock -= item.qty;
      await product.save(); // Still saving individually to handle concurrency versions, but that's acceptable for now.
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: total,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      shippingAddress,
      isBulkOrder: isRetailer,
    });

    // Clear cart immediately for COD orders
    if ((paymentMethod || "COD") === "COD") {
      try {
        await User.updateOne({ _id: req.user._id }, { $set: { cart: [] } });
      } catch (e) {
        console.warn("Failed to clear cart after COD order:", e.message);
      }
    }

    // send email confirmation (simple)
    try {
      const orderType = isRetailer ? "Bulk Order" : "Order";
      await sendMail({
        to: req.user.email,
        subject: `${orderType} Placed Successfully`,
        html: `<h3>Hey ${req.user.name},</h3>
         <p>Your ${orderType.toLowerCase()} (#${order._id}) has been placed successfully!</p>
         <p>Total Amount: ₹${total}</p>
         <p>Payment Method: ${paymentMethod}</p>
         ${isRetailer ? '<p><strong>Bulk Order - Special Wholesale Pricing Applied</strong></p>' : ''}
         <p>We'll notify you once it's shipped 🚚</p>`
      });
    } catch (e) {
      console.warn("Email send failed:", e.message);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// 👤 Get logged-in user orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .select("items totalAmount paymentMethod paymentStatus shippingAddress deliveryStatus isBulkOrder createdAt")
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👤 Get single order by ID (user's own order)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price images description")
      .populate("user", "name email phone")
      .lean();
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Verify that the order belongs to the logged-in user OR user is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧑‍💼 Admin – get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .select("items totalAmount paymentMethod paymentStatus shippingAddress deliveryStatus isBulkOrder user createdAt")
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧑‍💼 Admin – update delivery status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliveryStatus = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧑‍💼 Admin – delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    await order.deleteOne();
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👤 User – cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if cancellable
    if (order.deliveryStatus !== "pending") {
      return res.status(400).json({ message: "Cannot cancel order that is already processed or shipped" });
    }

    order.deliveryStatus = "cancelled";
    await order.save();
    
    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  cancelOrder
};
