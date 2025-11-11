const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
dotenv.config();
connectDB();

const app = express();

// Normal body parser (JSON)
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

app.use(cors());
app.use(morgan("dev"));

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
  

// HEALTH CHECK
app.get("/", (req, res) => res.send("Smart E-Commerce Backend Running ✅"));

// ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
