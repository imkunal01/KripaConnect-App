const Subcategory = require('../models/Subcategory');

// Get active subcategories (optionally by category_id)
exports.getSubcategories = async (req, res) => {
  try {
    const { category_id } = req.query;
    const filter = { status: 'active' };
    if (category_id) filter.category_id = category_id;

    const items = await Subcategory.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
