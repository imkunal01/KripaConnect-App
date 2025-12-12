const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order.
 * amountINR: number (INR)
 * receipt: string (optional)
 * notes: object (optional)
 */
async function createRazorpayOrder({ amountINR, receipt = null, notes = {} }) {
  const amountPaise = Math.round(Number(amountINR) * 100); // razorpay expects paise (integer)
  const options = {
    amount: amountPaise,
    currency: "INR",
    receipt: receipt || `rcpt_${Date.now()}`,
    payment_capture: 1, // auto-capture (1) or manual (0)
    notes,
  };
  const order = await razorpay.orders.create(options);
  return order; // contains id, amount, currency, status...
}

module.exports = { createRazorpayOrder, razorpay };
