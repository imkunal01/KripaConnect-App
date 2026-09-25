# API Testing Guide & Specification — KripaConnect

> **Scope:** Full REST API Endpoint Reference, Postman Collection, Payload Definitions, and Automated Assertions  
> **Target Audience:** Backend Developers, QA Engineers, AI Agents  
> **Postman Collection File:** [`KripaConnect_API_Postman_Collection.json`](file:///c:/Users/Kunal/Desktop/Projects/SKE/KripaConnect_API_Postman_Collection.json)  
> **Status:** Production Reference  
> **Last Updated:** September 2026  

---

## 1. Overview & Quickstart

KripaConnect provides a production-grade REST API (Node.js 18+ / Express 5.1) and a Retrieval-Augmented Generation (RAG) microservice (Python / FastAPI). To ensure reliability, performance, and regression prevention, the repository includes a comprehensive Postman Collection (`KripaConnect_API_Postman_Collection.json`) covering every endpoint with automated test assertions and dynamic variable chaining.

### 1.1 Running with Postman GUI
1. Open **Postman**.
2. Click **Import** (top left) and select [`KripaConnect_API_Postman_Collection.json`](file:///c:/Users/Kunal/Desktop/Projects/SKE/KripaConnect_API_Postman_Collection.json).
3. Check the **Collection Variables**:
   - `baseUrl`: Default `http://localhost:5000` (or `https://kripaconnect-app.onrender.com`).
   - `ragUrl`: Default `http://localhost:8000`.
   - `testEmail`: `testcustomer@example.com`
   - `testPassword`: `Password@123`
   - `adminEmail`: `admin@kripaconnect.in`
   - `adminPassword`: `Admin@12345`
4. Run the **Collection Runner** or execute requests individually.

### 1.2 Automated Chaining Architecture
Requests in the collection are linked dynamically through Postman scripts:
- **Login / Register:** Automatically writes the JWT Bearer access token to `{{token}}` and `{{userId}}`.
- **Admin Login:** Automatically writes the administrator token to `{{adminToken}}`.
- **List / Create Products:** Captures the product `_id` into `{{productId}}`.
- **List Categories:** Captures the category `_id` into `{{categoryId}}`.
- **Create Order:** Captures the created `_id` into `{{orderId}}` for checkout, tracking, and invoice tests.

### 1.3 Running via Command Line (Newman CLI)
Run the entire test suite headlessly via Newman:
```bash
# Install newman if not already present
npm install -g newman

# Execute full collection against local backend
newman run KripaConnect_API_Postman_Collection.json --env-var "baseUrl=http://localhost:5000" --env-var "ragUrl=http://localhost:8000"
```

---

## 2. Endpoint Matrix & Test Catalogue

### 2.1 System & Health Endpoints

| Endpoint | Method | Auth | Description | Expected Status |
|---|---|---|---|---|
| `/` | `GET` | None | Root health check with CPU, memory, and uptime | `200 OK` |
| `/healthz` | `GET` | None | Machine-readable health probe for uptime monitors | `200 OK` |
| `/api/cron/ping` | `GET` | None / Secret | External cron liveness ping (accepts `?key=...`) | `200 OK` |
| `/api/sitemap.xml` | `GET` | None | Dynamic XML sitemap with all live product & category URLs | `200 OK` |

#### Sample Smoke Test (Curl)
```bash
curl -i http://localhost:5000/healthz
```

---

### 2.2 Authentication & User Management (`/api/auth`)

| Endpoint | Method | Auth | Description | Payload / Params |
|---|---|---|---|---|
| `/api/auth/register` | `POST` | None | Register new customer or retailer | `{ name, email, password, role }` |
| `/api/auth/login` | `POST` | None | Password login; sets `httpOnly` refresh cookie | `{ email, password }` |
| `/api/auth/profile` | `GET` | `Bearer {{token}}` | Get logged-in user profile, addresses, & cart | None |
| `/api/auth/profile` | `PUT` | `Bearer {{token}}` | Update profile info or add/edit saved address | `{ name, phone, savedAddress }` |
| `/api/auth/retailer-request` | `POST` | `Bearer {{token}}` | Request B2B retailer upgrade | `{ shopName, ownerName, phone, shopAddress, businessProof }` |
| `/api/auth/profile/photo` | `POST` | `Bearer {{token}}` | Upload profile avatar (Cloudinary) | `multipart/form-data: photo` |
| `/api/auth/login-otp/request` | `POST` | None | Request 6-digit OTP for passwordless login | `{ email }` |
| `/api/auth/login-otp/verify` | `POST` | None | Verify 6-digit OTP and receive JWT | `{ email, otp }` |
| `/api/auth/forgot-password` | `POST` | None | Request password reset email | `{ email }` |
| `/api/auth/reset-password` | `POST` | None | Reset password with token from email | `{ token, newPassword }` |
| `/api/auth/refresh` | `POST` | Cookie | Silent access token renewal | None (reads `refreshToken` cookie) |
| `/api/auth/logout` | `POST` | None | Revoke refresh token and clear cookie | None |

#### Sample Register Payload (`POST /api/auth/register`)
```json
{
  "name": "Test Customer",
  "email": "customer@example.com",
  "password": "Password@123",
  "role": "customer"
}
```

#### Sample Update Address Payload (`PUT /api/auth/profile`)
```json
{
  "name": "Updated Customer Name",
  "phone": "9876543210",
  "savedAddress": {
    "name": "John Doe",
    "phone": "9876543210",
    "addressLine": "Flat 402, Lotus Residency",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "pincode": "452001",
    "default": true
  }
}
```

---

### 2.3 Product Catalog (`/api/products`)

| Endpoint | Method | Auth | Description | Query / Body |
|---|---|---|---|---|
| `/api/products` | `GET` | None | List products with pagination, search, & Redis cache | `?page=1&limit=12&minPrice=100&maxPrice=5000&availability=in` |
| `/api/products/:id` | `GET` | None | Get single product details | None |
| `/api/products` | `POST` | `Bearer {{adminToken}}` | Create product with image upload | `multipart/form-data` |
| `/api/products/:id` | `PUT` | `Bearer {{adminToken}}` | Update product details or stock | `multipart/form-data` |
| `/api/products/:id` | `DELETE` | `Bearer {{adminToken}}` | Delete product and invalidate Redis | None |
| `/api/products/:id/image/:publicId` | `DELETE` | `Bearer {{adminToken}}` | Remove specific Cloudinary image | None |

#### Sample Create Product Form-Data (`POST /api/products`)
```
name: Smart Automation Switch Pro
description: Wi-Fi enabled smart modular switch with surge protection.
price: 899
retailer_price: 650
price_bulk: 599
min_bulk_qty: 10
stock: 100
tags: smart,electronics,iot
images: [File Upload]
```

---

### 2.4 Categories & Subcategories

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /api/categories` | `GET` | None | List active categories (Cached in Redis for 24h) |
| `POST /api/categories` | `POST` | `Bearer {{adminToken}}` | Create category |
| `DELETE /api/categories/:id` | `DELETE` | `Bearer {{adminToken}}` | Delete category and clear Redis cache |
| `GET /api/subcategories` | `GET` | None | List active subcategories (accepts `?category_id=...`) |

---

### 2.5 Shopping Cart & Wishlist (`/api/cart`, `/api/favorites`)

| Endpoint | Method | Auth | Description | Payload |
|---|---|---|---|---|
| `/api/cart` | `GET` | `Bearer {{token}}` | Get user's cart (cached in Redis) | `?purchaseMode=customer` (or `retailer`) |
| `/api/cart/add` | `POST` | `Bearer {{token}}` | Add product to cart with MOQ check | `{ productId, qty, purchaseMode }` |
| `/api/cart/item/:productId` | `PUT` | `Bearer {{token}}` | Update quantity or remove if 0 | `{ qty, purchaseMode }` |
| `/api/cart/item/:productId` | `DELETE` | `Bearer {{token}}` | Remove product from cart | None |
| `/api/cart/merge` | `POST` | `Bearer {{token}}` | Merge guest localStorage cart upon login | `{ items: [{ productId, qty }], purchaseMode }` |
| `/api/favorites` | `GET` | `Bearer {{token}}` | Get wishlisted products | None |
| `/api/favorites/add` | `POST` | `Bearer {{token}}` | Add to favorites | `{ productId }` |
| `/api/favorites/remove/:productId` | `DELETE` | `Bearer {{token}}` | Remove from favorites | None |

---

### 2.6 Orders & Tax Invoices (`/api/orders`, `/api/invoices`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /api/orders` | `POST` | `Bearer {{token}}` | Place new order (atomic stock decrement) |
| `GET /api/orders/my` | `GET` | `Bearer {{token}}` | Get customer's order history |
| `GET /api/orders/:id` | `GET` | `Bearer {{token}}` | Get order details |
| `GET /api/orders/:id/invoice` | `GET` | `Bearer {{token}}` | Download GST Tax Invoice PDF |
| `PUT /api/orders/:id/cancel` | `PUT` | `Bearer {{token}}` | Cancel pending order & restock items |
| `GET /api/orders` | `GET` | `Bearer {{adminToken}}` | Admin: List all platform orders |
| `PUT /api/orders/:id/status` | `PUT` | `Bearer {{adminToken}}` | Admin: Update delivery status (`processing`, `shipped`, `delivered`, `cancelled`) |
| `POST /api/invoices/:orderId` | `POST` | `Bearer {{adminToken}}` | Admin: Generate and email invoice |
| `DELETE /api/orders/:id` | `DELETE` | `Bearer {{adminToken}}` | Admin: Delete order |

#### Sample Create Order Payload (`POST /api/orders`)
```json
{
  "items": [
    { "product": "65f0a1b2c3d4e5f6a7b8c9d0", "qty": 1 }
  ],
  "paymentMethod": "COD",
  "purchaseMode": "customer",
  "shippingAddress": {
    "fullName": "Kunal Sharma",
    "addressLine1": "123 Main Street",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "pincode": "452001",
    "phone": "9876543210"
  }
}
```

---

### 2.7 Payments & Razorpay Webhooks (`/api/payments`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /api/payments/create-order` | `POST` | `Bearer {{token}}` | Create Razorpay order ID (`{ orderId }`) |
| `POST /api/payments/verify` | `POST` | `Bearer {{token}}` | Verify HMAC-SHA256 payment signature |
| `POST /api/payments/webhook` | `POST` | None (HMAC Header) | Webhook listener for `payment.captured` & `payment.failed` |

#### Sample Verify Payment Payload (`POST /api/payments/verify`)
```json
{
  "razorpay_order_id": "order_OD12345678",
  "razorpay_payment_id": "pay_PY12345678",
  "razorpay_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

### 2.8 Business Analytics (`/api/analytics`) — Admin Only

*Requires `Authorization: Bearer {{adminToken}}`*

- `GET /api/analytics/overview`: Total revenue, order count, user count, low stock count.
- `GET /api/analytics/revenue`: Daily revenue timeseries array for line/area charts.
- `GET /api/analytics/orders`: Count of orders grouped by delivery status.
- `GET /api/analytics/top-products`: Highest volume products by sales count.
- `GET /api/analytics/user-growth`: User registrations aggregated by date.
- `GET /api/analytics/low-stock`: Products with stock count under 10.

---

### 2.9 Retailer Wholesale B2B Portal (`/api/retailer`)

*Requires `Authorization: Bearer {{token}}` with user role `retailer`*

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/retailer/products` | `GET` | Wholesale catalog with MOQ and wholesale price fields |
| `POST /api/retailer/orders` | `POST` | Place high-volume B2B wholesale order |
| `GET /api/retailer/orders` | `GET` | Retailer order history with invoice status |

---

### 2.10 AI Semantic Recommendations (`/api/recommend`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /api/recommend` | `POST` | None | Natural language semantic search query |
| `GET /api/recommend/similar/:productId` | `GET` | None | Get smart similar products |

#### Sample Semantic Query Payload (`POST /api/recommend`)
```json
{
  "query": "breathable cotton formal shirts under 1500 for office",
  "limit": 6
}
```

---

### 2.11 Admin Catalog & User Controls (`/api/admin`)

*Requires `Authorization: Bearer {{adminToken}}`*

| Action | Endpoint | Method | Payload / Notes |
|---|---|---|---|
| List Users | `/api/admin/users` | `GET` | Filterable user listing |
| Block/Unblock | `/api/admin/users/block/:id` | `PUT` | Toggles user access status |
| Change Role | `/api/admin/users/role/:id` | `PUT` | `{ role: "retailer" }` |
| Bulk Stock/Price | `/api/admin/products/bulk-action` | `POST` | `{ productIds: [...], action: "setStock", payload: { stock: 50 } }` |
| Bulk Export CSV | `/api/admin/products/bulk-export` | `POST` | `{ productIds: [...] }` -> streams CSV file |
| Download Template| `/api/admin/products/csv-template` | `GET` | Downloads standard import CSV format |
| Import CSV | `/api/admin/products/import-csv` | `POST` | `multipart/form-data: file=<csv>` |
| Manage Banners | `/api/admin/banners` | `GET`, `POST`, `PUT`, `DELETE` | Banner schedule and image upload |

---

### 2.12 Direct RAG Microservice Endpoints (Port `8000`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /` | `GET` | None | Root microservice status |
| `GET /health` | `GET` | None | Microservice health check |
| `GET /health/deps` | `GET` | None | Deep health check (Pinecone + Groq/Gemini) |
| `GET /api/ping` | `GET` | None | Router sanity check |
| `POST /api/recommend` | `POST` | None | Direct recommendation execution |
| `GET /api/products` | `GET` | None | Candidate products list |
| `POST /api/admin/sync` | `POST` | `X-Admin-Api-Key` | Incremental vector index synchronization |
| `GET /api/admin/index-status` | `GET` | `X-Admin-Api-Key` | Check Pinecone vector count and sync status |

---

## 3. Best Practices & Testing Guardrails

1. **Token Expiry:** Access tokens expire in 15 minutes. In Postman, running `Login Customer` or `Login Admin` re-populates the environment variables with fresh tokens.
2. **Lean Queries:** All read queries return Plain Old JavaScript Objects (POJOs) via Mongoose `.lean()`.
3. **Cache Invalidation:** Any mutation to products, categories, or banners automatically purges Redis keys. If testing cache behavior, verify `X-Cache: HIT` vs `MISS` via server logs.
4. **Graceful Fallback:** If testing RAG endpoints with the Python service shut down, Express will log a fallback warning and return regex-matched MongoDB recommendations within 3.5 seconds.
