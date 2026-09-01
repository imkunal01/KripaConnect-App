const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { createRedisClient } = require("./config/redis");
const { initSocket } = require("./config/socket");
const errorHandler = require("./middleware/errorHandler");
const { helmet, apiLimiter, sanitizeRequest } = require("./middleware/security");

dotenv.config();
connectDB();

// Initialize Redis client
createRedisClient();

const app = express();

// Trust proxy for Render/Vercel to correctly identify protocol (http vs https) 
app.set('trust proxy', 1);


function normalizeOrigin(o) {
  return String(o || "").trim().replace(/\/$/, "");
}

function isAllowedDomain(originUrl) {
  try {
    const parsed = new URL(originUrl);
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "kripaconnect.in" ||
      hostname.endsWith(".kripaconnect.in") ||
      hostname.endsWith(".vercel.app") ||
      hostname === "kripaconnect-app.onrender.com" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function getAllowedOrigins() {
  const base = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://kripaconnect.in",
    "https://www.kripaconnect.in",
    "http://kripaconnect.in",
    "http://www.kripaconnect.in",
    "https://kripa-connect-app.vercel.app",
    "https://kripaconnect-app.onrender.com",
  ];

  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const frontendUrls = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const vercelUrls = (process.env.VERCEL_URL || "")
    .split(",")
    .map(s => s.trim())
    .map(s => s.startsWith("http") ? s : `https://${s}`)
    .filter(Boolean);

  return [...base, ...fromEnv, ...frontendUrls, ...vercelUrls].map(normalizeOrigin);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    const allowedOrigins = getAllowedOrigins();

    // Allow configured origins, Vercel deployments, and kripaconnect.in domains
    if (
      allowedOrigins.includes(normalized) ||
      isAllowedDomain(normalized) ||
      normalized.endsWith(".vercel.app") ||
      normalized.endsWith(".kripaconnect.in") ||
      normalized === "https://kripaconnect.in" ||
      normalized === "https://www.kripaconnect.in"
    ) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", normalized);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
};

app.use(cors(corsOptions));



/* =========================
   BODY PARSER
========================= */

// Keep rawBody support (useful for Razorpay later)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* =========================
   MIDDLEWARES
========================= */

app.use(morgan("dev"));
app.use(cookieParser());

/* =========================
   CRON / LIVENESS ENDPOINTS
========================= */

function sendLivenessResponse(req, res, message = "backend is healthy") {
  return res.status(200).json({
    ok: true,
    service: "backend",
    message,
    time: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
}

// Simple machine-readable health endpoint for uptime monitors.
app.get("/healthz", (req, res) => {
  return sendLivenessResponse(req, res);
});

// Dedicated endpoint for external cron pings (e.g. cronjob.org).
// If CRON_SECRET is set, pass it as ?key=... or x-cron-key header.
function handleCronPing(req, res) {
  const expectedKey = process.env.CRON_SECRET;
  if (expectedKey) {
    const providedKey = req.query.key || req.headers["x-cron-key"];
    if (!providedKey || String(providedKey) !== String(expectedKey)) {
      return res.status(401).json({ ok: false, message: "Unauthorized cron key" });
    }
  }

  return res.status(200).json({
    ok: true,
    message: "cron ping received",
    time: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
}

app.get("/api/cron/ping", handleCronPing);
app.get("/ping", handleCronPing);

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(apiLimiter);
app.use(sanitizeRequest);

/* =========================
   ROUTES
========================= */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/subcategories", require("./routes/subcategoryRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/retailer", require("./routes/retailerRoutes"));
app.use("/api/favorites", require("./routes/favoriteRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

/* =========================
   DYNAMIC SITEMAP (SEO)
========================= */
app.get("/api/sitemap.xml", async (req, res) => {
  try {
    const Product = require("./models/Product");
    const Category = require("./models/Category");

    const [products, categories] = await Promise.all([
      Product.find({ active: { $ne: false } }).select("_id updatedAt").lean(),
      Category.find().select("_id updatedAt").lean(),
    ]);

    const baseUrl = "https://kripaconnect.in";
    const now = new Date().toISOString().split("T")[0];

    const staticRoutes = [
      { path: "", changefreq: "daily", priority: "1.0" },
      { path: "products", changefreq: "daily", priority: "0.9" },
      { path: "categories", changefreq: "weekly", priority: "0.8" },
      { path: "about", changefreq: "monthly", priority: "0.5" },
      { path: "contact", changefreq: "monthly", priority: "0.5" },
      { path: "faq", changefreq: "monthly", priority: "0.5" },
      { path: "services", changefreq: "monthly", priority: "0.5" },
      { path: "terms", changefreq: "monthly", priority: "0.3" },
      { path: "privacy", changefreq: "monthly", priority: "0.3" },
      { path: "returns", changefreq: "monthly", priority: "0.3" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const r of staticRoutes) {
      xml += `  <url>\n    <loc>${baseUrl}/${r.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
    }

    // Category pages
    for (const c of categories) {
      const lastmod = c.updatedAt ? new Date(c.updatedAt).toISOString().split("T")[0] : now;
      xml += `  <url>\n    <loc>${baseUrl}/products?category=${c._id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    // Product pages
    for (const p of products) {
      const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : now;
      xml += `  <url>\n    <loc>${baseUrl}/product/${p._id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    return res.send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return res.status(500).send("Error generating sitemap");
  }
});

/* =========================
   HEALTH CHECK
========================= */
// health check with good styled message

const os = require("os");

app.get("/", (req, res) => {
  // Compute memory usage
  const memUsageMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  // Compute CPU usage
  const cpuUsageMs = (process.cpuUsage().user / 1000).toFixed(2);
  // Environment
  const env = process.env.NODE_ENV || "development";
  // Get port
  const port = process.env.PORT || 5000;
  // Try to get DB string
  const dbStr = process.env.MONGO_URI ? "****" + process.env.MONGO_URI.slice(-8) : "(not set)";
  // Uptime (rounded)
  const uptime = process.uptime().toFixed(0);

  // Try to get network addresses safely
  const ifaces = os.networkInterfaces();
  const addrs = [];
  for (let key in ifaces) {
    ifaces[key].forEach(i => {
      if (i.family === "IPv4" && !i.internal) addrs.push(i.address);
    });
  }

  // HTML Response
  res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Smart E-Commerce Backend Health</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              color: #333;
              text-align: center;
              padding-top: 40px;
            }
            .box {
              display: inline-block;
              background: #fff;
              border-radius: 10px;
              padding: 32px 48px 32px 48px;
              box-shadow: 0 2px 24px 0 #0002;
              text-align: left;
            }
            h1 { color: #2196f3; }
            .kv { margin: 0.4em 0;}
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Smart E-Commerce Backend Running ✅</h1>
            <p class="kv"><span class="label">Version:</span> 1.0.0</p>
            <p class="kv"><span class="label">Environment:</span> ${env}</p>
            <p class="kv"><span class="label">Database:</span> ${dbStr}</p>
            <p class="kv"><span class="label">Port:</span> ${port}</p>
            <p class="kv"><span class="label">Server Time:</span> ${new Date().toISOString()}</p>
            <p class="kv"><span class="label">Uptime:</span> ${uptime} seconds</p>
            <p class="kv"><span class="label">Memory Usage:</span> ${memUsageMB} MB</p>
            <p class="kv"><span class="label">CPU Usage:</span> ${cpuUsageMs} ms</p>
            <p class="kv"><span class="label">Network Address(es):</span> ${addrs.length ? addrs.join(", ") : "?"}</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.reload();
            }, 10000);
          </script>
        </body>
      </html>
    `);
});


/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

/* =========================
   SERVER & WEBSOCKETS
========================= */

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io with matching CORS policy
initSocket(server, corsOptions);

server.listen(PORT, () =>
  console.log(`🚀 Server with Socket.io running on port ${PORT}`)
);
