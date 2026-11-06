# Product Requirements Document (PRD) — KripaConnect

> **Platform:** KripaConnect  
> **Target Audience:** B2C Shoppers, B2B Retailers, E-commerce Store Administrators, Delivery Partners  
> **Status:** Production / Active AI Development  
> **Last Updated:** September 2026  

---

## 1. Executive Summary & Vision

**KripaConnect** is an omnichannel, full-stack e-commerce and wholesale ecosystem built for the Indian market. It bridges the gap between individual direct-to-consumer (B2C) shopping and high-volume business-to-business (B2B) trade within a single unified platform.

The system is delivered as:
1. A **Progressive Web App (PWA)** accessible via any modern browser with offline capabilities and installability.
2. A **Native Android App** packaged via **Trusted Web Activity (TWA)** and **Capacitor** for distribution on Google Play Store.
3. An **Admin & Analytics Portal** for store managers to control products, orders, banners, categories, and financial performance.
4. An **AI-Powered Recommendation Microservice (RAG)** leveraging vector embeddings and Large Language Models (LLM) for natural language semantic product discovery and smart recommendations.

---

## 2. User Personas

| Persona | Role & Objectives | Key Requirements |
|---|---|---|
| **B2C Customer** | Individual retail shopper looking for quality products at competitive prices. | Seamless mobile experience, OTP/Google login, instant search, fast checkout, Razorpay/COD payments, order tracking, downloadable invoices. |
| **B2B Retailer** | Wholesale buyer purchasing in bulk for commercial distribution. | Dedicated B2B portal, tiered wholesale pricing, minimum order quantities (MOQ), bulk order workflows, GST-compliant tax invoices, spending analytics. |
| **Store Administrator** | Operations & catalog manager ensuring platform health and fulfillment. | Dashboard analytics (revenue, order counts, customer metrics), product CRUD, CSV bulk import/export, order lifecycle updates, banner/category management, review moderation. |
| **Delivery Partner** *(Roadmap)* | Field delivery agent fulfilling last-mile orders. | GPS location pinging (via mobile browser/app), order route tracking, status delivery updates. |

---

## 3. Core Functional Modules & Requirements

### 3.1 Authentication & User Management
- **Multi-Method Authentication:**
  - Standard email and password authentication (bcrypt hashed passwords).
  - Google OAuth 2.0 (Google Identity Services on frontend with token verification on backend).
  - Email One-Time Password (OTP) login via SendGrid.
  - Password Reset Flow: Secure time-limited token sent via email to reset credentials.
- **Session & Token Architecture:**
  - Dual JWT mechanism: Short-lived access token (`15m`) passed in HTTP Authorization header or memory, and long-lived refresh token (`7d`) stored in an `httpOnly`, `SameSite=Strict`, `Secure` cookie.
  - Silent token renewal endpoint (`POST /api/auth/refresh-token`).
- **Role-Based Access Control (RBAC):**
  - Roles: `customer`, `retailer`, `admin`.
  - Dynamic UI routing: Protected routes guard `/admin` for administrators and `/b2b` for verified retailers.

### 3.2 Product Catalog & Inventory
- **Hierarchy:** Two-level classification (`Category` -> `Subcategory`).
- **Product Attributes:** Name, slug, SKU, description, rich markdown/text, tags, images (Cloudinary CDN URLs), stock count, base price, retailer wholesale price, active/inactive visibility flag, ratings, review count.
- **Stock Management:** Real-time decrementing upon order placement, inventory warnings when stock drops below threshold.
- **Bulk Operations:** CSV import and export for rapid catalog seeding and price updates via admin portal.

### 3.3 Dual Purchasing Modes (B2C Retail vs B2B Wholesale)
- **Purchase Mode Toggle:** Global context allowing eligible users to switch between Retail and B2B Wholesale viewing.
- **Pricing Calculation:**
  - Retail Mode: Displays standard `price`.
  - B2B Mode: Displays `retailer_price` (wholesale discount), enforces Minimum Order Quantity (MOQ) per item, and shows bulk purchase margins.
- **Tax Breakdown:** Standard prices display inclusive/exclusive GST breakdowns on checkout and final invoices.

### 3.4 Cart, Wishlist & Checkout
- **Cart Management:**
  - Persistent shopping cart backed by database for logged-in users and localStorage for guests.
  - Live stock validation before adding to cart and prior to initiating checkout.
  - Dynamic price recalculation based on quantity, mode (B2C vs B2B), and promotional discounts.
- **Wishlist / Favorites:** Instant toggle to save products for later with one-click move to cart.
- **Checkout Flow:**
  - Multi-step address selection (saved addresses, new address form with pincode validation).
  - Payment method selection: Cash on Delivery (COD) or Online Payment (Razorpay).
  - Order summary breakdown: Subtotal, Shipping, Tax, Discounts, and Grand Total.

### 3.5 Payment Gateway & Financial Reconciliation
- **Razorpay Integration:**
  - Server-side order creation (`POST /api/payments/create-order`) producing `razorpay_order_id`.
  - Client-side checkout modal with Razorpay Checkout JS SDK.
  - Cryptographic signature verification (`POST /api/payments/verify`) using HMAC-SHA256.
  - Webhook listener (`POST /api/payments/webhook`) for asynchronous payment capture, refund, and failure events.
