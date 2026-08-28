const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getCart, addItem, updateItem, removeItem, mergeCart } = require("../controllers/cartController");

router.get("/", protect, getCart);
router.post("/add", protect, addItem);
router.post("/merge", protect, mergeCart);
router.put("/item/:productId", protect, updateItem);
router.delete("/item/:productId", protect, removeItem);

module.exports = router;

