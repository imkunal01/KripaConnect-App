const User = require("../models/User");
const Product = require("../models/Product");

function normalizePurchaseMode(value, isRetailer) {
  if (!isRetailer) return "customer";
  return value === "retailer" ? "retailer" : "customer";
}

function computeBulkConfig(product) {
  const minBulkQty = product.min_bulk_qty > 0 ? product.min_bulk_qty : 1;
  const bulkUnitPrice = product.price_bulk || product.retailer_price || product.price;
  return { minBulkQty, bulkUnitPrice };
}

// Helper to map cart items consistently
function mapCartItems(cartItems, isRetailer, purchaseMode) {
  return cartItems.map(it => {
    const product = it.product;
    if (!product || !product._id) return null;
    
    let price = product.price;
    const effectivePurchaseMode = normalizePurchaseMode(purchaseMode, isRetailer);
    const retailerBulk = isRetailer && effectivePurchaseMode === "retailer";
    if (retailerBulk) {
      price = computeBulkConfig(product).bulkUnitPrice;
    }
    
    return {
      product: product._id,
      name: product.name,
      price,
      image: product.images?.[0]?.url,
      stock: product.stock,
      qty: it.qty,
      ...(retailerBulk ? (() => {
        const { minBulkQty, bulkUnitPrice } = computeBulkConfig(product);
        return {
          regularPrice: product.price,
          bulkPrice: bulkUnitPrice,
          minBulkQty,
          isBulkPrice: true,
        };
      })() : {})
    };
  }).filter(Boolean);
}

async function getCart(req, res) {
  try {
    const isRetailer = req.user.role === "retailer";
    const effectivePurchaseMode = normalizePurchaseMode(req.query?.purchaseMode, isRetailer);
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
    
    res.json({ success: true, data: mapCartItems(validItems, isRetailer, effectivePurchaseMode) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addItem(req, res) {
  try {
    const { productId, qty = 1, purchaseMode } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    
    const product = await Product.findById(productId).select("stock min_bulk_qty price_bulk name price images retailer_price").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.stock <= 0) return res.status(400).json({ success: false, message: "Out of stock" });

    const isRetailer = req.user.role === "retailer";
    const effectivePurchaseMode = normalizePurchaseMode(purchaseMode, isRetailer);
    const requestedQty = Math.max(1, Number(qty) || 1);
    
    const user = await User.findById(req.user._id).select("cart");

    if (isRetailer && effectivePurchaseMode === "retailer") {
      const { minBulkQty } = computeBulkConfig(product);
      if (requestedQty < minBulkQty) {
        return res.status(400).json({
          success: false,
          message: `Minimum quantity of ${minBulkQty} required for retailer purchase`,
        });
      }
    }
    const idx = user.cart.findIndex(i => String(i.product) === String(productId));
    
    if (idx >= 0) {
      user.cart[idx].qty = Math.min(user.cart[idx].qty + requestedQty, product.stock);
    } else {
      user.cart.push({ product: productId, qty: Math.min(requestedQty, product.stock) });
    }
    await user.save();
    
    // Return the added/updated item directly to avoid extra API call
    let price = product.price;
    const retailerBulk = isRetailer && effectivePurchaseMode === "retailer";
    if (retailerBulk) {
      price = computeBulkConfig(product).bulkUnitPrice;
    }
    
    res.json({ 
      success: true,
      item: {
        product: productId,
        name: product.name,
        price,
        image: product.images?.[0]?.url,
        stock: product.stock,
        qty: idx >= 0 ? user.cart[idx].qty : Math.min(requestedQty, product.stock),
        ...(retailerBulk ? (() => {
          const { minBulkQty, bulkUnitPrice } = computeBulkConfig(product);
          return {
            regularPrice: product.price,
            bulkPrice: bulkUnitPrice,
            minBulkQty,
            isBulkPrice: true,
          };
        })() : {})
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateItem(req, res) {
  try {
    const { productId } = req.params;
    const { qty, purchaseMode } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    
    const product = await Product.findById(productId).select("stock min_bulk_qty price_bulk name price images retailer_price").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    
    const isRetailer = req.user.role === "retailer";
    const effectivePurchaseMode = normalizePurchaseMode(purchaseMode, isRetailer);
    const nextQty = Number(qty);
    
    if (isRetailer && effectivePurchaseMode === "retailer") {
      const { minBulkQty } = computeBulkConfig(product);
      if (nextQty > 0 && nextQty < minBulkQty) {
        return res.status(400).json({
          success: false,
          message: `Minimum quantity of ${minBulkQty} required for retailer purchase`,
        });
      }
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
    const retailerBulk = isRetailer && effectivePurchaseMode === "retailer";
    if (retailerBulk) {
      price = computeBulkConfig(product).bulkUnitPrice;
    }
    
    res.json({ 
      success: true,
      item: {
        product: productId,
        name: product.name,
        price,
        image: product.images?.[0]?.url,
        stock: product.stock,
        qty: user.cart[idx].qty,
        ...(retailerBulk ? (() => {
          const { minBulkQty, bulkUnitPrice } = computeBulkConfig(product);
          return {
            regularPrice: product.price,
            bulkPrice: bulkUnitPrice,
            minBulkQty,
            isBulkPrice: true,
          };
        })() : {})
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

