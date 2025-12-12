const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const xss = require("xss");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { helmet, apiLimiter, sanitizeRequest } = require("./middleware/security");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",      // React web
  "http://localhost:5173",      // Vite
  "http://localhost:5174",      // Vite
  "https://yourdomain.com"      // Production
]

// Normal body parser (JSON)
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(morgan("dev"));
app.use(cookieParser());

app.use(helmet());         // Protects headers
app.use(apiLimiter);       // Rate limiter
app.use((req, res, next) => {
  if (req.body) {
    try {
      req.body = JSON.parse(xss(JSON.stringify(req.body)));
    } catch (_) {}
  }
  next();
});
app.use(sanitizeRequest);  // Prevent Mongo injection


// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
// AnalyticalRoutes
app.use("/api/analytics", require("./routes/analyticsRoutes"));
// retailer routes for b2b 
app.use("/api/retailer", require("./routes/retailerRoutes"));
app.use("/api/favorites", require("./routes/favoriteRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));


  

// HEALTH CHECK
app.get("/", (req, res) => res.send("Smart E-Commerce Backend Running ✅"));

// ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
