const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { helmet, apiLimiter, sanitizeRequest } = require("./middleware/security");

dotenv.config();
connectDB();

const app = express();

// Trust proxy for Render/Vercel to correctly identify protocol (http vs https)
app.set('trust proxy', 1);

/* =========================
   CORS CONFIG (INLINE)
========================= */

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://kripa-connect-app.vercel.app",
      "https://kripaconnect-app.onrender.com"
    ];

    // Check if origin is allowed or is a Vercel preview deployment
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes



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
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/retailer", require("./routes/retailerRoutes"));
app.use("/api/favorites", require("./routes/favoriteRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

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
   SERVER
========================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
