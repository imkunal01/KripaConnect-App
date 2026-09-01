const fs = require("fs");
const path = require("path");
const Order = require("../models/Order");
const User = require("../models/User");
const { generateInvoicePDF } = require("../services/pdfService");
const { generateAndSendInvoice } = require("../services/invoiceService");

/**
 * Streams or downloads the GST Tax Invoice PDF for an order.
 * Accessible by the order owner or admin.
 */
const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId).populate("user").populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Authorization check
    const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this invoice" });
    }

    const user = order.user || req.user;
    const filePath = await generateInvoicePDF(order, user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="GST_Invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf"`
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on("end", () => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to clean up temp invoice file:", err);
      }
    });

    stream.on("error", (err) => {
      console.error("Stream error serving invoice:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream invoice" });
      }
    });
  } catch (error) {
    console.error("Error downloading invoice:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Failed to generate invoice" });
    }
  }
};

/**
 * Admin endpoint to generate invoice and email it to the user.
 */
const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const url = await generateAndSendInvoice(orderId);
    return res.json({ success: true, message: "Invoice generated and sent", invoiceUrl: url });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { downloadInvoice, generateInvoice };
