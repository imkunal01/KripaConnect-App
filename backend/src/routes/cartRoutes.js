const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cartController");

router.get("/", protect, getCart);
router.post("/add", protect, addItem);
router.put("/item/:productId", protect, updateItem);
router.delete("/item/:productId", protect, removeItem);

module.exports = router;

