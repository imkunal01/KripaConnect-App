const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

// POST /api/recommend - Natural language recommendation query
router.post("/", recommendationController.getRecommendations);

// GET /api/recommend/similar/:productId - Smart similar products
router.get("/similar/:productId", recommendationController.getSimilarProducts);

module.exports = router;
