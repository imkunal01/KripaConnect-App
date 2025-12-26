const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "razorpay"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: {
      name: String,
      phone: String,
      addressLine: String,
      city: String,
      state: String,
      pincode: String,
    },
    razorpay: {
      order_id: String,
      payment_id: String,
      signature: String,
      amount: Number,
    },
    invoiceUrl: { type: String, default: null },
    isBulkOrder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for faster dashboard/analytics queries
orderSchema.index({ user: 1 });
orderSchema.index({ deliveryStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.product": 1 }); // For top selling products aggregation

module.exports = mongoose.model("Order", orderSchema);
