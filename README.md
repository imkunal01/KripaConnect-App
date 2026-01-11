#  — Full Stack Project

Monorepo containing:

- **Backend**: Node.js + Express + MongoDB (REST API)
- **Frontend**: React + Vite + optional Capacitor Android build

This README documents the **features and functionality** implemented in both the backend and frontend, based on the code currently in this repo.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Key Features](#key-features)
  - [Backend Features](#backend-features)
  - [Frontend Features](#frontend-features)
- [Tech Stack](#tech-stack)
- [Run Locally](#run-locally)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
  - [Backend `.env`](#backend-env)
  - [Frontend `.env`](#frontend-env)
- [Backend API Overview](#backend-api-overview)
- [Security Notes](#security-notes)
- [Useful Scripts](#useful-scripts)

---

## Project Structure

```txt
SKE/
  backend/
    index.js
    package.json
    src/
      server.js
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      validations/
      validators/
  frontend/
    package.json
    vite.config.js
    public/
    src/
      pages/
      components/
      context/
      hooks/
      services/
```

---

## Key Features

### Backend Features

The backend is a REST API built with Express and MongoDB.

**Authentication & Accounts**
- Email/password authentication using JWT access tokens.
- Refresh-token flow using an `httpOnly` cookie (`refreshToken`).
- Google OAuth sign-in endpoint (supports either `credential` ID token or `accessToken`).
- Password reset via email link (SendGrid).
- Passwordless login via **Email OTP** (request + verify endpoints).
- Profile management:
  - Fetch profile (`/api/auth/profile`)
  - Update profile details (name/phone)
  - Upload profile photo to Cloudinary
  - Save/update default shipping address (`savedAddresses`)

**Catalog / Commerce**
- Product management:
  - Public product list + product details
  - Admin create/update/delete
  - Multi-image upload (up to 6 images) using Multer + Cloudinary
  - Remove a single product image by Cloudinary `public_id`
- Category management (CRUD endpoints exist under `/api/categories`).
- Favorites (wishlist) endpoints under `/api/favorites`.
- Cart endpoints under `/api/cart`.
- Reviews endpoints under `/api/reviews`.

**Orders**
- Create order, list “my orders”, and order detail.
- Cancel order (user) and update delivery status (admin).
- Admin delete order.

**Payments (Razorpay)**
- Create Razorpay order for an existing app order (`/api/payments/create-order`).
- Verify payment signature (`/api/payments/verify`).
- Razorpay webhook handler (`/api/payments/webhook`) to mark payments captured/failed.
- Transaction tracking in MongoDB (stores Razorpay order/payment ids and payload for auditing).

**Invoices**
- Admin-only invoice generation for an order (`/api/invoices/:orderId`).
- Uses PDF generation utilities (PDFKit) via backend services.

**Analytics (Admin-only)**
- Overview, revenue stats, order stats, top products, user growth, and low-stock endpoints under `/api/analytics`.

**Admin Panel Support**
- User management:
  - List users
  - Block/unblock user
  - Update user role
  - Delete user
  - Stats endpoint
- Order management:
  - All orders list, order detail, retailer orders view
  - Update order status
  - Delete order

**Operational / Platform**
- CORS allowlist + support for Vercel preview deployments (`*.vercel.app`).
- Health check homepage (`GET /`) with server stats.

---

### Frontend Features

The frontend is a React + Vite app with routing and auth-protected pages.

**Core App Pages / UX**
- Public:
  - Home/Dashboard
  - Products list + Product details
  - Categories
  - Favorites
  - Cart
  - Info pages (About/Services/FAQ/Contact/Privacy/Terms/Returns)
- Auth:
  - Sign up
  - Login (password)
  - Login via **Email OTP**
  - Google Sign-in
  - Forgot password + Reset password
- Customer experience:
  - Checkout (multi-step)
  - Order success page
  - Profile page
  - Orders list + Order details

**Checkout & Payments**
- Supports **Cash on Delivery** and **Online Payment via Razorpay**.
- For Razorpay payments:
  - Creates Razorpay order via backend
  - Opens Razorpay checkout
  - Calls backend verify endpoint after successful payment

**Role-based Sections**
- Protected routes:
  - Checkout, Profile, Onboarding, Orders
- Role-specific routes:
  - Admin panel (`/admin`) for `admin` role
  - B2B page (`/b2b`) for `retailer` role

**Onboarding / Address Flow**
- On login, users are redirected to onboarding if they have no saved address.
- Checkout auto-prefills address from `savedAddresses` (default/first).



---

## Tech Stack

**Backend**
- Node.js, Express
- MongoDB + Mongoose
- JWT auth (`jsonwebtoken`)
- SendGrid email (`@sendgrid/mail`)
- Razorpay payments (`razorpay`)
- Cloudinary image storage (`cloudinary`, `streamifier`)
- PDF generation (`pdfkit`)
- Security middleware: `helmet`, rate limiting, mongo sanitization

**Frontend**
- React (Vite)
- React Router
- Google OAuth (`@react-oauth/google`)
- Charts (`recharts`)
- Capacitor (Android support)

---

## Run Locally

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (see [Backend .env](#backend-env)).

Run:

```bash
npm start
```

Backend default: `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend default: Vite will print the local URL (commonly `http://localhost:5173`).

---

## Environment Variables

### Backend `.env`

Create a file at `backend/.env`.

Required (core):
- `MONGO_URI` — MongoDB connection string.
- `JWT_SECRET` — JWT signing secret for access tokens.
- `JWT_REFRESH_SECRET` — JWT signing secret for refresh tokens.

Required (email / OTP / password reset):
- `SENDGRID_API_KEY` — SendGrid API key.
- `EMAIL_FROM_EMAIL` — verified SendGrid sender email.
- `EMAIL_FROM_NAME` — optional sender name (defaults to “Smart E-Commerce”).
- `FRONTEND_URL` — used to generate password reset links.

Required (payments):
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` — used to validate webhook signatures.

Required (image uploads):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Required (Google auth on backend validation):
- `GOOGLE_CLIENT_ID`

Optional:
- `PORT` — defaults to `5000`.
- `NODE_ENV` — `development` / `production`.
- `ALLOWED_ORIGINS` — comma-separated list appended to the server allowlist.

Example:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.example.mongodb.net/ske

JWT_SECRET=super-secret-access
JWT_REFRESH_SECRET=super-secret-refresh

FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

SENDGRID_API_KEY=SG.xxxxxx
EMAIL_FROM_EMAIL=verified-sender@yourdomain.com
EMAIL_FROM_NAME=KripaConnect

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Frontend `.env`

Create `frontend/.env`:

- `VITE_API_BASE_URL` — backend base URL (default fallback is `http://localhost:5000`, which breaks in production if you don’t set it).
- `VITE_GOOGLE_CLIENT_ID` — Google client id used by `GoogleOAuthProvider`.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

---

## Backend API Overview

Base URL: `http://localhost:5000`

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `POST /logout`
- `POST /refresh`
- `POST /google`
- `GET /profile` (protected)
- `PUT /profile` (protected)
- `POST /profile/photo` (protected, multipart)
- `POST /forgot-password`
- `POST /reset-password`
- `POST /login-otp/request`
- `POST /login-otp/verify`

### Products (`/api/products`)
- `GET /` (public)
- `GET /:id` (public)
- `POST /` (admin, multipart images)
- `PUT /:id` (admin, multipart images)
- `DELETE /:id` (admin)
- `DELETE /:productId/image/:publicId` (admin)

### Orders (`/api/orders`)
- `POST /` (protected)
- `GET /my` (protected)
- `GET /` (admin)
- `GET /:id` (protected)
- `PUT /:id/cancel` (protected)
- `PUT /:id/status` (admin)
- `DELETE /:id` (admin)

### Payments (`/api/payments`)
- `POST /create-order` (protected)
- `POST /verify` (protected)
- `POST /webhook` (public endpoint for Razorpay)

### Admin (`/api/admin`)
- `GET /users` (admin)
- `PUT /users/block/:id` (admin)
- `PUT /users/role/:id` (admin)
- `DELETE /users/:id` (admin)
- `GET /stats` (admin)
- `GET /orders` (admin)
- `GET /orders/:id` (admin)
- `GET /retailer-orders` (admin)
- `PUT /orders/status/:id` (admin)
- `DELETE /orders/:id` (admin)

### Analytics (`/api/analytics`) (admin)
- `GET /overview`
- `GET /revenue`
- `GET /orders`
- `GET /top-products`
- `GET /user-growth`
- `GET /low-stock`

### Cart (`/api/cart`) (protected)
- `GET /`
- `POST /add`
- `PUT /item/:productId`
- `DELETE /item/:productId`

### Invoices (`/api/invoices`) (admin)
- `POST /:orderId`

> Categories, favorites, retailer, and reviews routes also exist under `/api/categories`, `/api/favorites`, `/api/retailer`, `/api/reviews`.

---

## Security Notes

- Global rate limiting is enabled, plus stricter limits on sensitive auth endpoints (OTP and forgot-password).
- Request body/query/params are sanitized to reduce NoSQL injection risk.
- JWT access tokens are used for API authorization.
- Refresh tokens are stored in an `httpOnly` cookie.
- CORS is allowlisted and includes support for Vercel preview deployments.

---

## Useful Scripts

### Backend

From `backend/`:

- `npm start` — start API server.
- `npm run seed` — seed sample product data.
- `npm run test:razorpay` — test Razorpay configuration.
- `npm run test:email` — test SendGrid email sending.
- `npm run check:payment` — check payment status script.

### Frontend

From `frontend/`:

- `npm run dev` — start Vite dev server.
- `npm run build` — build production bundle.
- `npm run preview` — preview built bundle.

---

## Notes / Deployment

- If deploying frontend on Vercel/Netlify, **set** `VITE_API_BASE_URL` to your backend URL.
- For Razorpay webhooks, the backend webhook URL must be publicly reachable and configured in Razorpay dashboard.

