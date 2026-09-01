const streamifier = require('streamifier');
const csvParser = require('csv-parser');
const slugify = require('slugify');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const { invalidateMultipleKeys } = require('../utils/cacheUtils');

/**
 * Parse CSV buffer into an array of raw row objects with normalized header keys
 */
function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = streamifier.createReadStream(buffer);

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) =>
            header
              .trim()
              .toLowerCase()
              .replace(/[\s_-]+/g, '_') // Normalize "Retailer Price" or "retailer-price" -> "retailer_price"
        })
      )
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

/**
 * Parse boolean string
 */
function parseBoolean(val, defaultVal = true) {
  if (val === undefined || val === null || String(val).trim() === '') return defaultVal;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'active';
}

/**
 * Process array of product rows into MongoDB
 */
async function processProductImport(rows, { updateExisting = false } = {}) {
  const [categories, subcategories] = await Promise.all([
    Category.find().lean(),
    Subcategory.find().lean()
  ]);

  // Lookup maps by lowercase name and by ID string
  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(cat._id.toString(), cat._id);
    categoryMap.set(cat.name.trim().toLowerCase(), cat._id);
    if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat._id);
  }

  const subcategoryMap = new Map();
  for (const sub of subcategories) {
    subcategoryMap.set(sub._id.toString(), sub._id);
    subcategoryMap.set(sub.name.trim().toLowerCase(), sub._id);
  }

  let createdCount = 0;
  let updatedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // Row 1 is header, data starts on row 2
    const row = rows[i];

    try {
      const name = (row.name || row.product_name || row.title || '').trim();
      if (!name) {
        throw new Error('Product name is required');
      }

      const rawPrice = row.price || row.mrp || row.regular_price;
      const price = Number(rawPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error(`Invalid price "${rawPrice}". Must be a positive number`);
      }

      const rawRetailerPrice = row.retailer_price || row.b2b_price || row.wholesale_price;
      const retailer_price = !isNaN(Number(rawRetailerPrice)) && Number(rawRetailerPrice) > 0
        ? Number(rawRetailerPrice)
        : price;

      const rawPriceBulk = row.price_bulk || row.bulk_price;
      const price_bulk = !isNaN(Number(rawPriceBulk)) && Number(rawPriceBulk) > 0
        ? Number(rawPriceBulk)
        : undefined;

      const rawMinBulk = row.min_bulk_qty || row.moq || row.bulk_min_qty;
      const min_bulk_qty = !isNaN(Number(rawMinBulk)) && Number(rawMinBulk) > 0
        ? Math.floor(Number(rawMinBulk))
        : 1;

      const rawStock = row.stock || row.quantity || row.qty;
      const stock = !isNaN(Number(rawStock)) && Number(rawStock) >= 0
        ? Math.floor(Number(rawStock))
        : 0;

      const description = (row.description || row.desc || '').trim();

      // Category matching
      const catInput = (row.category || row.category_id || row.category_name || '').trim().toLowerCase();
      const matchedCategoryId = catInput ? categoryMap.get(catInput) || null : null;

      // Subcategory matching
      const subInput = (row.subcategory || row.subcategory_id || row.subcategory_name || '').trim().toLowerCase();
      const matchedSubcategoryId = subInput ? subcategoryMap.get(subInput) || null : null;

      // Images formatting
      const rawImages = row.images || row.image || row.image_url || row.image_urls || '';
      const images = String(rawImages)
        .split(/[,|]/)
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'))
        .map((url) => ({ url }));

      // Tags formatting
      const rawTags = row.tags || row.keywords || '';
      const tags = String(rawTags)
        .split(/[,|]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const active = parseBoolean(row.active ?? row.status ?? row.is_active, true);

      // Unique slug creation
      const baseSlug = slugify(name, { lower: true, strict: true }) || 'product';

      // Check if product exists by slug or exact name
      const existingProduct = await Product.findOne({
        $or: [
          { slug: baseSlug },
          { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        ]
      });

      if (existingProduct && updateExisting) {
        // Update existing product
        existingProduct.price = price;
        existingProduct.retailer_price = retailer_price;
        if (price_bulk !== undefined) existingProduct.price_bulk = price_bulk;
        existingProduct.min_bulk_qty = min_bulk_qty;
        existingProduct.stock = stock;
        if (description) existingProduct.description = description;
        if (matchedCategoryId) {
          existingProduct.Category = matchedCategoryId;
          existingProduct.category_id = matchedCategoryId;
        }
        if (matchedSubcategoryId) existingProduct.subcategory_id = matchedSubcategoryId;
        if (images.length > 0) existingProduct.images = images;
        if (tags.length > 0) existingProduct.tags = tags;
        existingProduct.active = active;

        await existingProduct.save();
        updatedCount++;
      } else {
        // Ensure slug is truly unique for new product
        let finalSlug = baseSlug;
        let counter = 1;
        while (await Product.exists({ slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        await Product.create({
          name,
          slug: finalSlug,
          price,
          retailer_price,
          price_bulk,
          min_bulk_qty,
          stock,
          description,
          Category: matchedCategoryId,
          category_id: matchedCategoryId,
          subcategory_id: matchedSubcategoryId,
          images,
          tags,
          active
        });
        createdCount++;
      }
    } catch (err) {
      errors.push({
        row: rowNumber,
        name: row?.name || 'Unknown',
        error: err.message || 'Processing failed'
      });
    }
  }

  // Invalidate product catalog cache
  try {
    await invalidateMultipleKeys([
      'products:all',
      'products:featured',
      'analytics:overview',
      'analytics:low-stock'
    ]);
  } catch (cacheErr) {
    console.warn('Cache invalidation warning after CSV import:', cacheErr.message);
  }

  return {
    totalRows: rows.length,
    createdCount,
    updatedCount,
    failedCount: errors.length,
    errors
  };
}

/**
 * Generate CSV template string with headers and sample data
 */
function generateCsvTemplate() {
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

  const sampleRows = [
    [
      'Smart LED TV 43 Inch 4K Ultra HD',
      '24999',
      '22500',
      '21000',
      '5',
      '20',
      'Entertainment',
      'Televisions',
      'Experience cinematic clarity with 4K UHD resolution and HDR support.',
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1',
      'tv,4k,smart tv,entertainment',
      'true'
    ],
    [
      'Heavy Duty Mixer Grinder 750W',
      '2999',
      '2499',
      '2200',
      '10',
      '50',
      'Kitchen Appliances',
      'Mixers & Grinders',
      'Powerful 750W motor with 3 stainless steel jars and overload protection.',
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b',
      'mixer,kitchen,grinder,appliances',
      'true'
    ]
  ];

  const escapeCsv = (val) => {
    const s = String(val || '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvLines = [
    headers.join(','),
    ...sampleRows.map((row) => row.map(escapeCsv).join(','))
  ];

  return csvLines.join('\n');
}

module.exports = {
  parseCsvBuffer,
  processProductImport,
  generateCsvTemplate
};
