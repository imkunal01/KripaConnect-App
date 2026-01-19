const Category = require("../models/Category");
const slugify = require("slugify");
const { uploadBuffer } = require("../services/cloudinaryService");
const { invalidateCache } = require("../utils/cacheUtils");

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Create category (Admin only) with logo upload
const createCategoryAdmin = async (req, res) => {
  try {
    const { name, slug, status } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const nameTrim = String(name).trim();
    const slugValue = slugify(slug || nameTrim, { lower: true, strict: true });

    const existing = await Category.findOne({
      $or: [
        { slug: slugValue },
        { name: new RegExp(`^${escapeRegex(nameTrim)}$`, "i") },
      ],
    });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    let logoUrl = "";
    if (req.file && req.file.buffer) {
      const uploaded = await uploadBuffer(req.file.buffer, "ecom_categories");
      logoUrl = uploaded.url;
    }

    const category = await Category.create({
      name: nameTrim,
      slug: slugValue,
      logo: logoUrl,
      status: status || "active",
    });

    // Invalidate categories cache
    await invalidateCache("categories:all");

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category (Admin only)
const updateCategoryAdmin = async (req, res) => {
  try {
    const { name, slug, status } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const originalName = category.name;
    const nextName = name ? String(name).trim() : category.name;
    const slugProvided = slug !== undefined && String(slug).trim() !== "";
    let nextSlug = category.slug;

    if (slugProvided) {
      nextSlug = slugify(slug, { lower: true, strict: true });
    } else if (name && nextName !== category.name) {
      nextSlug = slugify(nextName, { lower: true, strict: true });
    }

    if (name || slugProvided) {
      const existing = await Category.findOne({
        _id: { $ne: category._id },
        $or: [
          { slug: nextSlug },
          { name: new RegExp(`^${escapeRegex(nextName)}$`, "i") },
        ],
      });
      if (existing) return res.status(400).json({ message: "Category already exists" });
    }

    if (name) category.name = nextName;
    if (slugProvided || (name && nextName !== originalName)) category.slug = nextSlug;

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      category.status = status;
    }

    if (req.file && req.file.buffer) {
      const uploaded = await uploadBuffer(req.file.buffer, "ecom_categories");
      category.logo = uploaded.url;
    }

    await category.save();

    await invalidateCache("categories:all");

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List all categories (Admin only)
const listCategoriesAdmin = async (req, res) => {
  try {
    const items = await Category.find({}).sort({ name: 1 }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category status (Admin only)
const updateCategoryStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["active", "inactive"];

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const nextStatus = status || (category.status === "active" ? "inactive" : "active");
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    category.status = nextStatus;
    await category.save();

    await invalidateCache("categories:all");

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCategoryAdmin, updateCategoryAdmin, updateCategoryStatusAdmin, listCategoriesAdmin };
