const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const productController = require("../controllers/productController");
const retailerOrderController = require("../controllers/retailerOrderController");

// Retailer product listing
router.get("/products", protect, productController.getRetailerProducts);

// Retailer create bulk order
router.post("/orders", protect, retailerOrderController.createRetailerOrder);

// Retailer order history
router.get("/orders", protect, retailerOrderController.getRetailerOrders);

module.exports = router;
