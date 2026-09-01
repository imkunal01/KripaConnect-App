# 🚀 API Performance Optimization Guide & Implementation Plan
**Project:** KripaConnect Backend (Node.js, Express, MongoDB, Redis)  
**Target:** Sub-50ms API Latency, High Concurrency, Zero-Blocking I/O

---

## 📌 Table of Contents
1. [Executive Summary & Impact Projections](#1-executive-summary--impact-projections)
2. [Phase 1: Quick Wins (Immediate High-Impact Fixes)](#2-phase-1-quick-wins-immediate-high-impact-fixes)
   - [1.1 Express Payload Compression (`compression`)](#11-express-payload-compression-compression)
   - [1.2 Asynchronous Non-Blocking Background Tasks (Emails/Webhooks)](#12-asynchronous-non-blocking-background-tasks-emailswebhooks)
   - [1.3 CORS Preflight Caching & Timing Header](#13-cors-preflight-caching--timing-header)
   - [1.4 Selective Sanitization Middleware](#14-selective-sanitization-middleware)
3. [Phase 2: Database & Query Performance (MongoDB / Mongoose)](#3-phase-2-database--query-performance-mongodb--mongoose)
   - [2.1 MongoDB Connection Pool Tuning](#21-mongodb-connection-pool-tuning)
   - [2.2 Bulk Operations (`bulkWrite`) vs Sequential Loops](#22-bulk-operations-bulkwrite-vs-sequential-loops)
   - [2.3 Enforcing `.lean()` and `.select()` Projections](#23-enforcing-lean-and-select-projections)
   - [2.4 Critical Compound Indexes](#24-critical-compound-indexes)
4. [Phase 3: Caching & Redis Architecture](#4-phase-3-caching--redis-architecture)
   - [3.1 JWT / User Session Caching in `authMiddleware`](#31-jwt--user-session-caching-in-authmiddleware)
   - [3.2 Non-Blocking Cache Invalidation (`SCAN` vs Blocking `KEYS`)](#32-non-blocking-cache-invalidation-scan-vs-blocking-keys)
   - [3.3 HTTP `Cache-Control` Headers for Semi-Static Endpoints](#33-http-cache-control-headers-for-semi-static-endpoints)
5. [Phase 4: Network & Cloud Infrastructure](#5-phase-4-network--cloud-infrastructure)
   - [4.1 Cloud Region Colocation (Render / MongoDB Atlas / Upstash)](#41-cloud-region-colocation-render--mongodb-atlas--upstash)
   - [4.2 TCP Connection (`ioredis`) vs HTTP REST Redis](#42-tcp-connection-ioredis-vs-http-rest-redis)
   - [4.3 Preventing Serverless / Free Tier Cold Starts](#43-preventing-serverless--free-tier-cold-starts)
6. [Phase 5: Implementation Checklist & Verification](#6-phase-5-implementation-checklist--verification)
   - [Benchmarking with Autocannon](#benchmarking-with-autocannon)

---

## 1. Executive Summary & Impact Projections

| Optimization Area | Current State | Target State | Expected Latency Reduction |
| :--- | :--- | :--- | :--- |
| **Order Checkout (`createOrder`)** | Synchronous SendGrid `sendMail` + sequential DB loop | Fire-and-forget email + `Product.bulkWrite` | **300ms – 1,200ms drop** |
| **Auth Middleware (`protect`)** | Hits MongoDB `User.findById` on every single request | Cached session in Redis with 10m TTL | **20ms – 50ms drop per auth call** |
| **Product List & Search** | Uncompressed JSON payloads | Gzip / Brotli compression + Compound indexes | **40% – 70% transfer time reduction** |
| **Redis Invalidation** | Blocking `redis.keys()` O(N) search | Non-blocking `SCAN` or Tagged Versioning | Prevents Redis event loop freeze |
| **Database Connections** | Default single pool | Tuned pool (`maxPoolSize: 50`, `minPoolSize: 10`) | Reduces connection stall under load |

---

## 2. Phase 1: Quick Wins (Immediate High-Impact Fixes)

### 1.1 Express Payload Compression (`compression`)
**Problem:** Large JSON payloads (e.g. catalog lists, orders, admin product tables) are sent uncompressed over the network.
**Solution:** Install and enable Gzip/Brotli compression in [backend/src/server.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/server.js).

```bash
cd backend
npm install compression
```

**Code Change in `backend/src/server.js`:**
```javascript
const compression = require("compression");

// Mount compression before routes
app.use(compression({
  level: 6, // optimal balance between speed and compression ratio
  threshold: 1024 // only compress responses larger than 1KB
}));
```

---

### 1.2 Asynchronous Non-Blocking Background Tasks (Emails/Webhooks)
**Problem:** In [backend/src/controllers/orderController.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/controllers/orderController.js#L105), the API awaits SendGrid HTTP calls before responding to the user. If SendGrid takes 800ms, checkout takes 800ms+ longer.

**Before:**
```javascript
// ❌ BLOCKS client response until SendGrid responds
try {
  await sendMail({
    to: req.user.email,
    subject: `${orderType} Placed Successfully`,
    html: `...`
  });
} catch (e) {
  console.warn("Email send failed:", e.message);
}

res.status(201).json(order);
```

**After (Optimized):**
```javascript
// ✅ Responds immediately to the user; sends email in the background
res.status(201).json(order);

// Fire-and-forget async execution
setImmediate(async () => {
  try {
    const orderType = isRetailer && effectivePurchaseMode === "retailer" ? "Bulk Order" : "Order";
    await sendMail({
      to: req.user.email,
      subject: `${orderType} Placed Successfully`,
      html: `...`
    });
  } catch (e) {
    console.error("Background email send error:", e.message);
  }
});
```

---

### 1.3 CORS Preflight Caching & Timing Header
**Problem:** Modern browsers send an `OPTIONS` preflight request before every mutating request (`POST`/`PUT`/`DELETE`). Without a cache header, every request triggers 2 roundtrips.

**Code Change in `backend/src/server.js`:**
```javascript
// 1. Add Response-Time measurement header
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    res.setHeader("X-Response-Time", `${timeInMs}ms`);
  });
  next();
});

// 2. Cache CORS Preflight for 24 hours (86,400 seconds)
const corsOptions = {
  origin: (origin, callback) => { /* ... */ },
  credentials: true,
  maxAge: 86400, // Browser caches preflight response
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
};
app.use(cors(corsOptions));
```

---

### 1.4 Selective Sanitization Middleware
**Problem:** `mongoSanitize` parses deep nested objects on *every* request, including read-only `GET` requests where query strings are simple.

**Optimization in `backend/src/middleware/security.js`:**
```javascript
const sanitizeRequest = (req, res, next) => {
  // Only sanitize mutating requests or search queries
  if (req.method !== 'GET') {
    if (req.body) mongoSanitize(req.body);
  }
  if (req.query) mongoSanitize(req.query);
  if (req.params) mongoSanitize(req.params);
  next();
};
```

---

## 3. Phase 2: Database & Query Performance (MongoDB / Mongoose)

### 2.1 MongoDB Connection Pool Tuning
Configure the connection pool in [backend/src/config/db.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/config/db.js) to keep warm connections alive and prevent connection renegotiation under load.

```javascript
const mongoose = require('mongoose');

const ConnectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,         // Maintain up to 50 concurrent socket connections
      minPoolSize: 10,         // Keep at least 10 idle connections warm
      socketTimeoutMS: 45000,  // Close sockets after 45s of inactivity
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000, // Keep connection fresh
    });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = ConnectDB;
```

---

### 2.2 Bulk Operations (`bulkWrite`) vs Sequential Loops
**Problem:** In `createOrder`, stock decrement loops sequentially:
`items.length = 10` -> **10 sequential queries to MongoDB**.

**Optimized `bulkWrite` Approach in `backend/src/controllers/orderController.js`:**
```javascript
// Perform atomic bulk write in 1 single network request
const bulkOps = items.map(item => ({
  updateOne: {
    filter: { _id: item.product, stock: { $gte: item.qty } },
    update: { $inc: { stock: -item.qty } }
  }
}));

const bulkRes = await Product.bulkWrite(bulkOps, { ordered: true });

if (bulkRes.modifiedCount !== items.length) {
  // Handle concurrency rollback if any item was out of stock
  throw new Error("One or more items are out of stock or insufficient quantity");
}
```

---

### 2.3 Enforcing `.lean()` and `.select()` Projections
Ensure that **all read-only operations** use `.lean()` and project only required attributes:

```javascript
// ✅ FAST: Returns plain Javascript objects, skipping Mongoose hydration
const user = await User.findById(userId)
  .select("_id name email role isBlocked tokenVersion")
  .lean();

// ✅ FAST: Product details page
const product = await Product.findById(productId)
  .select("name price retailer_price stock description images tags")
  .populate("Category", "name slug")
  .lean();
```

---

### 2.4 Critical Compound Indexes
Add compound indexes matching your most frequent query filters and sort orders.

#### In [backend/src/models/Product.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/models/Product.js):
```javascript
// Compound index for filtering active products by category + sorting by price
productSchema.index({ active: 1, Category: 1, price: 1 });

// Compound index for filtering active products by subcategory
productSchema.index({ active: 1, subcategory_id: 1, price: 1 });

// Compound index for stock filtering
productSchema.index({ active: 1, stock: 1 });
```

#### In [backend/src/models/Order.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/models/Order.js):
```javascript
// Compound index for user order history with sorting by newest first
orderSchema.index({ user: 1, createdAt: -1 });

// Compound index for admin order dashboards
orderSchema.index({ deliveryStatus: 1, createdAt: -1 });
```

---

## 4. Phase 3: Caching & Redis Architecture

### 3.1 JWT / User Session Caching in `authMiddleware`
**Problem:** In [backend/src/middleware/authMiddleware.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/middleware/authMiddleware.js), `protect` queries the database for user details on **every authenticated request**.

**Optimized `authMiddleware.js`:**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCache, setCache } = require('../utils/cacheUtils');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const cacheKey = `user:session:${decoded.id}`;
      let user = await getCache(cacheKey);

      if (!user) {
        user = await User.findById(decoded.id)
          .select("-password -cart -favorites -savedAddresses")
          .lean();
        
        if (user) {
          // Cache user session for 10 minutes (600s)
          await setCache(cacheKey, user, 600);
        }
      }

      if (!user) return res.status(401).json({ message: "Not authorized" });
      if (user.isBlocked) return res.status(403).json({ message: "Account is blocked" });
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ message: "Token invalidated, please login again" });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
```
*(Note: When a user is blocked or role is updated in `adminController.js`, simply call `invalidateCache('user:session:' + userId)`).*

---

### 3.2 Non-Blocking Cache Invalidation (`SCAN` vs Blocking `KEYS`)
**Problem:** In [backend/src/utils/cacheUtils.js](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/utils/cacheUtils.js#L122), `redis.keys(pattern)` is an $O(N)$ blocking command. Under high traffic, it locks the Redis server.

**Optimized Pattern Invalidation with `SCAN` in `cacheUtils.js`:**
```javascript
async function invalidatePattern(pattern) {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) return;

  try {
    let cursor = 0;
    do {
      // Use scan with match pattern and small batches
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 50 });
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0 && cursor !== "0");

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🗑️ CACHE PATTERN INVALIDATED (SAFE SCAN): ${pattern}`);
    }
  } catch (error) {
    console.error(`Failed to safely invalidate pattern ${pattern}:`, error.message);
  }
}
```

---

### 3.3 HTTP `Cache-Control` Headers for Semi-Static Endpoints
For public endpoints like `/api/banners`, `/api/categories`, and `/api/subcategories`, let browsers & CDNs cache responses:

```javascript
// In categoryController.js or bannerController.js
res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
res.json(data);
```

---

## 5. Phase 4: Network & Cloud Infrastructure

### 5.1 Cloud Region Colocation (Render / MongoDB Atlas / Upstash)
- **Rule of Thumb:** Keep compute (Render/Vercel) and databases (MongoDB Atlas & Upstash Redis) in the **same geographical cloud region**.
- **Example:** If MongoDB Atlas is in **AWS `ap-south-1` (Mumbai)**, ensure the backend host is deployed to **Singapore / Mumbai (`ap-southeast-1` or `ap-south-1`)**.
- *Cross-continental pings (e.g. Frankfurt -> Mumbai) add 120ms – 200ms latency to every single database query.*

### 5.2 TCP Connection (`ioredis`) vs HTTP REST Redis
- `@upstash/redis` uses REST HTTP requests over port 443. Each command requires an HTTP request.
- For high-volume environments, switching to a persistent TCP Redis client (`ioredis` or `redis`) reduces latency from **30–50ms** down to **1–3ms**.

### 5.3 Preventing Serverless / Free Tier Cold Starts
- If your backend is hosted on free tiers (like Render free web service), it spins down after 15 minutes of inactivity.
- Ensure your uptime monitor (e.g. CronJob.org, UptimeRobot, or GitHub Actions) sends a lightweight `GET /healthz` ping every **5 to 10 minutes** to keep instances hot.

---

## 6. Phase 5: Implementation Checklist & Verification

### Implementation Checklist
- [ ] 1. Install `compression` and enable in `backend/src/server.js`.
- [ ] 2. Update `backend/src/config/db.js` with `maxPoolSize: 50` and connection timeouts.
- [ ] 3. Refactor `sendMail` in `backend/src/controllers/orderController.js` to run asynchronously without blocking `res.status(201)`.
- [ ] 4. Add Redis session caching in `backend/src/middleware/authMiddleware.js`.
- [ ] 5. Replace `redis.keys()` in `backend/src/utils/cacheUtils.js` with non-blocking `scan`.
- [ ] 6. Add compound indexes in `backend/src/models/Product.js` and `backend/src/models/Order.js`.
- [ ] 7. Set `maxAge: 86400` on Express CORS configuration.

---

### Benchmarking with Autocannon

To measure latency and requests-per-second before and after the changes, run:

```bash
# Install autocannon globally or use npx
npx autocannon -c 50 -d 10 -p 10 http://localhost:5000/api/products
```

**Key Metrics to Monitor:**
- **Latency (p95 & p99):** Should drop below 50ms for cached routes.
- **Req/Sec:** Should increase by 3x–10x under concurrent load.
- **Payload Size:** Should reduce by 50–75% with Gzip compression.
