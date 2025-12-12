const User = require("../models/User");
const Product = require("../models/Product");

async function getCart(req, res) {
  try {
    const user = await User.findById(req.user._id).populate("cart.product", "name price images stock");
    const items = (user?.cart || []).map(it => ({
      product: it.product?._id || it.product,
      name: it.product?.name,
      price: it.product?.price,
      image: it.product?.images?.[0]?.url,
      stock: it.product?.stock,
      qty: it.qty
    }));
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addItem(req, res) {
  try {
    const { productId, qty = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.stock <= 0) return res.status(400).json({ success: false, message: "Out of stock" });

    const user = await User.findById(req.user._id).select("cart");
    const idx = user.cart.findIndex(i => String(i.product) === String(productId));
    if (idx >= 0) {
      const nextQty = user.cart[idx].qty + Number(qty);
      user.cart[idx].qty = Math.max(1, Math.min(nextQty, product.stock));
    } else {
      user.cart.push({ product: productId, qty: Math.min(Number(qty) || 1, product.stock) });
    }
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateItem(req, res) {
  try {
    const { productId } = req.params;
    const { qty } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    const product = await Product.findById(productId).select("stock");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const user = await User.findById(req.user._id).select("cart");
    const idx = user.cart.findIndex(i => String(i.product) === String(productId));
    if (idx < 0) return res.status(404).json({ success: false, message: "Item not in cart" });
    const nextQty = Number(qty);
    if (!nextQty || nextQty <= 0) {
      user.cart.splice(idx, 1);
    } else {
      user.cart[idx].qty = Math.min(nextQty, product.stock);
    }
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function removeItem(req, res) {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id).select("cart");
    user.cart = user.cart.filter(i => String(i.product) !== String(productId));
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };

