const User = require("../models/User");
const Product = require("../models/Product");

// Helper to map cart items consistently
function mapCartItems(cartItems, isRetailer) {
  return cartItems.map(it => {
    const product = it.product;
    if (!product || !product._id) return null;
    
    let price = product.price;
    if (isRetailer) {
      if (it.qty >= product.min_bulk_qty && product.price_bulk) {
        price = product.price_bulk;
      } else if (product.retailer_price) {
        price = product.retailer_price;
      }
    }
    
    return {
      product: product._id,
      name: product.name,
      price,
      image: product.images?.[0]?.url,
      stock: product.stock,
      qty: it.qty,
      ...(isRetailer ? {
        regularPrice: product.price,
        retailerPrice: product.retailer_price,
        bulkPrice: product.price_bulk,
        minBulkQty: product.min_bulk_qty,
        isBulkPrice: it.qty >= product.min_bulk_qty && !!product.price_bulk
      } : {})
    };
  }).filter(Boolean);
}

async function getCart(req, res) {
  try {
    const isRetailer = req.user.role === "retailer";
    const user = await User.findById(req.user._id)
      .select("cart")
      .populate("cart.product", "name price images stock retailer_price price_bulk min_bulk_qty")
      .lean();
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const validItems = (user.cart || []).filter(it => it.product && it.product._id);
    
    // Auto-cleanup invalid items (products that were deleted)
    if (user.cart?.length !== validItems.length) {
      await User.findByIdAndUpdate(req.user._id, {
        cart: validItems.map(it => ({ product: it.product._id, qty: it.qty }))
      });
    }
    
    res.json({ success: true, data: mapCartItems(validItems, isRetailer) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addItem(req, res) {
  try {
    const { productId, qty = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    
    const product = await Product.findById(productId).select("stock min_bulk_qty price_bulk name price images retailer_price").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.stock <= 0) return res.status(400).json({ success: false, message: "Out of stock" });

    const isRetailer = req.user.role === "retailer";
    const requestedQty = Math.max(1, Number(qty) || 1);
    
    if (isRetailer && product.min_bulk_qty > 0 && product.price_bulk && requestedQty < product.min_bulk_qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum quantity of ${product.min_bulk_qty} required for bulk pricing` 
      });
    }

    const user = await User.findById(req.user._id).select("cart");
    const idx = user.cart.findIndex(i => String(i.product) === String(productId));
    
    if (idx >= 0) {
      user.cart[idx].qty = Math.min(user.cart[idx].qty + requestedQty, product.stock);
    } else {
      user.cart.push({ product: productId, qty: Math.min(requestedQty, product.stock) });
    }
    await user.save();
    
    // Return the added/updated item directly to avoid extra API call
    let price = product.price;
    if (isRetailer) {
      const finalQty = idx >= 0 ? user.cart[idx].qty : Math.min(requestedQty, product.stock);
      if (finalQty >= product.min_bulk_qty && product.price_bulk) {
        price = product.price_bulk;
      } else if (product.retailer_price) {
        price = product.retailer_price;
      }
    }
    
    res.json({ 
      success: true,
      item: {
        product: productId,
        name: product.name,
        price,
        image: product.images?.[0]?.url,
        stock: product.stock,
        qty: idx >= 0 ? user.cart[idx].qty : Math.min(requestedQty, product.stock)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateItem(req, res) {
  try {
    const { productId } = req.params;
    const { qty } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    
    const product = await Product.findById(productId).select("stock min_bulk_qty price_bulk name price images retailer_price").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    const isRetailer = req.user.role === "retailer";
    const nextQty = Number(qty);
    
    if (isRetailer && product.min_bulk_qty > 0 && product.price_bulk && nextQty > 0 && nextQty < product.min_bulk_qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum quantity of ${product.min_bulk_qty} required for bulk pricing` 
      });
    }
    
    const user = await User.findById(req.user._id).select("cart");
    const idx = user.cart.findIndex(i => String(i.product) === String(productId));
    if (idx < 0) return res.status(404).json({ success: false, message: "Item not in cart" });
    
    const removed = !nextQty || nextQty <= 0;
    if (removed) {
      user.cart.splice(idx, 1);
    } else {
      user.cart[idx].qty = Math.min(nextQty, product.stock);
    }
    await user.save();
    
    // Return updated item info to avoid extra API call
    if (removed) {
      return res.json({ success: true, removed: true, productId });
    }
    
    let price = product.price;
    if (isRetailer) {
      if (user.cart[idx].qty >= product.min_bulk_qty && product.price_bulk) {
        price = product.price_bulk;
      } else if (product.retailer_price) {
        price = product.retailer_price;
      }
    }
    
    res.json({ 
      success: true,
      item: {
        product: productId,
        name: product.name,
        price,
        image: product.images?.[0]?.url,
        stock: product.stock,
        qty: user.cart[idx].qty
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function removeItem(req, res) {
  try {
    const { productId } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { cart: { product: productId } }
    });
    res.json({ success: true, productId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };

