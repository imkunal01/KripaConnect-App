const express = require("express");
const router = express.Router();
const analytics = require("../controllers/analyticsControllers");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/overview", protect, adminOnly, analytics.getOverview);
router.get("/revenue", protect, adminOnly, analytics.getRevenueStats);
router.get("/orders", protect, adminOnly, analytics.getOrderStats);
router.get("/top-products", protect, adminOnly, analytics.getTopProducts);
router.get("/user-growth", protect, adminOnly, analytics.getUserGrowth);
router.get("/low-stock", protect, adminOnly, analytics.getLowStock);

module.exports = router;
