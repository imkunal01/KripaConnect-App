const crypto = require("crypto");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { createRazorpayOrder } = require("../services/razorpayService");

/**
 * POST /api/payments/razorpay/create-order
 * Body: { orderId }
 * - verifies order exists
 * - creates razorpay order for that amount
 * - creates Transaction record (with razorpay_order_id)
 * - returns razorpay order object to client
 */
const createOrderForPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // create razorpay order for the order.totalAmount
    const razorpayOrder = await createRazorpayOrder({
      amountINR: order.totalAmount,
      receipt: `order_${order._id}`,
      notes: { orderId: order._id.toString(), userId: order.user.toString() },
    });

    // create transaction entry
    const txn = await Transaction.create({
      order: order._id,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      status: "created",
    });

    // optionally update order with razorpay order id
    order.razorpay = order.razorpay || {};
    order.razorpay.order_id = razorpayOrder.id;
    await order.save();

    return res.json({
      razorpayOrder,
      txnId: txn._id,
      keyId: process.env.RAZORPAY_KEY_ID, // so client can initialize checkout
    });
  } catch (err) {
    console.error("createOrderForPayment:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Webhook handler for Razorpay.
 * MUST be mounted with raw body parsing (see server.js).
 * Accepts many events but we will handle payment.captured and payment.failed
 */
const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const bodyRaw = (Buffer.isBuffer(req.body) || typeof req.body === "string")
      ? req.body
      : (req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body)));

    // compute expected signature: HMAC_SHA256(rawBody, webhookSecret)
    // When using express.raw({ type: 'application/json' }) in server, req.body is a Buffer/String raw
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyRaw)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Invalid webhook signature");
      return res.status(400).send("Invalid signature");
    }

    // Parse payload (body as string -> JSON)
    const payload = JSON.parse(Buffer.isBuffer(bodyRaw) ? bodyRaw.toString() : bodyRaw);

    const event = payload.event;
    // console.log("razorpay webhook received:", event);

    // payment captured
    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;
      const razorpayPaymentId = payment.id;
      const razorpayOrderId = payment.order_id;
      const amount = payment.amount; // in paise

      // find transaction by razorpay_order_id
      const txn = await Transaction.findOne({ razorpay_order_id: razorpayOrderId });
      if (txn) {
        txn.razorpay_payment_id = razorpayPaymentId;
        txn.razorpay_signature = signature;
        txn.status = "captured";
        txn.payload = payload;
        await txn.save();
      } else {
        // create a fallback txn record
        await Transaction.create({
          order: payload.payload.order ? payload.payload.order.entity.id : null,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          amount,
          status: "captured",
          payload,
        });
      }

      // update order payment status
      // find order by razorpay.order_id stored earlier
      const order = await Order.findOne({ "razorpay.order_id": razorpayOrderId }) || await Order.findOne({ _id: txn?.order });

      if (order) {
        order.paymentStatus = "paid";
        order.paymentMethod = "razorpay";
        order.razorpay = order.razorpay || {};
        order.razorpay.order_id = razorpayOrderId;
        order.razorpay.payment_id = razorpayPaymentId;
        order.razorpay.amount = amount;
        await order.save();

        // Clear user's cart after successful payment
        try {
          await User.updateOne({ _id: order.user }, { $set: { cart: [] } });
        } catch (e) {
          console.warn("Failed to clear cart after Razorpay payment:", e.message);
        }
      }

      // respond 200 quickly
      return res.json({ ok: true });
    }

    // payment failed
    if (event === "payment.failed") {
      const payment = payload.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const txn = await Transaction.findOne({ razorpay_order_id: razorpayOrderId });
      if (txn) {
        txn.status = "failed";
        txn.payload = payload;
        await txn.save();
      }

      const order = await Order.findOne({ "razorpay.order_id": razorpayOrderId });
      if (order) {
        order.paymentStatus = "failed";
        await order.save();
      }

      return res.json({ ok: true });
    }

    // For other events, just ack
    return res.json({ ok: true });
  } catch (err) {
    console.error("razorpayWebhook error:", err);
    return res.status(500).send("Error");
  }
};

/**
 * Optional endpoint for clients to verify payment after checkout
 * (client typically posts { orderId, paymentId, signature } to verify)
 * This endpoint can be used if you want server-side verification before marking paid,
 * but webhook is authoritative.
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // compute signature for order_id|payment_id
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // update transaction & order
    const txn = await Transaction.findOne({ razorpay_order_id });
    if (txn) {
      txn.razorpay_payment_id = razorpay_payment_id;
      txn.razorpay_signature = razorpay_signature;
      txn.status = "captured";
      await txn.save();
    }

    const order = await Order.findOne({ "razorpay.order_id": razorpay_order_id });
    if (order) {
      order.paymentStatus = "paid";
      order.paymentMethod = "razorpay";
      order.razorpay = order.razorpay || {};
      order.razorpay.payment_id = razorpay_payment_id;
      await order.save();

      // Clear user's cart after server-side verification success
      try {
        await User.updateOne({ _id: order.user }, { $set: { cart: [] } });
      } catch (e) {
        console.warn("Failed to clear cart after Razorpay verify:", e.message);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("verifyPayment:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrderForPayment, razorpayWebhook, verifyPayment };
