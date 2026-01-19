const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");
const slugify = require("slugify");
const { uploadBuffer } = require("../services/cloudinaryService");

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Create subcategory (Admin only) with logo upload
const createSubcategoryAdmin = async (req, res) => {
  try {
    const { name, slug, status, category_id } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!category_id) return res.status(400).json({ message: "category_id is required" });

    const category = await Category.findById(category_id).lean();
    if (!category) return res.status(400).json({ message: "Invalid category_id" });

    const nameTrim = String(name).trim();
    const slugValue = slugify(slug || nameTrim, { lower: true, strict: true });

    const existing = await Subcategory.findOne({
      $or: [
        { slug: slugValue },
        { name: new RegExp(`^${escapeRegex(nameTrim)}$`, "i") },
      ],
    });
    if (existing) return res.status(400).json({ message: "Subcategory already exists" });

    let logoUrl = "";
    if (req.file && req.file.buffer) {
      const uploaded = await uploadBuffer(req.file.buffer, "ecom_subcategories");
      logoUrl = uploaded.url;
    }

    const subcategory = await Subcategory.create({
      name: nameTrim,
      slug: slugValue,
      logo: logoUrl,
      status: status || "active",
      category_id,
    });

    res.status(201).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update subcategory (Admin only)
const updateSubcategoryAdmin = async (req, res) => {
  try {
    const { name, slug, status } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) return res.status(404).json({ message: "Subcategory not found" });

    const originalName = subcategory.name;
    const nextName = name ? String(name).trim() : subcategory.name;
    const slugProvided = slug !== undefined && String(slug).trim() !== "";
    let nextSlug = subcategory.slug;

    if (slugProvided) {
      nextSlug = slugify(slug, { lower: true, strict: true });
    } else if (name && nextName !== subcategory.name) {
      nextSlug = slugify(nextName, { lower: true, strict: true });
    }

    if (name || slugProvided) {
      const existing = await Subcategory.findOne({
        _id: { $ne: subcategory._id },
        $or: [
          { slug: nextSlug },
          { name: new RegExp(`^${escapeRegex(nextName)}$`, "i") },
        ],
      });
      if (existing) return res.status(400).json({ message: "Subcategory already exists" });
    }

    if (name) subcategory.name = nextName;
    if (slugProvided || (name && nextName !== originalName)) subcategory.slug = nextSlug;

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      subcategory.status = status;
    }

    if (req.file && req.file.buffer) {
      const uploaded = await uploadBuffer(req.file.buffer, "ecom_subcategories");
      subcategory.logo = uploaded.url;
    }

    await subcategory.save();
    res.json(subcategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List subcategories (Admin only)
const listSubcategoriesAdmin = async (req, res) => {
  try {
    const { category_id } = req.query;
    const filter = category_id ? { category_id } : {};
    const items = await Subcategory.find(filter)
      .populate("category_id", "name")
      .sort({ name: 1 })
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSubcategoryAdmin, updateSubcategoryAdmin, listSubcategoriesAdmin };
