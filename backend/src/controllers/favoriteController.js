const User = require("../models/User");
const Product = require("../models/Product");

async function getFavorites(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("favorites")
      .populate("favorites", "name price images stock")
      .lean();
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    // Filter out any null products (deleted products)
    const validFavorites = (user.favorites || []).filter(p => p && p._id);
    const items = validFavorites.map(p => ({ 
      _id: p._id, 
      name: p.name, 
      price: p.price, 
      images: p.images, 
      stock: p.stock 
    }));
    
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addFavorite(req, res) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    
    // Verify product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) return res.status(404).json({ success: false, message: "Product not found" });

    // Use atomic $addToSet to avoid duplicates and reduce queries
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: productId }
    });
    
    res.json({ success: true, productId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function removeFavorite(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    
    // Use atomic $pull to remove favorite
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: productId }
    });
    
    res.json({ success: true, productId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite };

