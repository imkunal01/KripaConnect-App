# Backend System Architecture Documentation

## 1. System Overview

### Core Functionalities
The backend system is a robust RESTful API built to support a B2B/B2C E-commerce platform. It provides comprehensive management for:
- **User Authentication & Authorization**: Secure role-based access control (Customer, Retailer, Admin).
- **Product Catalog Management**: CRUD operations for products and categories, including image uploads and bulk pricing.
- **Order Processing**: Full lifecycle management from cart to checkout, payment verification, and delivery status tracking.
- **Payment Integration**: Secure payment processing via Razorpay with webhook support.
- **Admin Dashboard**: Analytics, user management, and order oversight.
- **Media Management**: Cloud-based image storage and optimization.

### Technology Stack
- **Runtime Environment**: Node.js
- **Web Framework**: Express.js (v5.x)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: Helmet, Express-Rate-Limit, Mongo-Sanitize, Bcrypt
- **Validation**: Express-Validator
- **External Services**:
  - **Cloudinary**: Image hosting and transformation.
  - **Razorpay**: Payment gateway.
  - **SendGrid**: Transactional email delivery (OTP, Password Reset, Order Confirmation).

### Infrastructure
- **Server**: REST API server running on Node.js.
- **Deployment**: Configured for serverless deployment (Vercel) or standard Node.js hosting.
- **Environment Management**: `dotenv` for configuration.

---

## 2. Functional Components

### API Endpoints Structure
All API routes are prefixed with `/api`.

| Module | Base Path | Key Endpoints | Description |
|--------|-----------|---------------|-------------|
| **Auth** | `/api/auth` | `POST /register`, `POST /login`, `GET /profile`, `POST /refresh` | User registration, authentication, and profile management. |
| **Products** | `/api/products` | `GET /`, `GET /:id`, `POST /` (Admin), `PUT /:id` (Admin) | Product listing, details, and inventory management. |
| **Orders** | `/api/orders` | `POST /`, `GET /my`, `GET /` (Admin), `PUT /:id/status` | Order creation, history, and status updates. |
| **Payments** | `/api/payments` | `POST /create-order`, `POST /verify`, `POST /webhook` | Razorpay integration for checkout and verification. |
| **Cart** | `/api/cart` | `GET /`, `POST /add`, `PUT /item/:id`, `DELETE /item/:id` | Server-side cart management. |
| **Categories** | `/api/categories` | `GET /`, `POST /` (Admin) | Product categorization. |
| **Admin** | `/api/admin` | `GET /stats` | Dashboard analytics. |
| **Uploads** | N/A | Middleware integration | Handles multipart/form-data for image uploads. |

### Business Logic Workflows

#### 1. Authentication Flow
- **Registration**: Validates input -> Hashes password (bcrypt) -> Creates User -> Returns JWT.
- **Login**: Validates credentials -> Generates Access Token & Refresh Token -> Returns to client.
- **Protection**: Middleware checks `Authorization: Bearer <token>` header -> Verifies JWT -> Attaches `user` to request object.

#### 2. Checkout & Payment Flow
1. **Cart Validation**: Checks stock availability.
2. **Order Creation**: Creates `Order` record with status `pending`.
3. **Payment Initiation**: Calls Razorpay API to generate `order_id`.
4. **Processing**: Client completes payment on Razorpay.
5. **Verification**:
   - **Manual**: Client sends `payment_id` and signature to `/api/payments/verify`.
   - **Webhook**: Razorpay hits `/api/payments/webhook` for async updates.
6. **Completion**: Order status updates to `paid`, Transaction recorded.

### Third-Party Integrations
- **Razorpay**: Handles payment processing.
  - *Service File*: `src/services/razorpayService.js`
  - *Key Methods*: `createRazorpayOrder`
- **Cloudinary**: Stores product images.
  - *Service File*: `src/services/cloudinaryService.js`
  - *Key Methods*: `uploadBuffer` (Stream upload), `deleteById`.
- **SendGrid**: Sends transactional emails (Order Confirmation, OTP, Password Reset).
  - *Service File*: `src/services/emailService.js`

