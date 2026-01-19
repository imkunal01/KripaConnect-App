const dotenv = require("dotenv");
const path = require("path");
const slugify = require("slugify");
const connectDB = require("../src/config/db");
const Category = require("../src/models/Category");
const Subcategory = require("../src/models/Subcategory");

dotenv.config({ path: path.join(__dirname, "../.env") });

const data = [
  {
    name: "TV, Audio & Entertainment",
    subcategories: [
      "LED / Smart TVs",
      "Set-Top Boxes",
      "Soundbars",
      "Home Theatre Systems",
      "Speakers (Wired / Wireless)",
      "Remote Controls",
      "TV Wall Mounts",
      "HDMI / AV Cables",
    ],
  },
  {
    name: "Home Appliances",
    subcategories: [
      "Refrigerators",
      "Washing Machines",
      "Microwave Ovens",
      "Air Coolers",
      "Fans",
      "Water Purifiers",
      "Irons",
      "Vacuum Cleaners",
    ],
  },
  {
    name: "Kitchen Appliances",
    subcategories: [
      "Mixer Grinders",
      "Juicers",
      "Electric Kettles",
      "Induction Cooktops",
      "Toasters & Sandwich Makers",
      "Rice Cookers",
      "OTG / Air Fryers",
      "Chimneys & Hobs",
    ],
  },
  {
    name: "Computer & Office Accessories",
    subcategories: [
      "Laptops",
      "Keyboards & Mouse",
      "Monitors",
      "Printers & Scanners",
      "USB Drives & Hard Disks",
      "Routers & Modems",
      "Webcams",
      "UPS & Power Backup",
    ],
  },
  {
    name: "Electricals & Lighting",
    subcategories: [
      "LED Bulbs & Tubelights",
      "Switches & Sockets",
      "Extension Boards",
      "Wires & Cables",
      "MCBs & Stabilizers",
      "Doorbells",
      "Night Lamps",
      "Emergency Lights",
    ],
  },
  {
    name: "Smart Home & Security",
    subcategories: [
      "CCTV Cameras",
      "Video Door Phones",
      "Smart Locks",
      "WiFi Cameras",
      "Motion Sensors",
      "Smart Plugs",
      "Smart Lights",
      "Alarm Systems",
    ],
  },
  {
    name: "Power & Energy Solutions",
    subcategories: [
      "Inverters",
      "Batteries",
      "Solar Panels",
      "Solar Lights",
      "Voltage Stabilizers",
      "Generators",
      "Power Strips",
      "Surge Protectors",
    ],
  },
  {
    name: "Repairs, Parts & Services",
    subcategories: [
      "Mobile Repair Parts",
      "Charger & Adapter Parts",
      "TV Spare Parts",
      "Laptop Batteries",
      "Installation Services",
      "Repair Services",
      "AMC / Warranty Plans",
    ],
  },
  {
    name: "Deals, Combos & Wholesale",
    subcategories: [
      "Combo Offers",
      "Clearance Sale",
      "Bulk Purchase Deals",
      "Festival Offers",
      "Retailer-Only Products",
      "Best Sellers",
      "New Arrivals",
    ],
  },
];

async function upsertCategory({ name }) {
  const slug = slugify(name, { lower: true, strict: true });
  let category = await Category.findOne({ slug });
  if (!category) {
    category = await Category.create({
      name,
      slug,
      logo: "",
      status: "active",
    });
    console.log(`✅ Created category: ${name}`);
  } else {
    let dirty = false;
    if (!category.logo) {
      category.logo = "";
      dirty = true;
    }
    if (!category.status) {
      category.status = "active";
      dirty = true;
    }
    if (dirty) await category.save();
    console.log(`ℹ️  Category exists: ${name}`);
  }
  return category;
}

async function upsertSubcategory({ name, category_id }) {
  const slug = slugify(name, { lower: true, strict: true });
  let sub = await Subcategory.findOne({ slug });
  if (!sub) {
    sub = await Subcategory.create({
      name,
      slug,
      logo: "",
      status: "active",
      category_id,
    });
    console.log(`  ➕ Subcategory: ${name}`);
  } else {
    let dirty = false;
    if (!sub.logo) {
      sub.logo = "";
      dirty = true;
    }
    if (!sub.status) {
      sub.status = "active";
      dirty = true;
    }
    if (String(sub.category_id) !== String(category_id)) {
      sub.category_id = category_id;
      dirty = true;
    }
    if (dirty) await sub.save();
    console.log(`  ℹ️  Subcategory exists: ${name}`);
  }
}

async function run() {
  try {
    await connectDB();

    for (const item of data) {
      const category = await upsertCategory({ name: item.name });
      for (const sub of item.subcategories) {
        await upsertSubcategory({ name: sub, category_id: category._id });
      }
    }

    console.log("✅ Category + subcategory seed complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

run();
