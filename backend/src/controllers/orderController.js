const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendMail } = require("../services/emailService");
const { invalidateMultipleKeys, invalidateCache } = require('../utils/cacheUtils');
const { emitOrderUpdate } = require("../config/socket");

function normalizePurchaseMode(value, isRetailer) {
  if (!isRetailer) return "customer";
  return value === "retailer" ? "retailer" : "customer";
}

// 🧾 Create order (customer checkout)
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, purchaseMode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const isRetailer = req.user.role === "retailer";
    const effectivePurchaseMode = normalizePurchaseMode(purchaseMode, isRetailer);

    // calculate total
    let total = 0;
    const orderItems = [];

    // Optimization: Fetch all products in one query
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const successfulDecrements = [];

    try {
      for (let item of items) {
        const product = productMap.get(String(item.product));
        
        if (!product) throw new Error(`Product not found`);

        // Pricing logic: customer mode uses standard pricing; retailer mode enforces bulk rules
        let unitPrice = product.price;
        if (isRetailer && effectivePurchaseMode === "retailer") {
          const minBulkQty = product.min_bulk_qty > 0 ? product.min_bulk_qty : 1;
          if (minBulkQty > 1 && item.qty < minBulkQty) {
            throw new Error(`${product.name} requires minimum quantity of ${minBulkQty} for bulk purchase`);
          }
          unitPrice = product.price_bulk || product.retailer_price || product.price;
        }

        // Concurrency-safe atomic decrement
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new Error(`${product.name} is out of stock or insufficient quantity available`);
        }

        successfulDecrements.push({ productId: item.product, qty: item.qty });
        total += item.qty * unitPrice;
        orderItems.push({ product: product._id, name: product.name, qty: item.qty, price: unitPrice });
      }
    } catch (concurrencyErr) {
      // Compensation rollback: restore all stocks decremented so far in this checkout
      for (let dec of successfulDecrements) {
        try {
          await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.qty } });
        } catch (rbErr) {
          console.error("Stock rollback error for item:", dec.productId, rbErr);
        }
      }
      return res.status(400).json({ message: concurrencyErr.message });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: total,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      shippingAddress,
      isBulkOrder: isRetailer && effectivePurchaseMode === "retailer",
      purchaseMode: effectivePurchaseMode,
    });

    // Clear cart immediately for COD orders
    if ((paymentMethod || "COD") === "COD") {
      try {
        await User.updateOne({ _id: req.user._id }, { $set: { cart: [] } });
      } catch (e) {
        console.warn("Failed to clear cart after COD order:", e.message);
      }
    }

    // Broadcast real-time order creation event
    emitOrderUpdate(order);

    // send email confirmation (simple)
    try {
      const orderType = isRetailer && effectivePurchaseMode === "retailer" ? "Bulk Order" : "Order";
      await sendMail({
        to: req.user.email,
        subject: `${orderType} Placed Successfully`,
        html: `<h3>Hey ${req.user.name},</h3>
         <p>Your ${orderType.toLowerCase()} (#${order._id}) has been placed successfully!</p>
         <p>Total Amount: ₹${total}</p>
         <p>Payment Method: ${paymentMethod}</p>
         ${isRetailer && effectivePurchaseMode === 'retailer' ? '<p><strong>Bulk Order - Special Wholesale Pricing Applied</strong></p>' : ''}
         <p>We'll notify you once it's shipped 🚚</p>`
      });
    } catch (e) {
      console.warn("Email send failed:", e.message);
    }

    // Invalidate analytics and cart caches
    await Promise.all([
      invalidateMultipleKeys([
        'analytics:overview',
        'analytics:revenue',
        'analytics:orders',
        'analytics:top-products',
        'analytics:low-stock'
      ]),
      invalidateCache(`cart:user:${req.user._id}`)
    ]);

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
      .select("items totalAmount paymentMethod paymentStatus razorpay shippingAddress deliveryStatus isBulkOrder purchaseMode invoiceUrl createdAt")
      .populate("items.product", "name price images Category")
      .populate("items.product.Category", "name slug")
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
      .select("items totalAmount paymentMethod paymentStatus shippingAddress deliveryStatus isBulkOrder purchaseMode user createdAt")
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

    const previousStatus = order.deliveryStatus;
    order.deliveryStatus = status;
    await order.save();

    // If order was transitioned to cancelled from an active state, restock items
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items || []) {
        if (item.product && item.qty > 0) {
          try {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
          } catch (restockErr) {
            console.error("Restock error on order status update:", restockErr);
          }
        }
      }
    }

    // Broadcast real-time order update via Socket.io
    emitOrderUpdate(order);

    // Invalidate analytics caches (status change affects stats)
    await invalidateMultipleKeys([
      'analytics:overview',
      'analytics:revenue',
      'analytics:orders'
    ]);

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
    
    // Invalidate all analytics caches
    await invalidateMultipleKeys([
      'analytics:overview',
      'analytics:revenue',
      'analytics:orders',
      'analytics:top-products'
    ]);
    
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
    
    // Restock items upon user cancellation
    for (const item of order.items || []) {
      if (item.product && item.qty > 0) {
        try {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
        } catch (restockErr) {
          console.error("Restock error on user cancellation:", restockErr);
        }
      }
    }

    // Broadcast real-time order update via Socket.io
    emitOrderUpdate(order);

    // Invalidate analytics caches (cancellation affects order stats)
    await invalidateMultipleKeys([
      'analytics:overview',
      'analytics:orders'
    ]);
    
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
