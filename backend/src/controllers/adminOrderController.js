const Order = require("../models/Order");
const Product = require("../models/Product");
const { emitOrderUpdate } = require("../config/socket");

// Get all orders (Admin)
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email role")
      .populate("items.product", "name images price");

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update order status
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const previousStatus = order.deliveryStatus;
    order.deliveryStatus = status;
    await order.save();

    // Restock if status changed to cancelled from active
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items || []) {
        if (item.product && item.qty > 0) {
          try {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
          } catch (restockErr) {
            console.error("Restock error on admin order cancellation:", restockErr);
          }
        }
      }
    }

    // Broadcast real-time order update
    emitOrderUpdate(order);

    res.json({ success: true, message: "Order status updated", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete an order
const deleteOrderAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    await order.deleteOne();
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get only retailer orders
const getRetailerOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name role email")
      .populate("items.product", "name images price");

    const retailerOrders = orders.filter((o) => o.user && o.user.role === "retailer");
    res.json({ success: true, data: retailerOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single order by ID (admin)
const getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price images description")
      .populate("user", "name email phone role");
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
  getRetailerOrdersAdmin,
};