---

## 3. Data Management

### Database Schema (Mongoose Models)

#### **User** (`User.js`)
- **Fields**: `name`, `email` (unique), `password` (hashed), `role` (customer/retailer/admin), `cart`, `favorites`, `savedAddresses`.
- **Relationships**: Refers to `Product` in `cart` and `favorites`.

#### **Product** (`Product.js`)
- **Fields**: `name`, `slug`, `price`, `retailer_price`, `stock`, `images` (Array), `active`.
- **Relationships**: Refers to `Category`.
- **Indexing**: Text index on `name`, `description`, `tags` for search.

#### **Order** (`Order.js`)
- **Fields**: `totalAmount`, `paymentStatus`, `deliveryStatus`, `shippingAddress`, `razorpay` (details).
- **Relationships**: Refers to `User` and `Product` (embedded in `items`).

#### **Transaction** (`Transaction.js`)
- **Fields**: `razorpay_payment_id`, `amount`, `status`, `payload`.
- **Relationships**: Refers to `Order`.

### Data Flow
1. **Write Operations**: Validated by `express-validator` -> Sanitized -> Mongoose Schema Validation -> Database.
2. **Read Operations**: Queries via Mongoose -> Lean queries (optional optimization) -> JSON Response.

---

## 4. Performance Characteristics

### Capabilities
- **Rate Limiting**: `express-rate-limit` restricts IPs to 200 requests per 15 minutes to prevent abuse.
- **Search Optimization**: MongoDB Text Indexes used for product search.
- **Image Optimization**: Images offloaded to Cloudinary CDN, reducing server bandwidth usage.

### Bottlenecks & Limitations
- **Synchronous Uploads**: While `streamifier` is used, large batch uploads might impact request latency.
- **Database Connection**: Single connection instance; may require connection pooling configuration for high concurrency.
- **Text Search**: MongoDB simple text search is used; may need ElasticSearch/Atlas Search for advanced fuzzy matching at scale.

---

## 5. Security Implementation

### Data Protection
- **Encryption**: Passwords hashed using `bcrypt` with salt rounds.
- **Sanitization**: `mongo-sanitize` middleware prevents NoSQL injection attacks by stripping `$` characters.
- **Headers**: `helmet` middleware sets secure HTTP headers (HSTS, X-Frame-Options, etc.).
- **CORS**: Configured to allow specific origins (Localhost, Vercel app).

### Input Validation
- **Middleware**: `express-validator` checks request body fields (e.g., email format, password length, required fields).
- **Schema Validation**: Mongoose schemas enforce data types and required fields at the database level.

### Audit & Logging
- **Logging**: `morgan` (in 'dev' mode) logs HTTP requests.
- **Transaction Logs**: `Transaction` model stores raw payment gateway responses for audit trails.

---

## 6. Error Handling

### Exception Management Framework
- **Global Error Handler**: `middleware/errorHandler.js` catches all errors.
  - Returns standardized JSON format: `{ success: false, message: "...", stack: ... }`.
  - Hides stack traces in production.
- **Async Handling**: Custom wrapper or `try/catch` blocks used in controllers to forward errors to the global handler.

### Common Scenarios
- **400 Bad Request**: Validation failures (returns array of errors).
- **401 Unauthorized**: Missing or invalid JWT token.
- **403 Forbidden**: User lacks required role (e.g., Admin accessing Customer route).
- **404 Not Found**: Resource (Product/Order) does not exist.
- **500 Internal Server Error**: Unhandled exceptions (Database connection fail, etc.).

---

## 7. Directory Structure Reference
```
backend/
├── src/
│   ├── config/         # Database and env config
│   ├── controllers/    # Request handlers (Business logic)
│   ├── middleware/     # Auth, Error, Security, Validation
│   ├── models/         # Mongoose Schemas
│   ├── routes/         # API Route definitions
│   ├── services/       # External integrations (Email, Payment, Upload)
│   ├── utils/          # Helper functions
│   ├── validations/    # Input validation rules
│   └── server.js       # App entry point
└── index.js            # Server startup script
```
