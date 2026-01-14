const Product = require("../models/Product");
const Category = require("../models/Category");
const slugify = require("slugify");
const { uploadBuffer, deleteById } = require("../services/cloudinaryService");
const { getOrSetCache, invalidatePattern, invalidateCache, hashQueryParams } = require('../utils/cacheUtils');

/* =====================================
   🔧 TAG NORMALIZER (CRITICAL FIX)
   ===================================== */
function normalizeTags(input) {
  if (!input) return [];

  // If already array → normalize each value
  if (Array.isArray(input)) {
    return input
      .flatMap(normalizeTags)
      .map(t => String(t).trim())
      .filter(Boolean);
  }

  let value = String(input).trim();

  // Try parsing JSON (handles '["fan"]', '"fan"', etc.)
  try {
    const parsed = JSON.parse(value);
    return normalizeTags(parsed);
  } catch {
    // ignore
  }

  // Remove wrapping quotes
  value = value.replace(/^["']+|["']+$/g, "").trim();

  // Split comma-separated values
  return value
    .split(",")
    .map(t => t.trim().replace(/^["']+|["']+$/g, ""))
    .filter(Boolean);
}

/* =====================================
   CREATE PRODUCT (ADMIN)
   ===================================== */
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

    // Prevent duplicate product
    const existing = await Product.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Product with same name exists" });
    }

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
      tags: normalizeTags(tags),
    });

    // Handle images
    if (req.files && req.files.length > 0) {
      const uploads = [];
      for (const file of req.files) {
        const uploaded = await uploadBuffer(file.buffer);
        uploads.push(uploaded);
      }
      product.images = uploads;
    }

    await product.save();
    
    // Invalidate all product list caches
    await invalidatePattern('products:list:*');
    
    res.status(201).json(product);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

/* =====================================
   LIST PRODUCTS (FILTER / SEARCH)
   ===================================== */
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

    // Generate cache key based on query params
    const queryHash = hashQueryParams(req.query);
    const cacheKey = `products:list:${queryHash}`;

    const result = await getOrSetCache(
      cacheKey,
      300, // 5 minutes
      async () => {
        const filter = { active: true };

    /* ---- Search ---- */
    const searchText = search || q;
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    /* ---- Category ---- */
    const catParam = categories || category;
    if (catParam) {
      const ids = Array.isArray(catParam)
        ? catParam
        : String(catParam).split(",").map(s => s.trim());
      filter.Category = ids.length > 1 ? { $in: ids } : ids[0];
    }

    /* ---- Price ---- */
    const minVal = minPrice ?? min;
    const maxVal = maxPrice ?? max;

    if (minVal !== undefined) {
      filter.price = { ...(filter.price || {}), $gte: Number(minVal) };
    }
    if (maxVal !== undefined) {
      filter.price = { ...(filter.price || {}), $lte: Number(maxVal) };
    }

    /* ---- Availability ---- */
    if (availability === "in") filter.stock = { $gt: 0 };
    if (availability === "out") filter.stock = { $lte: 0 };

    /* ---- Brand / Tags ---- */
    if (brand) {
      const brands = normalizeTags(brand);
      if (brands.length > 0) {
        filter.tags = { $in: brands };
      }
    }

    /* ---- Pagination ---- */
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    // Use lean() for faster read-only queries and select only needed fields
    let query = Product.find(filter)
      .select("name slug description price retailer_price price_bulk min_bulk_qty stock images tags active Category")
      .populate("Category", "name slug")
      .skip(skip)
      .limit(limitNum)
      .lean();

    if (sort) query = query.sort(sort);

        // Run queries in parallel for better performance
        const [items, total] = await Promise.all([
          query.exec(),
          Product.countDocuments(filter)
        ]);

        return {
          items,
          meta: { page: Number(page), limit: limitNum, total }
        };
      },
      true // Log cache hits/misses
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* =====================================
   GET SINGLE PRODUCT
   ===================================== */
async function getProduct(req, res) {
  try {
    const cacheKey = `product:${req.params.id}`;
    
    const product = await getOrSetCache(
      cacheKey,
      1800, // 30 minutes
      async () => {
        return await Product.findById(req.params.id)
          .populate("Category", "name slug")
          .lean();
      },
      true
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* =====================================
   UPDATE PRODUCT (ADMIN)
   ===================================== */
async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    const updates = req.body;

    if (updates.name && updates.name !== product.name) {
      product.name = updates.name;
      product.slug = slugify(updates.name, { lower: true, strict: true });
    }

    const fields = [
      "description",
      "price",
      "retailer_price",
      "price_bulk",
      "min_bulk_qty",
      "stock",
      "active"
    ];

    fields.forEach(field => {
      if (updates[field] !== undefined) {
        product[field] = updates[field];
      }
    });

    if (updates.category !== undefined) product.Category = updates.category;
    if (updates.Category !== undefined) product.Category = updates.Category;

    if (updates.tags !== undefined) {
      product.tags = normalizeTags(updates.tags);
    }

    // Append images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadBuffer(file.buffer);
        product.images.push(uploaded);
      }
    }

    await product.save();
    
    // Invalidate product detail and list caches
    await Promise.all([
      invalidateCache(`product:${req.params.id}`),
      invalidatePattern('products:list:*')
    ]);
    
    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* =====================================
   DELETE PRODUCT
   ===================================== */
async function deleteProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    if (product.images?.length) {
      for (const img of product.images) {
        if (img.public_id) {
          try {
            await deleteById(img.public_id);
          } catch (e) {
            console.warn("Cloudinary delete failed:", e.message);
          }
        }
      }
    }

    await product.deleteOne();
    
    // Invalidate product detail and list caches
    await Promise.all([
      invalidateCache(`product:${req.params.id}`),
      invalidatePattern('products:list:*')
    ]);
    
    res.json({ message: "Product deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* =====================================
   REMOVE SINGLE IMAGE
   ===================================== */
async function removeImage(req, res) {
  try {
    const { productId, publicId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await deleteById(publicId);

    product.images = product.images.filter(
      img => img.public_id !== publicId
    );

    await product.save();
    
    // Invalidate product detail cache (image changed)
    await invalidateCache(`product:${productId}`);
    
    res.json({ message: "Image removed", product });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* =====================================
   RETAILER PRODUCTS
   ===================================== */
async function getRetailerProducts(req, res) {
  try {
    if (req.user.role !== "retailer") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const products = await Product.find({ active: true })
      .select("name description images stock price retailer_price price_bulk min_bulk_qty Category tags")
      .populate("Category", "name slug")
      .lean();

    res.json({ success: true, data: products });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* =====================================
   EXPORTS
   ===================================== */
module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  removeImage,
  getRetailerProducts
};
