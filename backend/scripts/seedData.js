const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const slugify = require("slugify");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const connectDB = require("../src/config/db");

dotenv.config();

const dataPath = path.join(__dirname, "../data/products.json");

// Function to create categories from unique category names in products
const createCategories = async (productsData) => {
  const categoryNames = [...new Set(productsData.map(p => p.category).filter(Boolean))];
  const categoryMap = {};

  for (const categoryName of categoryNames) {
    const slug = slugify(categoryName, { lower: true, strict: true });
    
    // Check if category already exists
    let category = await Category.findOne({ slug });
    
    if (!category) {
      category = new Category({
        name: categoryName,
        slug: slug,
        description: `${categoryName} category`
      });
      await category.save();
      console.log(`✅ Created category: ${categoryName}`);
    }
    
    categoryMap[categoryName] = category._id;
  }
  
  return categoryMap;
};

// Function to import data
const importData = async () => {
  try {
    await connectDB();

    const productsData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    if (!Array.isArray(productsData) || productsData.length === 0) {
      console.log("❌ No products found in JSON file");
      process.exit(1);
    }

    console.log(`📦 Found ${productsData.length} products to import`);
    
    // Create categories first
    console.log(`🔄 Creating categories...`);
    const categoryMap = await createCategories(productsData);
    console.log(`✅ Categories created/updated: ${Object.keys(categoryMap).length}`);

    // Process products to add required fields
    const processedProducts = productsData.map(product => {
      // Generate slug from name if not present
      const slug = product.slug || slugify(product.name, { lower: true, strict: true });
      
      // Map category field to Category ObjectId
      const categoryId = product.category ? categoryMap[product.category] : undefined;
      
      const processedProduct = {
        ...product,
        slug: slug,
        Category: categoryId, // Use ObjectId reference instead of string
        tags: product.tags || [],
        active: product.active !== undefined ? product.active : true,
        stock: product.stock || 0,
        description: product.description || ""
      };
      
      // Remove the old 'category' field to avoid confusion
      delete processedProduct.category;
      
      return processedProduct;
    });

    await Product.insertMany(processedProducts);
    console.log(`✅ ${processedProducts.length} products imported successfully`);
    process.exit();
  } catch (error) {
    console.error("❌ Error importing data:", error.message);
    process.exit(1);
  }
};

// Function to delete all product data
const deleteData = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    console.log("🗑️ All products deleted successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error deleting data:", error.message);
    process.exit(1);
  }
};

// Determine command from CLI args
if (process.argv[2] === "-i" || process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "-d" || process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log("⚙️  Usage: node src/scripts/seedData.js [-i | -d]");
  process.exit();
}
