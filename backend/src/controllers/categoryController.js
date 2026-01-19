const Category = require('../models/Category');
const slugify = require('slugify');
const { getOrSetCache, invalidateCache } = require('../utils/cacheUtils');

// Get all active categories - use lean() for faster read-only query
exports.getCategories = async (req, res) => {
  try {
    const categories = await getOrSetCache(
      'categories:all',
      86400, // 24 hours
      async () => {
        return await Category.find({ status: 'active' }).sort({ name: 1 }).lean();
      },
      true // Log cache hits/misses in dev
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const slug = slugify(name, { lower: true });
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Category already exists' });

    const category = await Category.create({ name, slug, description });
    
    // Invalidate categories cache
    await invalidateCache('categories:all');
    
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    // Invalidate categories cache
    await invalidateCache('categories:all');
    
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
