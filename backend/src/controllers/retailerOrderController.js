const Order = require("../models/Order");
const Product = require("../models/Product");
const { sendMail } = require("../services/emailService");

exports.createRetailerOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (req.user.role !== "retailer") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    let total = 0;

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });

      if (product.stock < item.qty) {
        return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
      }

      // BULK PRICING LOGIC
      let perUnitPrice = product.retailer_price;

      if (item.qty >= product.min_bulk_qty && product.price_bulk) {
        perUnitPrice = product.price_bulk;
      }

      item.price = perUnitPrice;
      item.name = product.name;
      total += perUnitPrice * item.qty;

      // reduce stock
      product.stock -= item.qty;
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount: total,
      paymentMethod: "COD", // retailers mostly pay offline or later
      paymentStatus: "pending",
      deliveryStatus: "pending",
      shippingAddress,
    });

    // BASIC EMAIL
    await sendMail({
      to: req.user.email,
      subject: "Bulk Order Received",
      html: `<h3>Your bulk order has been placed!</h3><p>Order ID: ${order._id}</p>`,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all retailer orders (self)
exports.getRetailerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
