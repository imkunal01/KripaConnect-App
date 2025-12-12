const Review = require("../models/Review");
const Product = require("../models/Product");

async function listByProduct(req, res) {
  try {
    const { productId } = req.params;
    const items = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    const data = items.map(r => ({
      _id: r._id,
      user: { _id: r.user?._id, name: r.user?.name },
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const { productId } = req.params;
    const { rating, text } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Invalid rating" });
    if (!text || String(text).trim().length < 3) return res.status(400).json({ success: false, message: "Invalid text" });

    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    try {
      const doc = await Review.create({ user: req.user._id, product: productId, rating, text: String(text).trim() });
      return res.status(201).json({ success: true, data: { _id: doc._id } });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: "You have already reviewed this product" });
      }
      throw e;
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listByProduct, create };

