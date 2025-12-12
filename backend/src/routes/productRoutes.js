const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { createProductRules, updateProductRules, validate } = require('../validators/ProductValidator');

// Public listing and view
router.get("/", productController.listProducts);
router.get("/:id", productController.getProduct);

// Admin routes (protected)
router.post("/", protect, adminOnly, upload.array("images", 6), createProductRules, validate, productController.createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 6), updateProductRules, validate, productController.updateProduct);
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

// remove single image: DELETE /api/products/:productId/image/:publicId
router.delete("/:productId/image/:publicId", protect, adminOnly, productController.removeImage);

module.exports = router;