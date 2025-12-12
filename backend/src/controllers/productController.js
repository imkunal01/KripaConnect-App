const Product = require("../models/Product");
const Category = require("../models/Category");
const slugify = require("slugify");
const { uploadBuffer, deleteById } = require("../services/cloudinaryService");

// Create product (admin)
async function createProduct(req, res) {
  try {
    const {
      name,
      description,
      category,
      price,
      retailer_price,
      price_bulk,
      min_bulk_qty,
      stock,
      tags
    } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    // prevent duplicate slug
    const existing = await Product.findOne({ slug });
    if (existing) return res.status(400).json({ message: "Product with same name exists" });

    const product = new Product({
      name,
      slug,
      description,
      Category: category || undefined,
      price,
      retailer_price,
      price_bulk,
      min_bulk_qty,
      stock,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim())) : [],
    });

    // handle files (req.files expected)
    if (req.files && req.files.length > 0) {
      const uploads = [];
      for (const file of req.files) {
        const resUpload = await uploadBuffer(file.buffer);
        uploads.push(resUpload);
      }
      product.images = uploads;
    }

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// Get list with pagination, search, filter, sort
async function listProducts(req, res) {
  try {
    const {
      page = 1,
      limit = 12,
      q,
      search,
      category,
      categories,
      min,
      max,
      minPrice,
      maxPrice,
      brand,
      availability,
      sort
    } = req.query;

    const filter = { active: true };

    const searchText = search || q;
    if (searchText) filter.$text = { $search: searchText };

    const catParam = categories || category;
    if (catParam) {
      let ids = [];
      if (Array.isArray(catParam)) ids = catParam;
      else if (typeof catParam === 'string' && catParam.includes(',')) ids = catParam.split(',').map(s => s.trim());
      else ids = [catParam];
      filter.Category = ids.length > 1 ? { $in: ids } : ids[0];
    }

    const minVal = minPrice ?? min;
    const maxVal = maxPrice ?? max;
    if (minVal !== undefined) filter.price = { ...(filter.price || {}), $gte: Number(minVal) };
    if (maxVal !== undefined) filter.price = { ...(filter.price || {}), $lte: Number(maxVal) };

    if (availability === 'in') filter.stock = { $gt: 0 };
    if (availability === 'out') filter.stock = { $lte: 0 };

    if (brand) {
      const brands = Array.isArray(brand) ? brand : String(brand).split(',').map(s => s.trim()).filter(Boolean);
      if (brands.length > 0) filter.tags = { $in: brands };
    }

    const skip = (Number(page) - 1) * Number(limit);
    let query = Product.find(filter).populate("Category", "name slug");
    if (sort) query = query.sort(sort);
    query = query.skip(skip).limit(Number(limit));

    const [items, total] = await Promise.all([query.exec(), Product.countDocuments(filter)]);
    res.json({ items, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get single product
async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id).populate("Category", "name slug");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Update product (admin)
async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    const updates = req.body;
    if (updates.name && updates.name !== product.name) {
      product.name = updates.name;
      product.slug = slugify(updates.name, { lower: true, strict: true });
    }

    // other simple updates
    const fields = ["description", "price", "retailer_price", "price_bulk", "min_bulk_qty", "stock", "active"];
    fields.forEach(f => { if (updates[f] !== undefined) product[f] = updates[f]; });
    if (updates.category !== undefined) product.Category = updates.category;
    if (updates.Category !== undefined) product.Category = updates.Category;

    if (updates.tags) {
      product.tags = Array.isArray(updates.tags) ? updates.tags : updates.tags.split(",").map(t => t.trim());
    }

    // handle new images (append). If you want replace, remove old ones first.
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadBuffer(file.buffer);
        product.images.push(uploaded);
      }
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Delete product (admin)
async function deleteProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    // delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          try { await deleteById(img.public_id); } catch (e) { console.warn("Cloudinary delete failed", e.message); }
        }
      }
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Remove a single image from product
async function removeImage(req, res) {
  try {
    const { productId, publicId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // delete from cloudinary
    await deleteById(publicId);

    // remove from product.images
    product.images = product.images.filter(img => img.public_id !== publicId);
    await product.save();
    res.json({ message: "Image removed", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getRetailerProducts(req, res) {
  try {
    // Ensures user is retailer
    if (req.user.role !== "retailer") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const products = await Product.find({ active: true })
      .select("name images stock retailer_price price_bulk min_bulk_qty");

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  removeImage,
  getRetailerProducts
};
