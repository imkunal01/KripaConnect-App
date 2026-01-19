const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const adminController = require("../controllers/adminController");
const adminOrderController = require("../controllers/adminOrderController");
const adminCategoryController = require("../controllers/adminCategoryController");
const adminSubcategoryController = require("../controllers/adminSubcategoryController");

// USER MANAGEMENT
router.get("/users", protect, adminOnly, adminController.getAllUsers);
router.put("/users/block/:id", protect, adminOnly, adminController.toggleBlockUser);
router.put("/users/role/:id", protect, adminOnly, adminController.updateUserRole);
router.delete("/users/:id", protect, adminOnly, adminController.deleteUser);
router.get("/stats", protect, adminOnly, adminController.getStats);

// ORDER MANAGEMENT
router.get("/orders", protect, adminOnly, adminOrderController.getAllOrdersAdmin);
router.get("/orders/:id", protect, adminOnly, adminOrderController.getOrderByIdAdmin);
router.get("/retailer-orders", protect, adminOnly, adminOrderController.getRetailerOrdersAdmin);
router.put("/orders/status/:id", protect, adminOnly, adminOrderController.updateOrderStatusAdmin);
router.delete("/orders/:id", protect, adminOnly, adminOrderController.deleteOrderAdmin);

// CATEGORY MANAGEMENT
router.get("/categories", protect, adminOnly, adminCategoryController.listCategoriesAdmin);
router.post("/categories", protect, adminOnly, upload.single("logo"), adminCategoryController.createCategoryAdmin);
router.put("/categories/:id", protect, adminOnly, upload.single("logo"), adminCategoryController.updateCategoryAdmin);
router.patch("/categories/:id/status", protect, adminOnly, adminCategoryController.updateCategoryStatusAdmin);

// SUBCATEGORY MANAGEMENT
router.get("/subcategories", protect, adminOnly, adminSubcategoryController.listSubcategoriesAdmin);
router.post("/subcategories", protect, adminOnly, upload.single("logo"), adminSubcategoryController.createSubcategoryAdmin);
router.put("/subcategories/:id", protect, adminOnly, upload.single("logo"), adminSubcategoryController.updateSubcategoryAdmin);

module.exports = router;
