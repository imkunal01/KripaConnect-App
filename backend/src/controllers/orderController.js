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

    // calculate total
    let total = 0;
    const orderItems = [];
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.stock < item.qty) return res.status(400).json({ message: `${product.name} is out of stock` });

      total += item.qty * product.price;
      orderItems.push({ product: product._id, name: product.name, qty: item.qty, price: product.price });
      product.stock -= item.qty;
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: total,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      shippingAddress,
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
      await sendMail({
        to: req.user.email,
        subject: "Order Placed Successfully",
        html: `<h3>Hey ${req.user.name},</h3>
         <p>Your order (#${order._id}) has been placed successfully!</p>
         <p>Total Amount: ₹${total}</p>
         <p>Payment Method: ${paymentMethod}</p>
         <p>We’ll notify you once it’s shipped 🚚</p>`
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
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧑‍💼 Admin – get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price");
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

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
};