- **Cash on Delivery (COD):** Instant order placement with `paymentStatus: 'pending'` and `paymentMethod: 'cod'`.
- **Transaction Audit Logs:** Every payment attempt, success, and refund writes an immutable `Transaction` record with gateway reference IDs.

### 3.6 Order Lifecycle Management
- **Status State Machine:**
  ```
  [Pending] ──► [Processing] ──► [Shipped] ──► [Delivered]
       │               │             │
       └───────────────┴─────────────┴─────► [Cancelled]
  ```
- **Timeline Tracking:** Every status transition appends an event to the order's `timeline` array with timestamp and message.
- **Customer Cancellation:** Orders can be cancelled by the user if status is still `Pending` or `Processing`.
- **Automated Invoices:** Upon order completion or on-demand via `/api/invoices/:orderId`, generates a branded, GST-compliant PDF invoice (built with PDFKit).

### 3.7 Admin Management & Business Analytics
- **Analytics Dashboard:**
  - Key Performance Indicators: Total Revenue, Total Orders, Active Users, Average Order Value (AOV).
  - Interactive charts (powered by Recharts): Daily/Monthly Revenue trends, Order volume by category, Top-selling products.
- **Catalog Management:** Full CRUD interface for Products, Categories, Subcategories, and Promotional Banners.
- **Order Management:** Filterable order tables (by status, date, payment method) with inline status updater.
- **User & Retailer Moderation:** View user directory, approve or revoke retailer B2B status.

### 3.8 AI-Powered Semantic Search & Recommendations (RAG)
- **Natural Language Product Discovery:**
  - Natural query parsing: Interprets queries like *"lightweight formal shirt under 1500 for summer"* into intent, category filters, and price ranges.
  - Hybrid Search: Combines dense vector search (Pinecone with SentenceTransformers embeddings) and lexical keyword matching.
  - LLM Re-ranking & Synthesis: Groq (Llama 3.3 70B) or Google Gemini generates personalized recommendation explanations (`why_recommended`, `comparison`).
- **Resilient Fallback:** When RAG microservice is offline or unreachable, backend falls back gracefully to MongoDB regex/text search with zero disruption to the user experience.

### 3.9 Real-Time Delivery Tracking (Kafka Roadmap)
- **High-Frequency GPS Ingestion:** Delivery partner device pings location coordinates every 5–10s to `/api/delivery/:orderId/location`.
- **Kafka Buffering:** Express backend acts as producer emitting to `delivery-location-updates` topic.
- **Consumer Pipeline:**
  - Consumer 1: Persists latest coordinates in Upstash Redis (`delivery:location:<orderId>`) with 2-hour TTL.
  - Consumer 2: Pushes real-time coordinates over Socket.IO room `order:<orderId>` to the tracking customer.

### 3.10 Mobile & PWA Experience
- **Progressive Web App:** Service worker caching, offline fallback page, install prompt, Web App Manifest.
- **Android TWA App:** Fullscreen native experience without browser URL bars, validated via Digital Asset Links (`/.well-known/assetlinks.json`).
- **Capacitor Integration:** Hybrid mobile bridge for native device APIs (camera, notifications, storage).

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Performance & Latency
- **API Response Times:** 95th percentile under 150ms for cached product lists and catalog browsing (backed by Upstash Redis).
- **RAG Response Times:** Semantic search response under 2.5s (with a strict 3.5s timeout fallback to MongoDB search).
- **Frontend Core Web Vitals:**
  - Largest Contentful Paint (LCP) < 2.0s.
  - First Input Delay (FID) < 100ms.
  - Cumulative Layout Shift (CLS) < 0.05.

### 4.2 Security & Compliance
- **Transport Security:** Strict HTTPS enforcement across all endpoints.
- **Input Sanitization & Injection Prevention:**
  - `mongo-sanitize` strips `$` and `.` operators to prevent NoSQL injection.
  - `xss` library cleanses user-generated strings in reviews and forms.
  - `helmet` sets secure HTTP headers (CSP, HSTS, X-Frame-Options).
- **Rate Limiting:**
  - Global API limiter: 100 requests per 15 minutes per IP.
  - Auth limiter: 5 login/OTP attempts per 15 minutes per IP.
- **Payment Security:** PCI-DSS compliance via Razorpay hosted fields / checkout popup (no raw credit card numbers hit the KripaConnect backend).

### 4.3 Scalability & Availability
- **Stateless Application Servers:** Express and FastAPI instances are completely stateless, scaling horizontally on container platforms (Render, Docker, Kubernetes).
- **Cache-Aside Architecture:** Upstash Redis reduces MongoDB load by serving hot product listings and category trees.
- **Resilient Microservice Decoupling:** RAG microservice is strictly decoupled; its failure never causes shopping or checkout failures.

---

## 5. Success Metrics & KPIs

| Metric | Target | Measurement Method |
|---|---|---|
| **Checkout Conversion Rate** | > 3.5% of active sessions | Google Analytics / Backend Order vs Cart Ratio |
| **Search-to-Cart Conversion** | > 15% improvement via RAG | Tracking clicks from `SmartSearchModal` |
| **PWA / App Installation Rate** | > 20% of repeat mobile visitors | Service worker `appinstalled` event tracking |
| **API Availability (Uptime)** | 99.9% uptime | Render & UptimeRobot monitoring |
| **Average Order Processing Time**| < 24 hours from Pending to Shipped | Admin order timeline timestamps |
