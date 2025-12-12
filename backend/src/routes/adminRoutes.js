const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const adminController = require("../controllers/adminController");
const adminOrderController = require("../controllers/adminOrderController");

// USER MANAGEMENT
router.get("/users", protect, adminOnly, adminController.getAllUsers);
router.put("/users/block/:id", protect, adminOnly, adminController.toggleBlockUser);
router.put("/users/role/:id", protect, adminOnly, adminController.updateUserRole);
router.delete("/users/:id", protect, adminOnly, adminController.deleteUser);
router.get("/stats", protect, adminOnly, adminController.getStats);

// ORDER MANAGEMENT
router.get("/orders", protect, adminOnly, adminOrderController.getAllOrdersAdmin);
router.get("/retailer-orders", protect, adminOnly, adminOrderController.getRetailerOrdersAdmin);
router.put("/orders/status/:id", protect, adminOnly, adminOrderController.updateOrderStatusAdmin);
router.delete("/orders/:id", protect, adminOnly, adminOrderController.deleteOrderAdmin);

module.exports = router;
