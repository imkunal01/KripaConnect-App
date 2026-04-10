# KripaConnect — Comprehensive Platform Documentation

> **Version:** 1.0 | **Last Updated:** February 2026 | **Status:** Production-ready

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Repository Structure](#3-repository-structure)
4. [Technology Stack](#4-technology-stack)
5. [Backend — Detailed Documentation](#5-backend--detailed-documentation)
   - 5.1 [Server & Middleware](#51-server--middleware)
   - 5.2 [Database Models](#52-database-models)
   - 5.3 [Authentication System](#53-authentication-system)
   - 5.4 [REST API Reference](#54-rest-api-reference)
   - 5.5 [Services](#55-services)
   - 5.6 [Security Architecture](#56-security-architecture)
6. [Frontend — Detailed Documentation](#6-frontend--detailed-documentation)
   - 6.1 [Application Routing](#61-application-routing)
   - 6.2 [Pages & Features](#62-pages--features)
   - 6.3 [State Management](#63-state-management)
   - 6.4 [Service Layer](#64-service-layer)
   - 6.5 [UI/UX System](#65-uiux-system)
   - 6.6 [Progressive Web App (PWA)](#66-progressive-web-app-pwa)
7. [Role-Based Access Control](#7-role-based-access-control)
8. [Payment System](#8-payment-system)
9. [Mobile App (Android TWA)](#9-mobile-app-android-twa)
10. [Admin Dashboard](#10-admin-dashboard)
11. [B2B Retailer Portal](#11-b2b-retailer-portal)
12. [Email & Notification System](#12-email--notification-system)
13. [Image & File Management](#13-image--file-management)
14. [Environment Configuration](#14-environment-configuration)
15. [Local Development Setup](#15-local-development-setup)
16. [Deployment Guide](#16-deployment-guide)
17. [Scripts & Utilities](#17-scripts--utilities)
18. [Project Status & Roadmap](#18-project-status--roadmap)

---

## 1. Project Overview

**KripaConnect** is a full-stack, production-grade e-commerce platform designed to serve multiple user personas: regular customers, B2B retailers, and administrators. The platform is delivered as a web application (accessible from any browser), a Progressive Web App (installable on mobile home screens), and a native Android app via Trusted Web Activity (TWA).

### What the platform does

- Allows customers to browse a product catalog, add items to a cart, and complete purchases using Cash on Delivery or online payment (Razorpay).
- Provides a **B2B retailer portal** for bulk ordering with dedicated dashboards and spending analytics.
- Provides a **full-featured admin panel** for product, order, user, and review management, backed by real-time analytics.
- Handles the complete order lifecycle: placement → payment → processing → delivery → cancellation.
- Issues downloadable PDF invoices for completed orders.
- Sends transactional emails (order confirmation, password reset, OTP login) via SendGrid.

### Live Deployment
| Layer | URL |
|-------|-----|
| Frontend (Vercel) | `https://kripa-connect-app.vercel.app` |
| Backend API (Render) | `https://kripaconnect-app.onrender.com` |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
│  Browser (PWA)  │  Android TWA App  │  Capacitor Mobile App  │
└─────────────────┬───────────────────┬────────────────────────┘
                  │                   │
                  ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│           FRONTEND  (React 19 + Vite 7 on Vercel)            │
│  React Router │ Context API │ Lazy-loaded pages │ PWA        │
└────────────────────────────┬─────────────────────────────────┘
                             │  HTTPS REST (JSON)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│          BACKEND  (Node.js + Express 5 on Render)            │
│  JWT Auth │ Rate Limiter │ Helmet │ Sanitization │ CORS      │
│  Controllers → Services → Models (Mongoose)                  │
└──────┬───────────────┬──────────────┬────────────────────────┘
       │               │              │
       ▼               ▼              ▼
┌───────────┐  ┌───────────────┐  ┌──────────────────────────┐
│  MongoDB  │  │  Cloudinary   │  │   Third-party Services   │
│  (Atlas)  │  │  (Images)     │  │  Razorpay │ SendGrid     │
└───────────┘  └───────────────┘  └──────────────────────────┘
```

The entire system follows a **monorepo** layout with `backend/` and `frontend/` as independent sub-projects sharing nothing at the code level—only communicating over HTTP.

---

## 3. Repository Structure

```
SKE/                                  ← Monorepo root
│
├── backend/                          ← Node.js + Express API
│   ├── index.js                      ← Entry point (loads env, starts server)
│   ├── package.json
│   ├── data/
│   │   └── products.json             ← Sample product seed data
│   ├── scripts/                      ← One-off utility scripts
│   │   ├── checkPaymentStatus.js     ← Query a Razorpay payment by ID
│   │   ├── seedData.js               ← Seed MongoDB with products/categories
│   │   ├── seedCategories.js         ← Seed categories only
│   │   ├── testRazorpay.js           ← Validate Razorpay credentials
│   │   └── testSendgridEmail.js      ← Send a test email via SendGrid
│   └── src/
│       ├── server.js                 ← Express app (middleware, routes, CORS)
│       ├── config/
│       │   ├── db.js                 ← mongoose.connect() wrapper
│       │   └── redis.js              ← Redis client initialization
│       ├── controllers/              ← Request handlers (one file per domain)
│       │   ├── adminController.js
│       │   ├── adminCategoryController.js
│       │   ├── adminOrderController.js
│       │   ├── adminSubcategoryController.js
│       │   ├── analyticsControllers.js
│       │   ├── authController.js
│       │   ├── cartController.js
│       │   ├── categoryController.js
│       │   ├── favoriteController.js
│       │   ├── invoiceController.js
│       │   ├── orderController.js
│       │   ├── passwordResetController.js
│       │   ├── paymentController.js
│       │   ├── productController.js
│       │   ├── retailerOrderController.js
│       │   ├── reviewController.js
│       │   └── subcategoryController.js
│       ├── middleware/
│       │   ├── authMiddleware.js     ← JWT verification + role enforcement
│       │   ├── errorHandler.js       ← Centralized error response formatter
│       │   ├── security.js           ← Helmet, rate limiting, sanitization
│       │   ├── uploadMiddleware.js   ← Multer config for image uploads
│       │   └── validate.js           ← express-validator result checker
│       ├── models/                   ← Mongoose schemas
│       │   ├── Category.js
│       │   ├── Order.js
│       │   ├── Product.js
│       │   ├── Review.js
│       │   ├── Subcategory.js
│       │   ├── Transaction.js
│       │   └── User.js
│       ├── routes/                   ← Express routers (mounted in server.js)
│       │   ├── adminRoutes.js
│       │   ├── analyticsRoutes.js
│       │   ├── authRoutes.js
│       │   ├── cartRoutes.js
│       │   ├── categoryRoutes.js
│       │   ├── favoriteRoutes.js
│       │   ├── invoiceRoutes.js
│       │   ├── orderRoutes.js
│       │   ├── paymentRoutes.js
│       │   ├── productRoutes.js
│       │   ├── retailerRoutes.js
│       │   ├── reviewRoutes.js
│       │   └── subcategoryRoutes.js
│       ├── services/
│       │   ├── cloudinaryService.js  ← Upload/delete images via Cloudinary SDK
│       │   ├── emailService.js       ← SendGrid transactional emails
│       │   ├── invoiceService.js     ← Invoice data preparation
│       │   ├── pdfService.js         ← PDFKit PDF generation
│       │   └── razorpayService.js    ← Razorpay order creation + verification
│       ├── validations/
│       │   ├── authValidations.js    ← express-validator rules for auth routes
│       │   └── orderValidations.js
│       └── validators/
│           └── ProductValidator.js
│
├── frontend/                         ← React 19 + Vite 7 SPA
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── capacitor.config.json         ← Capacitor mobile (iOS/Android) config
│   ├── vercel.json                   ← Vercel SPA rewrite rules
│   ├── public/                       ← Static assets (favicon, PWA icons, etc.)
│   └── src/
│       ├── App.jsx                   ← Root component, all route definitions
│       ├── main.jsx                  ← React DOM render root, context providers
│       ├── index.css                 ← Global styles + CSS custom properties
│       ├── pages/                    ← One component per route
│       ├── components/               ← Shared/reusable UI components
│       ├── context/                  ← React Context providers
│       ├── hooks/                    ← Custom React hooks
│       ├── services/                 ← API call abstractions (Axios/fetch)
│       ├── styles/                   ← Per-page/component CSS modules
│       └── assets/                   ← Images, fonts, icons
│
└── twa-kripa-connect/                ← Native Android TWA app
    ├── twa-manifest.json             ← TWA configuration
    ├── assetlinks.json               ← Digital Asset Links for app verification
    ├── build.gradle / settings.gradle
    ├── app/
    │   ├── build.gradle
    │   └── src/                      ← Android Java source
    ├── BUILD_DOCUMENTATION.md        ← Full build guide
    ├── INSTALLATION_GUIDE.md         ← End-user APK install guide
    └── UPLOAD_INSTRUCTIONS.md        ← assetlinks.json deployment guide
```

---

## 4. Technology Stack

### Backend

| Category | Technology | Version / Notes |
|----------|-----------|-----------------|
| Runtime | Node.js | ≥ 18.x |
| Framework | Express | 5.x |
| Database | MongoDB + Mongoose ODM | Atlas cloud |
| Caching | Redis | Optional; via `config/redis.js` |
| Authentication | JSON Web Tokens (`jsonwebtoken`) | Access + Refresh token pattern |
| OAuth | Google Identity (`google-auth-library`) | Token/credential verification |
| Email | SendGrid (`@sendgrid/mail`) | Transactional emails & OTP |
| Payments | Razorpay Node SDK | Payment orders, verify, webhooks |
| File Uploads | Multer | multipart/form-data to memory |
| Cloud Storage | Cloudinary | Product images, profile photos |
| PDF | PDFKit | Invoice generation |
| Security | Helmet.js | HTTP security headers |
| Rate Limiting | `express-rate-limit` | Global + route-specific limits |
| Sanitization | `mongo-sanitize` | NoSQL injection prevention |
| Password Hashing | `bcryptjs` | Salt rounds = 12 |
| Cookies | `cookie-parser` | httpOnly refresh token cookie |
| Logging | Morgan | HTTP request logging |
| Slug | `slugify` | URL-friendly product names |
| Validation | `express-validator` | Schema-based input validation |

### Frontend

| Category | Technology | Version / Notes |
|----------|-----------|-----------------|
| Framework | React | 19.x |
| Build Tool | Vite | 7.x |
| Routing | React Router DOM | 7.x |
| Google Auth | `@react-oauth/google` | `GoogleOAuthProvider` wrapper |
| Notifications | React Hot Toast | 2.x |
| Charts | Recharts | 3.x (admin analytics) |
| Icons | React Icons | 5.x |
| Mobile | Capacitor | 8.x |
| Linting | ESLint | React + Hooks plugins |
| Styling | Custom CSS + CSS Variables | No external UI framework |

### Mobile / Android

| Category | Technology |
|----------|-----------|
| App Type | Trusted Web Activity (TWA) |
| Build Tool | Bubblewrap CLI (Google) |
| Gradle | Android Gradle Plugin |
| Min SDK | Android 5.0 (API 21) |
| Target | Android 14+ |

---

## 5. Backend — Detailed Documentation

### 5.1 Server & Middleware

The entry point `index.js` loads environment variables with `dotenv`, calls `connectDB()`, initializes the Redis client, and starts the Express server. The actual Express application is configured in `src/server.js`.

**Middleware stack (in order):**

1. `app.set('trust proxy', 1)` — enables accurate client IP detection behind Render/Vercel proxies (required for rate limiting).
2. `cors(corsOptions)` — enforces an allowlist; Vercel preview URLs (`*.vercel.app`) are automatically allowed.
3. `express.json` with raw body capture — the raw buffer is stored as `req.rawBody` for Razorpay webhook signature verification.
4. `express.urlencoded` — parses URL-encoded form bodies.
5. `cookie-parser` — parses the `refreshToken` httpOnly cookie.
6. `morgan('dev')` — HTTP request logging in development.
7. **Helmet** — sets security-hardening HTTP headers (CSP, HSTS, X-Frame-Options, etc.).
8. **Global rate limiter** — applied to all `/api/*` routes.
9. **Sanitize request** — strips `$` and `.` characters from `req.body`, `req.query`, and `req.params`.
10. Per-route **strict rate limiters** — tighter limits on OTP and forgot-password endpoints to prevent abuse.

**Health check:** `GET /` returns a JSON response with server uptime, environment, and a status message.

### 5.2 Database Models

#### User

```
User {
  name: String (required)
  email: String (unique, lowercase)
  password: String (bcrypt hash, select:false)
  phone: String
  role: Enum ['customer', 'retailer', 'admin'] (default: 'customer')
  googleId: String
  authProvider: Enum ['local', 'google'] (default: 'local')
  profileImage: { url, publicId }
  savedAddresses: [{ label, street, city, state, pincode, isDefault }]
  isBlocked: Boolean (default: false)
  refreshToken: String (select:false)
  resetPasswordToken: String
  resetPasswordExpires: Date
  otpCode: String
  otpExpires: Date
  timestamps: true
}
```

#### Product

```
Product {
  name: String (required)
  slug: String (unique, auto-generated)
  description: String
  price: Number (required)
  discountedPrice: Number
  category: ObjectId → Category
  subcategory: ObjectId → Subcategory
  stock: Number (default: 0)
  images: [{ url, publicId }]  ← up to 6 Cloudinary images
  ratings: { average, count }
  tags: [String]
  isFeatured: Boolean
  isActive: Boolean (default: true)
  timestamps: true
}
```

#### Order

```
Order {
  user: ObjectId → User (required)
  items: [{
    product: ObjectId → Product
    name: String
    price: Number
    quantity: Number
    image: String
  }]
  shippingAddress: { street, city, state, pincode, phone }
  paymentMethod: Enum ['COD', 'razorpay']
  paymentStatus: Enum ['pending', 'paid', 'failed']
  orderStatus: Enum ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  subtotal: Number
  shippingCharge: Number
  totalAmount: Number
  razorpayOrderId: String
  razorpayPaymentId: String
  notes: String
  timeline: [{ status, timestamp, note }]
  timestamps: true
}
```

#### Transaction

```
Transaction {
  order: ObjectId → Order
  user: ObjectId → User
  razorpayOrderId: String
  razorpayPaymentId: String
  razorpaySignature: String
  amount: Number
  currency: String
  status: Enum ['created', 'captured', 'failed']
  payload: Mixed (full Razorpay webhook payload for audit)
  timestamps: true
}
```

#### Review

```
Review {
  product: ObjectId → Product
  user: ObjectId → User
  rating: Number (1–5, required)
  comment: String
  isApproved: Boolean (default: false)
  timestamps: true
}
```

#### Category / Subcategory

```
Category  { name, slug, image, description, isActive }
Subcategory { name, slug, category: ObjectId → Category, isActive }
```

### 5.3 Authentication System

KripaConnect implements a **dual-token authentication** system:

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access Token (JWT) | Memory / Authorization header | Short-lived (e.g., 15 min) | API request authorization |
| Refresh Token (JWT) | httpOnly cookie (`refreshToken`) | Long-lived (e.g., 7 days) | Issue new access tokens |

**Authentication flows:**

1. **Email/Password Login** — validates credentials, returns access token in JSON body + sets refresh token cookie.
2. **Google Sign-In** — frontend sends Google credential (ID token) or access token; backend verifies with `google-auth-library`, finds or creates user, returns same token pair.
3. **Email OTP Login** — two-step passwordless: request OTP → receive email → verify OTP. No password required. OTP expires in 10 minutes.
4. **Refresh** — `POST /api/auth/refresh` reads the `refreshToken` cookie, validates it, and issues a new access token.
5. **Logout** — clears the `refreshToken` cookie; client discards the access token.
6. **Forgot/Reset Password** — sends a time-limited reset link to the registered email; the reset token is hashed and stored on the User document.

**Auth Middleware (`authMiddleware.js`):**
- Extracts Bearer token from `Authorization` header.
- Verifies signature and expiry.
- Attaches `req.user` (decoded payload including `_id`, `role`).
- `protect` — requires any valid authenticated user.
- `restrictTo(...roles)` — requires a specific role (`'admin'`, `'retailer'`, etc.).

### 5.4 REST API Reference

Base URL: `http://localhost:5000` (dev) / `https://kripaconnect-app.onrender.com` (prod)

---

#### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Create account with email + password |
| POST | `/login` | Public | Email/password login |
| POST | `/logout` | Public | Clear refresh token cookie |
| POST | `/refresh` | Cookie | Issue new access token |
| POST | `/google` | Public | Google OAuth sign-in/sign-up |
| GET | `/profile` | Protected | Fetch current user's profile |
| PUT | `/profile` | Protected | Update name, phone |
| POST | `/profile/photo` | Protected | Upload profile photo (multipart) |
| PUT | `/profile/address` | Protected | Save/update default shipping address |
| POST | `/forgot-password` | Public | Send password reset email |
| POST | `/reset-password` | Public | Reset password with token |
| POST | `/login-otp/request` | Public | Request Email OTP |
| POST | `/login-otp/verify` | Public | Verify OTP and receive tokens |

---

#### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List all products (pagination, filter, search) |
| GET | `/:id` | Public | Single product details |
| POST | `/` | Admin | Create product with up to 6 images |
| PUT | `/:id` | Admin | Update product info and images |
| DELETE | `/:id` | Admin | Delete product and all Cloudinary images |
| DELETE | `/:productId/image/:publicId` | Admin | Remove a single product image |

---

#### Categories & Subcategories — `/api/categories`, `/api/subcategories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Public | List all active categories |
| GET | `/api/categories/:id` | Public | Single category |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |
| GET | `/api/subcategories` | Public | List subcategories (filter by category) |
| POST | `/api/subcategories` | Admin | Create subcategory |

---

#### Cart — `/api/cart` (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get current user's cart |
| POST | `/add` | Add item or increase quantity |
| PUT | `/item/:productId` | Update item quantity |
| DELETE | `/item/:productId` | Remove item |

---

#### Favorites — `/api/favorites` (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get wishlist |
| POST | `/` | Add product to wishlist |
| DELETE | `/:productId` | Remove product from wishlist |

---

#### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/?productId=` | Public | Get approved reviews for a product |
| POST | `/` | Protected | Submit a review |
| DELETE | `/:id` | Admin | Delete a review |
| PUT | `/:id/approve` | Admin | Approve a review |

---

#### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Protected | Place new order |
| GET | `/my` | Protected | Current user's order history |
| GET | `/:id` | Protected | Order detail (owner or admin) |
| PUT | `/:id/cancel` | Protected | Cancel an order |
| GET | `/` | Admin | All orders (with filters) |
| PUT | `/:id/status` | Admin | Update order delivery status |
| DELETE | `/:id` | Admin | Delete order record |

---

#### Payments — `/api/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create-order` | Protected | Create Razorpay order for an app order |
| POST | `/verify` | Protected | Verify payment signature and mark order paid |
| POST | `/webhook` | Public | Razorpay webhook receiver |

---

#### Invoices — `/api/invoices` (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:orderId` | Generate and return PDF invoice for an order |

---

#### Analytics — `/api/analytics` (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Total revenue, orders, users, low stock count |
| GET | `/revenue` | Revenue by day/week/month |
| GET | `/orders` | Order counts by status |
| GET | `/top-products` | Best-selling products |
| GET | `/user-growth` | New user registrations over time |
| GET | `/low-stock` | Products with stock below threshold |

---

#### Admin — `/api/admin` (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| PUT | `/users/block/:id` | Toggle user block status |
| PUT | `/users/role/:id` | Change user role |
| DELETE | `/users/:id` | Delete user account |
| GET | `/stats` | Platform-wide user statistics |
| GET | `/orders` | All orders with full detail |
| GET | `/orders/:id` | Single order admin view |
| GET | `/retailer-orders` | Retailer-filtered orders |
| PUT | `/orders/status/:id` | Update order status |
| DELETE | `/orders/:id` | Delete order |

---

#### Retailer — `/api/retailer` (Retailer)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Retailer's own orders with time filters |
| GET | `/orders/:id` | Individual order for retailer view |
| GET | `/stats` | Retailer spending and order statistics |

---

### 5.5 Services

| Service | File | Responsibility |
|---------|------|---------------|
| Cloudinary Service | `cloudinaryService.js` | Upload image buffer to Cloudinary using `streamifier`; delete image by `publicId` |
| Email Service | `emailService.js` | Send transactional emails via SendGrid — OTP, password reset link, order confirmation |
| Razorpay Service | `razorpayService.js` | Initialize Razorpay SDK; create payment orders; verify HMAC-SHA256 signature |
| PDF Service | `pdfService.js` | Generate printable PDF documents using PDFKit |
| Invoice Service | `invoiceService.js` | Assemble invoice data from Order + Product documents; delegate PDF rendering |

### 5.6 Security Architecture

| Layer | Mechanism | Details |
|-------|-----------|---------|
| Transport | HTTPS enforced | Trust proxy enabled; cookies use `secure: true` in production |
| Headers | Helmet.js | Prevents clickjacking, MIME sniffing, enables HSTS |
| Auth | JWT + httpOnly Cookie | Access token in memory; refresh token in `httpOnly` cookie; not accessible via JS |
| Rate Limiting | `express-rate-limit` | Global 100 req/15 min on all API routes; tighter limits on OTP (5 req/15 min) and forgot-password |
| Injection | `mongo-sanitize` | Strips `$` operators from all user input before DB operations |
| XSS | Sanitization middleware | Input sanitization across body/query/params |
| CORS | Allowlist | Only trusted origins; wildcard rejected except Vercel preview domains |
| Passwords | `bcryptjs` | Salt rounds = 12 |
| Webhook | HMAC signature | Razorpay webhook signature verified using raw body + secret |

---

## 6. Frontend — Detailed Documentation

### 6.1 Application Routing

The application uses React Router DOM v7 with code-splitting via `React.lazy()` and `<Suspense>`. Every route component is lazy-loaded, so only the code relevant to the visited page is delivered to the browser.

```
Route Map
─────────────────────────────────────────────────────
PUBLIC ROUTES (no auth required)
  /                         Dashboard (Home)
  /login                    Login page
  /signup                   Sign-up page
  /forgot-password          Request password reset
  /reset-password           Reset password with token
  /products                 Product catalog
  /product/:id              Product detail
  /categories               Category browser
  /favorites                Wishlist (guest-accessible)
  /cart                     Shopping cart
  /about                    About us page
  /services                 Services info page
  /faq                      FAQ page
  /contact                  Contact form
  /privacy                  Privacy policy
  /terms                    Terms & conditions
  /returns                  Refund policy

PROTECTED ROUTES (require login)
  /checkout                 Multi-step checkout
  /success/:orderId         Order success confirmation
  /profile                  User profile management
  /onboarding               Address setup (new users)
  /address-setup            Alias for /onboarding
  /orders                   Order history
  /orders/:id               Individual order detail

ROLE-PROTECTED ROUTES
  /b2b                      B2B retailer dashboard (role: retailer)
  /admin                    Admin panel (role: admin)
─────────────────────────────────────────────────────
```

**`ProtectedRoute` component** reads auth state from `AuthContext`. If the user is not logged in, it redirects to `/login`. The `allow` prop optionally restricts access to specific roles (e.g., `allow={['admin']}`).

### 6.2 Pages & Features

#### Dashboard (`/`)
The home page of the platform. Contains:
- **Hero section** with a prominent CTA leading to the product catalog.
- **Featured products** — products flagged `isFeatured: true` displayed in a horizontal scroller.
- **Category grid** — all active categories as clickable cards.
- **Special offers / promotional banners** (static or admin-configurable).

#### Products (`/products`)
A full-featured product listing page:
- **Search bar** — filters products by name/tags as the user types.
- **FiltersSidebar** — filter by category, subcategory, price range, and availability.
- **Sort options** — price ascending/descending, newest, rating.
- **Infinite scroll / pagination** — fetches products in pages from the backend.
- **Product cards** — show thumbnail, name, price, discounted price, average rating.

#### Product Details (`/product/:id`)
- **Multi-image gallery** — thumbnail strip + full-size viewer.
- **Add to Cart** — quantity selector; calls `/api/cart/add`.
- **Add to Favorites** — `FavoritesButton` toggles wishlist status.
- **Reviews section** — lists approved reviews with ratings; authenticated users can submit their own review.
- **Related products** — products in the same category.

#### Cart (`/cart`)
- Lists all cart items with product image, name, price, and quantity controls.
- Inline quantity update (PUT `/api/cart/item/:productId`).
- Remove item button (DELETE `/api/cart/item/:productId`).
- Real-time subtotal, shipping, and total calculation displayed in an order summary panel.
- Proceed to Checkout CTA (redirects to `/login` if unauthenticated).

#### Checkout (`/checkout`)
Multi-step checkout flow:
1. **Address step** — choose from saved addresses or type a new one (with option to save).
2. **Payment step** — choose between Cash on Delivery (COD) or Razorpay online payment.
3. **Review step** — confirm items, address, and payment method before placing order.
4. Order is created via `POST /api/orders`.
5. If Razorpay is selected: `POST /api/payments/create-order` → Razorpay JS SDK checkout modal → `POST /api/payments/verify`.
6. On success: redirect to `/success/:orderId`.

#### Order History (`/orders`)
- Paginated list of the user's past orders.
- Each card shows order date, total, status badge (colour-coded), and item count.
- Status values: **Pending → Processing → Shipped → Delivered** / **Cancelled**.
- Click any order to view detailed breakdown.

#### Order Details (`/orders/:id`)
- Full order breakdown: items with images, quantities, prices.
- `OrderTimeline` component renders a visual timeline of status changes.
- Order cancellation button (if status allows).
- Invoice download button (if PDF available).
- Shipping address and payment method summary.

#### Profile (`/profile`)
- Update name and phone number.
- Upload/change profile photo (multipart upload to Cloudinary).
- Manage multiple saved shipping addresses (add, edit, set as default).
- Account statistics (total orders, total spent).

#### Onboarding (`/onboarding`)
For first-time users redirected here after signup, before their first checkout. Collects a default shipping address via `AddressForm`.

#### Auth Pages
- **Login** (`/login`): Email/password, Email OTP (two-step), Google Sign-In button.
- **Signup** (`/signup`): Name, email, password, confirm password.
- **Forgot Password** (`/forgot-password`): Email input → triggers password reset email.
- **Reset Password** (`/reset-password`): New password + token from URL query param.

#### Information Pages
Static pages rendered from React components: About, Services, FAQ, Contact, Privacy Policy, Terms & Conditions, Refund Policy.

#### 404 Not Found
Custom `NotFound` page for any unmatched route.

---

### 6.3 State Management

State is managed via **React Context API** (no Redux or Zustand).

#### `AuthContext` (`context/AuthContext.jsx`)
- Holds: `user` object, `token` (access JWT), `loading`.
- On app load: attempts to restore session by calling `POST /api/auth/refresh` (uses httpOnly cookie).
- Provides: `login()`, `logout()`, `updateUser()` helpers.
- The `main.jsx` wraps the entire app in `<AuthProvider>`.

#### `ShopContext` (`context/ShopContext.jsx`)
- Holds: `cart` items array, `favorites` array.
- Syncs with backend on mount (fetches cart and favorites for logged-in users).
- Provides: `addToCart()`, `removeFromCart()`, `updateQuantity()`, `addToFavorites()`, `removeFromFavorites()`.
- Cart item count is derived state used in the `Navbar` badge.

---

### 6.4 Service Layer

All API calls are centralized in `src/services/`. Each file corresponds to a backend domain:

| File | Responsibility |
|------|---------------|
| `api.js` | Base Axios instance with `baseURL`, `withCredentials: true`, auto-attaches `Authorization` header from `AuthContext` |
| `auth.js` | `register`, `login`, `googleLogin`, `requestOTP`, `verifyOTP`, `forgotPassword`, `resetPassword`, `getProfile`, `updateProfile` |
| `products.js` | `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct` |
| `categories.js` | `getCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory` |
| `cart.js` | `getCart`, `addToCart`, `updateCartItem`, `removeFromCart` |
| `orders.js` | `createOrder`, `getMyOrders`, `getOrderById`, `cancelOrder` |
| `payments.js` | `createRazorpayOrder`, `verifyPayment` |
| `favorites.js` | `getFavorites`, `addFavorite`, `removeFavorite` |
| `reviews.js` | `getReviews`, `submitReview` |
| `admin.js` | All admin-scoped calls (users, analytics, product management, etc.) |

---

### 6.5 UI/UX System

**Theming:** Styles are built with plain CSS and CSS custom properties defined on `:root`. Both light and dark palettes are defined; toggling the theme swaps variable values. No external component library is used.

**Key design values:**
- Primary brand color: `#E63946` (KripaConnect red).
- Background: `#FFFFFF` (light) / dark equivalent.
- Font: System UI stack for maximum performance.

**Component library (custom):**

| Component | Description |
|-----------|-------------|
| `Navbar.jsx` | Top navigation bar with cart badge, auth state, mobile hamburger |
| `Footer.jsx` | Site footer with links, social icons |
| `ProtectedRoute.jsx` | HOC-style route wrapper with redirect logic |
| `OrderTimeline.jsx` | Vertical timeline of order status history |
| `AddressForm.jsx` | Reusable shipping address form |
| `FavoritesButton.jsx` | Heart icon toggle that calls favorites API |
| `FiltersSidebar.jsx` | Left-side filter panel for product listing |
| `AppToaster.jsx` | Configures `react-hot-toast` with global styling |

**Loading States:** Skeleton screens are used for product grids and lists to prevent layout shifts. Individual buttons show spinners when their action is in-flight.

**Toast Notifications:** `react-hot-toast` provides non-blocking success/error/loading toasts triggered by API call outcomes.

---

### 6.6 Progressive Web App (PWA)

The frontend is configured as a PWA with:
- **Web App Manifest** (`/public/manifest.json`) — app name, icons (multiple sizes), theme color, start URL, display mode (`standalone`).
- **Service Worker** — enables offline asset caching and background sync (configured in Vite build).
- **Add to Home Screen** — browsers prompt the user; the app opens in fullscreen without a browser address bar.
- **Capacitor** (`capacitor.config.json`) — wraps the web app into a native iOS/Android binary with access to device APIs (camera, file system, etc.).

---

## 7. Role-Based Access Control

The platform defines three user roles enforced at both the **backend middleware** and **frontend route** levels:

| Role | Backend enforcement | Frontend access |
|------|--------------------|-----------------| 
| `customer` (default) | All authenticated routes | All customer pages (cart, orders, profile, checkout) |
| `retailer` | Retailer-specific routes via `restrictTo('retailer')` | `/b2b` dashboard via `allow={['retailer']}` |
| `admin` | Admin + analytics routes via `restrictTo('admin')` | `/admin` panel via `allow={['admin']}` |

Admins can change a user's role via `PUT /api/admin/users/role/:id`. Blocked users (`isBlocked: true`) receive a 403 response on all protected endpoints.

---

## 8. Payment System

KripaConnect integrates **Razorpay** for online payments alongside a **Cash on Delivery** option.

### Payment Flow (Razorpay)

```
Customer selects Razorpay at checkout
        │
        ▼
POST /api/orders → order created with paymentStatus: 'pending'
        │
        ▼
POST /api/payments/create-order
  → Backend calls Razorpay API to create a payment order
  → Returns { razorpayOrderId, amount, currency, keyId }
        │
        ▼
Frontend opens Razorpay checkout modal (Razorpay JS SDK)
  → Customer enters card/UPI/netbanking details
  → Modal returns { razorpayPaymentId, razorpayOrderId, signature }
        │
        ▼
POST /api/payments/verify
  → Backend verifies HMAC-SHA256 signature using webhook secret
  → Updates Order.paymentStatus to 'paid'
  → Creates Transaction document for audit trail
        │
        ▼
Redirect to /success/:orderId
```

### Webhook Handler

`POST /api/payments/webhook` is registered in the Razorpay Dashboard. The backend:
1. Reads the raw request body (preserved via `verify` callback in `express.json`).
2. Validates the `X-Razorpay-Signature` header.
3. On `payment.captured` — marks order as paid (idempotent duplicate of verify).
4. On `payment.failed` — marks payment as failed; order remains visible but unpaid.

### Cash on Delivery

COD orders are created with `paymentMethod: 'COD'` and `paymentStatus: 'pending'`. Payment is collected by the delivery agent and the status is manually updated to `'paid'` by an admin.

---

## 9. Mobile App (Android TWA)

### What is a TWA?

Trusted Web Activity (TWA) is a Google-sanctioned Android feature that opens a web URL in Chrome in fullscreen mode, with all browser UI hidden. The app appears and behaves identically to a native app. The TWA technology binds the website URL to the APK via **Digital Asset Links**, preventing other apps from impersonating the website.

### App Configuration

| Property | Value |
|----------|-------|
| Package ID | `app.vercel.kripa_connect_app.twa` |
| Website URL | `https://kripa-connect-app.vercel.app` |
| App Name | KripaConnect |
| Theme Color | `#E63946` |
| Start URL | `/?source=twa` |
| Orientation | Portrait |
| Min Android | 5.0 (API 21) |
| Version | 1.0 (Code: 1) |

### Supported Native Features

| Feature | Status |
|---------|--------|
| Fullscreen (no browser UI) | ✅ Enabled |
| Push Notifications | ✅ Via service worker |
| Location Access | ✅ Delegated permission |
| Camera / Microphone | ✅ Via browser APIs |
| File Upload / Download | ✅ Native Android file picker |
| Offline Support | ✅ Via service worker |
| Storage (localStorage, IndexedDB) | ✅ Enabled |

### Digital Asset Links

The file `assetlinks.json` must be served at:
```
https://kripa-connect-app.vercel.app/.well-known/assetlinks.json
```

This file contains the SHA-256 fingerprint of the APK signing certificate, establishing trust between Chrome/Android and the APK.

### Build Commands

```bash
cd twa-kripa-connect
./gradlew assembleRelease          # Build signed APK
./gradlew installRelease           # Install on connected device
# Output: app/build/outputs/apk/release/app-release.apk
```

---

## 10. Admin Dashboard

The admin panel at `/admin` is a fully-featured back-office application. It is only accessible to users with `role: 'admin'`.

### Admin Dashboard Home

- **KPI Cards**: Total Revenue, Total Orders, Total Users, Low Stock Count — all fetched from `GET /api/analytics/overview`.
- **Revenue Chart** (Recharts `LineChart`): Daily/weekly revenue trends.
- **Order Distribution Chart** (Recharts `PieChart`): Orders grouped by status.
- **Low Stock Alert Table**: Products with stock ≤ threshold, linking directly to the product edit form.

### Product Management

- Full product list with search, category filter, and pagination.
- **Create product** form: name, description, price, discounted price, category, subcategory, stock, and multi-image upload (up to 6 images).
- **Edit product**: all fields editable; individual images can be removed.
- **Delete product**: removes from DB and deletes all Cloudinary images.

### Order Management

- View all platform orders with status filter (pending, processing, shipped, delivered, cancelled).
- Update order status via a dropdown.
- Full order detail modal showing customer info, items, payment method, shipping address, and timeline.
- Delete order records.

### User Management

- List all registered users with registration date, role, and block status.
- Block / Unblock users — blocked users cannot authenticate.
- Change user role (customer ↔ retailer ↔ admin).
- Delete users.

### Review Moderation

- All submitted reviews (approved and pending).
- Approve reviews to make them publicly visible on product pages.
- Delete spam or inappropriate reviews.

### Invoice Generation

Admin can trigger PDF invoice generation for any order via `POST /api/invoices/:orderId`. The generated PDF includes order details, itemised list with subtotals, tax/shipping breakdown, and business/customer information.

---

## 11. B2B Retailer Portal

The `/b2b` route is a dedicated dashboard for users with `role: 'retailer'`. It provides:

- **Order list** with time-period filters: This Month, Last 3 Months, All Time.
- **Statistics cards**: Total orders, total amount spent, average order value, items purchased.
- **Order detail modal**: Full breakdown of each retailer order.
- **Spending insights**: Monthly trend visualisation.

The backend exposes retailer-specific routes under `/api/retailer` using `restrictTo('retailer')` middleware. Admins can also view all retailer orders via `GET /api/admin/retailer-orders`.

---

## 12. Email & Notification System

All outbound emails are sent via **SendGrid** using the `@sendgrid/mail` package.

### Email Types

| Email | Trigger | Content |
|-------|---------|---------|
| OTP Login | `POST /api/auth/login-otp/request` | 6-digit OTP valid for 10 minutes |
| Password Reset | `POST /api/auth/forgot-password` | Clickable reset link with expiry |
| Order Confirmation | Order placed successfully | Order summary with item list and total |

### Configuration

```env
SENDGRID_API_KEY=SG.xxxxxxxx
EMAIL_FROM_EMAIL=verified-sender@yourdomain.com
EMAIL_FROM_NAME=KripaConnect
```

The `EMAIL_FROM_EMAIL` must be a verified sender identity in the SendGrid dashboard.

---

## 13. Image & File Management

All user-uploaded images (product photos and profile pictures) are stored in **Cloudinary**.

### Upload Flow

1. Client submits multipart form with `files` field.
2. **Multer** (configured in `uploadMiddleware.js`) accepts up to 6 files, stores in memory buffer.
3. `cloudinaryService.js` streams each buffer to Cloudinary using `streamifier.createReadStream()` → `cloudinary.uploader.upload_stream()`.
4. Cloudinary returns `{ secure_url, public_id }` for each image.
5. URLs and `public_id`s are saved to the Product/User document in MongoDB.

### Delete Flow

- Admins deleting a product or a single product image trigger `cloudinaryService.deleteImage(publicId)` which calls `cloudinary.uploader.destroy()`.
- Profile photo updates delete the old `publicId` before uploading the new one.

### Multer Configuration

- Storage: `memoryStorage()` (files never written to disk).
- File size limit: configurable per endpoint.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.

---

## 14. Environment Configuration

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Optional | Server port (default: 5000) |
| `NODE_ENV` | Optional | `development` or `production` |
| `MONGO_URI` | **Required** | MongoDB connection string (Atlas) |
| `JWT_SECRET` | **Required** | Access token signing secret |
| `JWT_REFRESH_SECRET` | **Required** | Refresh token signing secret |
| `SENDGRID_API_KEY` | **Required** | SendGrid API key |
| `EMAIL_FROM_EMAIL` | **Required** | Verified sender email address |
| `EMAIL_FROM_NAME` | Optional | Sender display name |
| `FRONTEND_URL` | **Required** | Production frontend URL (for CORS + reset links) |
| `ALLOWED_ORIGINS` | Optional | Additional comma-separated CORS origins |
| `RAZORPAY_KEY_ID` | **Required** | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | **Required** | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | **Required** | Webhook signature secret |
| `CLOUDINARY_CLOUD_NAME` | **Required** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Required** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Required** | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | **Required** | Google OAuth client ID (for token verification) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | **Required** | Backend base URL |
| `VITE_GOOGLE_CLIENT_ID` | **Required** | Google OAuth client ID for `GoogleOAuthProvider` |

---

## 15. Local Development Setup

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- MongoDB Atlas account (or local MongoDB ≥ 6.x)
- Cloudinary account
- SendGrid account (with verified sender)
- Razorpay test account (for payment testing)
- (Optional) Redis instance

### 1. Clone the repository

```bash
git clone <repo-url>
cd SKE
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create `backend/.env` and fill in all required variables (see section 14).

```bash
npm start
# API available at http://localhost:5000
```

To seed the database with sample data:
```bash
npm run seed
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

```bash
npm run dev
# App available at http://localhost:5173
```

### 4. Verify Services

```bash
# Test Razorpay credentials
cd backend && npm run test:razorpay

# Test SendGrid email
cd backend && npm run test:email
```

---

## 16. Deployment Guide

### Backend (Render / Railway / Heroku)

1. Push code to your Git provider.
2. Create a new Web Service on Render pointing to the `backend/` directory.
3. Set **Build Command**: `npm install`; **Start Command**: `npm start`.
4. Add all environment variables from section 14 in the platform dashboard.
5. Set `NODE_ENV=production`, `FRONTEND_URL=<vercel-url>`.
6. Configure the Razorpay webhook in the Razorpay Dashboard:
   - URL: `https://<your-backend>.onrender.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET`.

### Frontend (Vercel)

1. Import the repository on Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command**: `npm run build`; **Output Directory**: `dist`.
4. Add `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` in Vercel environment settings.
5. The `vercel.json` file already configures SPA rewrites (all paths → `index.html`).

### Android TWA App

1. Ensure `assetlinks.json` is reachable at `https://<your-domain>/.well-known/assetlinks.json`.
2. Update the SHA-256 fingerprint in `assetlinks.json` to match your signing keystore.
3. Build the APK:
   ```bash
   cd twa-kripa-connect
   ./gradlew assembleRelease
   ```
4. Distribute `app/build/outputs/apk/release/app-release.apk` directly or via Play Store.

---

## 17. Scripts & Utilities

### Backend Scripts (`backend/scripts/`)

| Script | npm command | Purpose |
|--------|-------------|---------|
| `seedData.js` | `npm run seed` | Populates MongoDB with sample products and categories from `data/products.json` |
| `seedCategories.js` | *(direct)* | Seed only category data |
| `checkPaymentStatus.js` | `npm run check:payment` | Query a Razorpay payment by ID and print status |
| `testRazorpay.js` | `npm run test:razorpay` | Verify Razorpay API credentials are valid |
| `testSendgridEmail.js` | `npm run test:email` | Send a test email via SendGrid to verify configuration |

### Frontend Scripts (`frontend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run prebuild` | Generate PWA icon set (runs automatically before `build`) |

### TWA Scripts (`twa-kripa-connect/`)

| Command | Purpose |
|---------|---------|
| `./gradlew assembleRelease` | Build signed release APK |
| `./gradlew assembleDebug` | Build unsigned debug APK |
| `./gradlew installRelease` | Build and install on connected Android device via ADB |

---

## 18. Project Status & Roadmap

### Completed Features ✅

| Feature | Status |
|---------|--------|
| Email/password authentication | ✅ Complete |
| Email OTP passwordless login | ✅ Complete |
| Google OAuth sign-in | ✅ Complete |
| Password reset via email | ✅ Complete |
| JWT access + refresh token rotation | ✅ Complete |
| Product catalog with categories & subcategories | ✅ Complete |
| Multi-image product upload (Cloudinary) | ✅ Complete |
| Shopping cart (persistent, server-side) | ✅ Complete |
| Favorites / Wishlist | ✅ Complete |
| Multi-step checkout flow | ✅ Complete |
| Cash on Delivery payments | ✅ Complete |
| Razorpay online payment integration | ✅ Complete |
| Razorpay webhook handler | ✅ Complete |
| Transaction audit trail | ✅ Complete |
| Order management & tracking | ✅ Complete |
| Order status timeline | ✅ Complete |
| Order cancellation | ✅ Complete |
| PDF invoice generation | ✅ Complete |
| Product reviews & ratings | ✅ Complete |
| Admin dashboard with analytics | ✅ Complete |
| Admin product management | ✅ Complete |
| Admin order management | ✅ Complete |
| Admin user management | ✅ Complete |
| Admin review moderation | ✅ Complete |
| B2B retailer portal | ✅ Complete |
| Profile management (photo, address) | ✅ Complete |
| Responsive mobile-first UI | ✅ Complete |
| Dark/light theme toggle | ✅ Complete |
| PWA manifest + service worker | ✅ Complete |
| Android TWA native app | ✅ Complete |
| Capacitor mobile support | ✅ Complete |
| SendGrid email notifications | ✅ Complete |
| Security hardening (Helmet, rate limiting) | ✅ Complete |

### Planned Enhancements 🚧

| Enhancement | Priority |
|-------------|----------|
| Guest checkout (no login required) | High |
| Convert to customer-only app (remove retailer flow) | High |
| WhatsApp order notifications | Medium |
| Discount codes and promotions system | Medium |
| SMS OTP as alternative to email OTP | Medium |
| Advanced product filters (price range slider, multi-rating) | Medium |
| Bulk product import/export (CSV/Excel) | Low |
| Enhanced analytics (LTV, cohort, funnel) | Low |
| Subscription / recurring orders for B2B | Low |
| Multi-language support (i18n) | Low |
| iOS app via Capacitor | Low |
| Inventory management improvements | Low |

---

## Appendix: Quick Reference

### Common API Patterns

**Authenticated API call (frontend):**
```javascript
// services/api.js automatically attaches the token
import api from './api'
const response = await api.get('/products')
```

**Admin-only request (backend):**
```javascript
router.get('/stats', protect, restrictTo('admin'), getStats)
```

**Multipart upload (frontend → backend):**
```javascript
const formData = new FormData()
formData.append('images', file)
await api.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

### Error Response Format

All API errors follow a consistent shape:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": []   // optional: array of field-level validation errors
}
```

### Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

---

*This documentation covers the KripaConnect platform as of February 2026. For the latest changes, refer to the git commit history.*
