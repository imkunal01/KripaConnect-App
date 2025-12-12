const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { listByProduct, create } = require("../controllers/reviewController");

router.get("/product/:productId", listByProduct);
router.post("/product/:productId", protect, create);

module.exports = router;

