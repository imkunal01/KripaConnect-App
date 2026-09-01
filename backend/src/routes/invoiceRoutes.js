const express = require("express");
const router = express.Router();
const { downloadInvoice, generateInvoice } = require("../controllers/invoiceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Customer / Retailer / Admin download invoice PDF
router.get("/:orderId", protect, downloadInvoice);

// Admin generate & email invoice
router.post("/:orderId", protect, adminOnly, generateInvoice);

module.exports = router;
