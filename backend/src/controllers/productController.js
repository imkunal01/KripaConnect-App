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
      category, // category id optional
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
      category: category || undefined,
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
    const { page = 1, limit = 12, q, category, min, max, sort } = req.query;
    const filter = { active: true };

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (min) filter.price = { ...(filter.price || {}), $gte: Number(min) };
    if (max) filter.price = { ...(filter.price || {}), $lte: Number(max) };

    const skip = (Number(page) - 1) * Number(limit);``
    let query = Product.find(filter).populate("Category", "name slug");
    if (sort) query = query.sort(sort);
    query = query.skip(skip).limit(Number(limit));

    const [items, total] = await Promise.all([query.exec(), Product.countDocuments(filter)]);
    res.json({
      items,
      meta: { page: Number(page), limit: Number(limit), total },
    });
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
    const fields = ["description", "category", "price", "retailer_price", "price_bulk", "min_bulk_qty", "stock", "active"];
    fields.forEach(f => { if (updates[f] !== undefined) product[f] = updates[f]; });

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

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  removeImage
};
