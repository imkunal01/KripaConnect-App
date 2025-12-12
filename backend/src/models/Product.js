const mongoose = require('mongoose');
const Category = require('./Category');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true},
    slug: { type: String, required: true, unique: true, index: true},
    description: { type: String, default: ""},
    Category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
    price: { type: Number, required: true },
    retailer_price : { type: Number, required: true },
    price_bulk : { type: Number, required: false },
    min_bulk_qty : { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    images:
    [{
        url: String ,
        public_id: String
    }],
    tags: [String],
    active: { type: Boolean, default: true },
}, { timestamps: true }
);

// enable text search for name/description/tags used by listProducts
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);