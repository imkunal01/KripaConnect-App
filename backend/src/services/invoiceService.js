const fs = require("fs");
const path = require("path");
const { generateInvoicePDF } = require("./pdfService");
const { uploadBuffer } = require("./cloudinaryService");
const { sendMail } = require("./emailService");
const Order = require("../models/Order");
const User = require("../models/User");

/**
 * Creates and sends invoice for a given orderId
 */
async function generateAndSendInvoice(orderId) {
  const order = await Order.findById(orderId).populate("user");
  if (!order) throw new Error("Order not found");

  const user = order.user;
  const filePath = await generateInvoicePDF(order, user);

  // upload PDF to Cloudinary
  const buffer = fs.readFileSync(filePath);
  const cloudUpload = await uploadBuffer(buffer, "ecom_invoices");

  // update order with invoice URL
  order.invoiceUrl = cloudUpload.url;
  await order.save();

  // email user
  const html = `
    <h3>Hi ${user.name},</h3>
    <p>Thank you for your purchase!</p>
    <p>Your invoice for order <strong>#${order._id}</strong> is ready.</p>
    <p><a href="${cloudUpload.url}" target="_blank">Download Invoice</a></p>
  `;
  await sendMail({
    to: user.email,
    subject: `Invoice for Order #${order._id}`,
    html,
  });

  // delete temp file
  fs.unlinkSync(filePath);

  return cloudUpload.url;
}

module.exports = { generateAndSendInvoice };
    