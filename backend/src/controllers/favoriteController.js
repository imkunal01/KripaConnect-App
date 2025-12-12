const User = require("../models/User");
const Product = require("../models/Product");

async function getFavorites(req, res) {
  try {
    const user = await User.findById(req.user._id).populate("favorites", "name price images stock");
    const items = (user?.favorites || []).map(p => ({ _id: p._id, name: p.name, price: p.price, images: p.images, stock: p.stock }));
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addFavorite(req, res) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const user = await User.findById(req.user._id).select("favorites");
    const exists = user.favorites.some(id => String(id) === String(productId));
    if (!exists) {
      user.favorites.push(productId);
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function removeFavorite(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    const user = await User.findById(req.user._id).select("favorites");
    user.favorites = user.favorites.filter(id => String(id) !== String(productId));
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite };

