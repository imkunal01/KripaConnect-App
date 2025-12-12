const express = require("express");
const router = express.Router();
const { generateInvoice } = require("../controllers/invoiceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/:orderId", protect, adminOnly, generateInvoice);

module.exports = router;
