const Product = require('../models/Product');
const User = require('../models/User');
const { invalidateMultipleKeys } = require('../utils/cacheUtils');
const { deleteById } = require('../services/cloudinaryService');

/**
 * Handle multi-selection bulk actions on products
 */
const bulkProductAction = async (req, res) => {
  try {
    const { productIds, action, payload = {} } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one product' });
    }

    let result;
    let successMessage = '';

    switch (action) {
      // 1. Set Active / Inactive
      case 'setActive': {
        const isActive = Boolean(payload.active);
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { active: isActive } }
        );
        successMessage = `Marked ${result.modifiedCount} product(s) as ${isActive ? 'Active' : 'Inactive'}`;
        break;
      }

      // 2. Set Exact Stock
      case 'setStock': {
        const stockQty = Math.max(0, Math.floor(Number(payload.stock) || 0));
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { stock: stockQty } }
        );
        successMessage = `Updated stock to ${stockQty} for ${result.modifiedCount} product(s)`;
        break;
      }

      // 3. Adjust Stock (+/- delta)
      case 'adjustStock': {
        const delta = Number(payload.delta) || 0;
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $inc: { stock: delta } }
        );
        // Ensure stock does not drop below 0
        await Product.updateMany(
          { _id: { $in: productIds }, stock: { $lt: 0 } },
          { $set: { stock: 0 } }
        );
        successMessage = `Adjusted stock by ${delta > 0 ? `+${delta}` : delta} for ${result.modifiedCount} product(s)`;
        break;
      }

      // 4. Force Out of Stock
      case 'setOutOfStock': {
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { stock: 0 } }
        );
        successMessage = `Marked ${result.modifiedCount} product(s) as Out of Stock (Stock: 0)`;
        break;
      }

      // 5. Update Pricing (% Discount/Markup or Flat Price)
      case 'updatePrice': {
        const { type = 'percentage', value, target = 'both' } = payload;
        const numVal = Number(value);

        if (isNaN(numVal)) {
          return res.status(400).json({ success: false, message: 'Invalid price adjustment value' });
        }

        if (type === 'percentage') {
          const factor = 1 + numVal / 100;
          const prods = await Product.find({ _id: { $in: productIds } });

          if (prods.length > 0) {
            const bulkOps = prods.map((p) => {
              const updates = {};
              if (target === 'price' || target === 'both') {
                updates.price = Math.max(1, Math.round((p.price || 0) * factor));
              }
              if (target === 'retailer_price' || target === 'both') {
                const base = p.retailer_price || p.price || 0;
                updates.retailer_price = Math.max(1, Math.round(base * factor));
              }
              return {
                updateOne: {
                  filter: { _id: p._id },
                  update: { $set: updates }
                }
              };
            });

            const bulkRes = await Product.bulkWrite(bulkOps);
            result = { modifiedCount: bulkRes.modifiedCount || prods.length };
          } else {
            result = { modifiedCount: 0 };
          }

          successMessage = `Applied ${numVal > 0 ? `+${numVal}% markup` : `${Math.abs(numVal)}% discount`} to ${result.modifiedCount} product(s)`;
        } else {
          // Flat price
          const flatPrice = Math.max(1, Math.round(numVal));
          const setFields = {};
          if (target === 'price' || target === 'both') setFields.price = flatPrice;
          if (target === 'retailer_price' || target === 'both') setFields.retailer_price = flatPrice;

          result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: setFields }
          );
          successMessage = `Set flat price of ₹${flatPrice} for ${result.modifiedCount} product(s)`;
        }
        break;
      }

      // 6. Move Category / Subcategory
      case 'setCategory': {
        const { categoryId, subcategoryId } = payload;
        if (!categoryId) {
          return res.status(400).json({ success: false, message: 'Category ID is required' });
        }

        result = await Product.updateMany(
          { _id: { $in: productIds } },
          {
            $set: {
              Category: categoryId,
              category_id: categoryId,
              subcategory_id: subcategoryId || null
            }
          }
        );
        successMessage = `Reassigned category for ${result.modifiedCount} product(s)`;
        break;
      }

      // 7. Add Tags
      case 'addTags': {
        const rawTags = Array.isArray(payload.tags)
          ? payload.tags
          : String(payload.tags || '')
              .split(/[,|]/)
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean);

        if (rawTags.length === 0) {
          return res.status(400).json({ success: false, message: 'Please provide at least one tag' });
        }

        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $addToSet: { tags: { $each: rawTags } } }
        );
        successMessage = `Added tags [${rawTags.join(', ')}] to ${result.modifiedCount} product(s)`;
        break;
      }

      // 8. Remove Tags
      case 'removeTags': {
        const rawTags = Array.isArray(payload.tags)
          ? payload.tags
          : String(payload.tags || '')
              .split(/[,|]/)
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean);

        if (rawTags.length === 0) {
          return res.status(400).json({ success: false, message: 'Please provide at least one tag to remove' });
        }

        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $pull: { tags: { $in: rawTags } } }
        );
        successMessage = `Removed tags [${rawTags.join(', ')}] from ${result.modifiedCount} product(s)`;
        break;
      }

      // 9. Bulk Delete
      case 'delete': {
        const productsToDelete = await Product.find({ _id: { $in: productIds } }).lean();

        // Asynchronously cleanup Cloudinary images
        for (const p of productsToDelete) {
          if (Array.isArray(p.images)) {
            for (const img of p.images) {
              if (img.public_id) {
                deleteById(img.public_id).catch(() => {});
              }
            }
          }
        }

        result = await Product.deleteMany({ _id: { $in: productIds } });

        // Clean up from user carts and wishlists
        await User.updateMany(
          {},
          {
            $pull: {
              cart: { product: { $in: productIds } },
              favorites: { $in: productIds }
            }
          }
        );

        successMessage = `Permanently deleted ${result.deletedCount} product(s)`;
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown bulk action: ${action}` });
    }

    // Invalidate Redis caches
    await invalidateMultipleKeys([
      'products:all',
      'products:featured',
      'analytics:overview',
      'analytics:low-stock'
    ]);

    res.json({
      success: true,
      message: successMessage,
      count: result.modifiedCount ?? result.deletedCount ?? productIds.length
    });
  } catch (error) {
    console.error('Bulk Product Action Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Bulk operation failed' });
  }
};

/**
 * Bulk Export selected products to CSV
 */
const bulkExportProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    const query = Array.isArray(productIds) && productIds.length > 0
      ? { _id: { $in: productIds } }
      : {};

    const products = await Product.find(query)
      .populate('Category', 'name')
      .populate('subcategory_id', 'name')
      .lean();

    const headers = [
      'name',
      'price',
      'retailer_price',
      'price_bulk',
      'min_bulk_qty',
      'stock',
      'category',
      'subcategory',
      'description',
      'images',
      'tags',
      'active'
    ];

    const escapeCsv = (val) => {
      const s = String(val === undefined || val === null ? '' : val);
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = products.map((p) => {
      const categoryName = p.Category?.name || '';
      const subcategoryName = p.subcategory_id?.name || '';
      const imagesStr = Array.isArray(p.images) ? p.images.map((img) => img.url || '').filter(Boolean).join(',') : '';
      const tagsStr = Array.isArray(p.tags) ? p.tags.join(',') : '';

      return [
        escapeCsv(p.name),
        p.price || 0,
        p.retailer_price || p.price || 0,
        p.price_bulk || '',
        p.min_bulk_qty || 1,
        p.stock || 0,
        escapeCsv(categoryName),
        escapeCsv(subcategoryName),
        escapeCsv(p.description || ''),
        escapeCsv(imagesStr),
        escapeCsv(tagsStr),
        p.active !== false ? 'true' : 'false'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="kripaconnect_products_export_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Bulk Export Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export products' });
  }
};

module.exports = {
  bulkProductAction,
  bulkExportProducts
};
