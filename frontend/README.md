# KripaConnect — Frontend

> **React 19 · Vite 7 · Vanilla CSS · Capacitor 8**  
> PWA-ready storefront + B2B portal + Admin panel — deployed on Vercel, packaged for Android via TWA.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Routing](#routing)
- [State Management](#state-management)
- [Pages Overview](#pages-overview)
- [Components](#components)
- [Custom Hooks](#custom-hooks)
- [Service Layer](#service-layer)
- [Role-Based Access](#role-based-access)
- [Purchase Mode System](#purchase-mode-system)
- [Authentication](#authentication)
- [Payment Integration (Razorpay)](#payment-integration-razorpay)
- [Mobile / PWA / Capacitor](#mobile--pwa--capacitor)
- [Deployment (Vercel)](#deployment-vercel)

---

## Quick Start

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Copy and configure env
cp .env.example .env   # (or create .env manually — see below)

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
frontend/
├── public/                   # Static assets & PWA icons
├── scripts/
│   └── generatePwaIcons.mjs  # Auto-generates PWA icons (runs pre-build)
├── src/
│   ├── App.jsx               # Root router — all lazy-loaded routes
│   ├── main.jsx              # Entry point — wraps app in all context providers
│   ├── index.css             # Global CSS design tokens & resets
│   │
│   ├── pages/                # One file per route
│   │   ├── Dashboard.jsx       # Home / storefront landing
│   │   ├── Products.jsx        # Catalogue with filters & sort
│   │   ├── ProductDetails.jsx  # Single product view + reviews
│   │   ├── Categories.jsx
│   │   ├── Favorites.jsx       # Wishlist
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx    # 3-step checkout wizard
│   │   ├── SuccessScreen.jsx   # Post-order confirmation
│   │   ├── OrdersPage.jsx
│   │   ├── OrderDetailsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── OnboardingPage.jsx  # First-time address setup
│   │   ├── B2B.jsx             # Retailer analytics dashboard
│   │   ├── Admin.jsx           # Admin shell with sidebar
│   │   ├── admin/              # Lazy-loaded admin sub-panels
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ProductManagement.jsx
│   │   │   ├── BannerManagement.jsx
│   │   │   ├── CategoryManagement.jsx
│   │   │   ├── SubcategoryManagement.jsx
│   │   │   ├── OrderManagement.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── ReviewModeration.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── About.jsx / Services.jsx / FAQ.jsx / Contact.jsx
│   │   ├── Privacy.jsx / Terms.jsx / Refund.jsx
│   │   └── NotFound.jsx
│   │
│   ├── components/           # Shared reusable UI
│   │   ├── Navbar.jsx          # Mobile top bar + dock + desktop header
│   │   ├── Footer.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── ProductHeroCarousel.jsx
│   │   ├── FiltersSidebar.jsx
│   │   ├── SortBar.jsx
│   │   ├── SearchBar.jsx
│   │   ├── QuantitySelector.jsx
│   │   ├── FavoritesButton.jsx
│   │   ├── AddressForm.jsx
│   │   ├── OrderSummary.jsx
│   │   ├── OrderTimeline.jsx
│   │   ├── PaymentSelector.jsx
│   │   ├── ReviewForm.jsx
│   │   ├── ReviewList.jsx
│   │   ├── SkeletonLoader.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── OtpLogin.jsx
│   │   ├── PasswordStrengthMeter.jsx
│   │   ├── NetworkStatus.jsx
│   │   └── AppToaster.jsx
│   │
│   ├── context/              # Global React state
│   │   ├── AuthContext.jsx     # JWT sessions, user, role
│   │   ├── ShopContext.jsx     # Cart + favorites (optimistic UI)
│   │   └── PurchaseModeContext.jsx  # Customer ↔ Retailer mode
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePurchaseMode.js
│   │   ├── useNativePress.js   # Capacitor-aware press handler
│   │   ├── usePreventRageTap.js
│   │   └── usePrefetch.js
│   │
│   └── services/             # API call modules
│       ├── api.js              # Base fetch wrapper
│       ├── auth.js
│       ├── products.js
│       ├── categories.js
│       ├── subcategories.js
│       ├── cart.js
│       ├── favorites.js
│       ├── orders.js
│       ├── payments.js
│       ├── reviews.js
│       ├── banners.js
│       └── admin.js
│
├── capacitor.config.json     # Android / TWA config
├── vercel.json               # SPA rewrites + cache headers
└── vite.config.js
```

---

## Environment Variables

Create a `.env` file in this (`frontend/`) directory:

```env
# Backend base URL — change to production URL before deploying
VITE_API_BASE_URL=http://localhost:5000

# Google OAuth Client ID (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Google OAuth backend redirect (used by OtpLogin + GoogleSignIn flow)
VITE_GOOGLE_OAUTH_URL=http://localhost:5000/api/auth/google/oauth
```

> ⚠️ **Never commit `.env` to version control.** All `VITE_` variables are embedded into the client bundle at build time.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend REST API base URL |
| `VITE_GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `VITE_GOOGLE_OAUTH_URL` | ✅ | Backend Google OAuth redirect URL |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build (runs `prebuild` first) |
| `npm run prebuild` | Auto-generates PWA icons from source |
| `npm run preview` | Serve the production `dist/` locally |
| `npm run lint` | Run ESLint |

---

## Routing

All routes are **lazy-loaded** via `React.lazy()` + `<Suspense>`. A branded spinner is shown during chunk loading.

| Path | Page | Access |
|---|---|---|
| `/` | Dashboard (Home) | Public |
| `/products` | Products catalogue | Public |
| `/product/:id` | Product details | Public |
| `/categories` | Category browser | Public |
| `/favorites` | Wishlist | Public |
| `/cart` | Shopping cart | Public |
| `/login` | Login | Public |
| `/signup` | Sign up | Public |
| `/forgot-password` | Forgot password | Public |
| `/reset-password` | Reset password | Public |
| `/about` · `/services` · `/faq` · `/contact` | Info pages | Public |
| `/privacy` · `/terms` · `/returns` | Legal pages | Public |
| `/checkout` | 3-step checkout wizard | 🔒 Auth |
| `/success/:orderId` | Order confirmation | 🔒 Auth |
| `/profile` | User profile | 🔒 Auth |
| `/onboarding` · `/address-setup` | First-time setup | 🔒 Auth |
| `/orders` | Order history | 🔒 Auth |
| `/orders/:id` | Order detail | 🔒 Auth |
| `/b2b` | Retailer dashboard | 🔒 Retailer |
| `/admin` | Admin panel | 🔒 Admin |
| `*` | 404 Not Found | Public |

### ProtectedRoute

```jsx
// Any authenticated user
<ProtectedRoute><CheckoutPage /></ProtectedRoute>

// Role-scoped guard
<ProtectedRoute allow={['retailer']}><B2B /></ProtectedRoute>
<ProtectedRoute allow={['admin']}><Admin /></ProtectedRoute>
```

While `AuthContext.loading` is `true` (token verification in progress), a spinner is shown to prevent flash-of-redirect.

---

## State Management

The app uses three nested React Context providers (no external state library):

```
<AuthProvider>              JWT auth, user, role
  <PurchaseModeProvider>    Customer vs. Retailer shopping mode
    <ShopProvider>          Cart + Favorites (synced to backend)
```

### AuthContext

| Exported | Type | Description |
|---|---|---|
| `token` | `string \| null` | JWT access token |
| `user` | `object \| null` | Full user object (name, email, role, savedAddresses…) |
| `role` | `'customer' \| 'retailer' \| 'admin' \| null` | User role |
| `loading` | `boolean` | `true` while initial token check runs |
| `signIn(email, password)` | async fn | Email/password login |
| `signUp(name, email, password, role)` | async fn | Register |
| `signInWithOtp(email, otp)` | async fn | OTP login |
| `googleSignIn(credential, accessToken, role)` | async fn | Google login |
| `signOut()` | async fn | Logout + clear storage |
| `refreshMe()` | async fn | Re-fetch profile from server |

Token refresh is scheduled automatically ~60 s before JWT `exp`. On 401/403 the app auto-logs out. On network errors it preserves the local session.

### ShopContext

Optimistic UI — all cart/favorites changes are reflected in the UI instantly, then synced to the backend, with rollback on failure.

| Exported | Description |
|---|---|
| `cart` | `CartItem[]` — `{ productId, name, price, qty, stock, image, retailerPrice, bulkPrice, … }` |
| `favorites` | `string[]` — array of product IDs |
| `addToCart(product, qty)` | Instant add → sync → rollback on error |
| `removeFromCart(productId)` | Instant remove → sync → rollback |
| `updateQty(productId, qty)` | Instant update → sync → rollback |
| `toggleFavorite(productId)` | Instant toggle → sync → rollback |
| `clearCart()` | Re-fetch from server (called post-order) |
| `wipeCart()` | Full local + server clear (called on mode switch) |
| `refreshCart()` | Force-sync from server |

### PurchaseModeContext

| Exported | Description |
|---|---|
| `mode` | `'customer' \| 'retailer'` |
| `setMode(mode)` | Only usable when `role === 'retailer'` |
| `canSwitchMode` | `true` only for retailers |

Mode is persisted to `localStorage`. Switching mode **clears the cart** and exposes the mode on `document.documentElement.dataset.purchaseMode` for CSS hooks.

---

## Pages Overview

### Dashboard `/`
Hero banner · Category pills · Latest products grid · Best sellers horizontal scroll · Discount section · Sale banner · Benefits strip.  
Data loaded in parallel with `Promise.all`. Admins are auto-redirected to `/admin`.

### Products `/products`
Full-text search · Category + subcategory filter · Price range · Sort (newest / price / sold) · Skeleton loaders · Infinite scroll · All state synced to URL query params for shareability.

### Product Details `/product/:id`
Image carousel · Quantity selector (bulk min-qty enforced for retailers) · Dynamic pricing (regular vs. bulk) · Add to Cart / Favorites · Review list + review form.

### Cart `/cart`
Line items with optimistic qty updates · Savings display for retailer pricing · Order summary sidebar.

### Checkout `/checkout`
3-step wizard: **Address → Payment → Review**.  
Auto-prefills saved addresses. Detects new users (no saved address) and redirects to `/address-setup` first. Supports COD and Razorpay. Bulk order confirmation modal for orders ≥ 50 units.

### B2B Retailer Dashboard `/b2b`
KPI overview cards · Monthly spend SVG bar chart · Category spend breakdown · Bulk vs. customer spend · Top 5 products by units · Savings insights · Orders & Invoice center (search, date range, type/status filters) · Payment overview (COD vs. online, paid/unpaid/failed) · Frequent products reorder table · Bulk product catalogue with min-qty enforcement.

### Admin Panel `/admin`
Sidebar with 8 tabs, all lazy-loaded independently:

| Tab | Features |
|---|---|
| Dashboard | KPI cards, revenue chart, order stats, low-stock alerts |
| Products | CRUD, multi-image upload, pricing tiers, stock management |
| Banners | Upload/manage promotional banners |
| Categories | Add/edit/delete categories |
| Subcategories | Add/edit/delete subcategories linked to categories |
| Orders | View all, update delivery status |
| Users | List, block/unblock, change roles, approve retailer requests |
| Reviews | View and moderate all product reviews |

### Profile `/profile`
Avatar (with photo upload) · Role badge · Inline edit mode · Name/phone form · Delivery address (`AddressForm`) · Retailer upgrade request panel · Logout.

---

## Components

| Component | Purpose |
|---|---|
| `Navbar` | Mobile top bar + floating bottom dock + full desktop header |
| `Footer` | Site footer with page links |
| `ProductCard` | Grid card with image, price, cart + wishlist actions |
| `ProductGrid` | Responsive grid wrapper |
| `ProductHeroCarousel` | Multi-image carousel with thumbnail strip |
| `FiltersSidebar` | Category/subcategory/price filter panel |
| `SortBar` | Product sort dropdown |
| `SearchBar` | Controlled search input |
| `QuantitySelector` | +/− stepper with min/max bounds |
| `FavoritesButton` | Heart toggle (optimistic) |
| `AddressForm` | Delivery address fields (name, phone, addressLine, city, state, pincode) |
| `OrderSummary` | Cart totals sidebar |
| `OrderTimeline` | Visual step tracker (Placed → Shipped → Delivered) |
| `PaymentSelector` | COD vs Razorpay radio selector |
| `ReviewForm` | Star rating + comment submit |
| `ReviewList` | All reviews for a product |
| `SkeletonLoader` | Animated loading placeholder |
| `ProtectedRoute` | HOC for auth + role-gated routes |
| `OtpLogin` | OTP request + verify flow |
| `PasswordStrengthMeter` | Real-time password strength bar |
| `NetworkStatus` | Offline/online status banner |
| `AppToaster` | Branded `react-hot-toast` configuration |

---

## Custom Hooks

| Hook | Usage |
|---|---|
| `useAuth()` | Read from `AuthContext` (token, user, role, actions) |
| `usePurchaseMode()` | Read from `PurchaseModeContext` (mode, setMode, canSwitchMode) |
| `useNativePress(handler, options)` | Capacitor-aware tap/long-press with haptic feedback |
| `usePreventRageTap(handler, delay)` | Debounces rapid mobile taps to prevent duplicate API calls |
| `usePrefetch(fetcher, deps)` | Prefetches data before navigation |

---

## Service Layer

All API calls go through `src/services/api.js` which:
- Prefixes all paths with `VITE_API_BASE_URL`
- Attaches the `Authorization: Bearer <token>` header
- Dispatches a global `auth:unauthorized` `CustomEvent` on 401 (caught by `AuthContext` for auto-logout)

| Module | Wraps |
|---|---|
| `auth.js` | login, signup, logout, refresh, profile, update profile, photo upload, Google login, OTP request/verify, retailer request |
| `products.js` | listProducts (filters/sort/pagination), getProduct |
| `categories.js` | listCategories |
| `subcategories.js` | listSubcategories |
| `cart.js` | getCart, addToCart, updateCartItem, removeCartItem |
| `favorites.js` | listFavorites, addFavorite, removeFavorite |
| `orders.js` | createOrder, getMyOrders, getOrderById |
| `payments.js` | createRazorpayOrder, verifyPayment |
| `reviews.js` | getReviews, submitReview |
| `banners.js` | listBanners |
| `admin.js` | All admin CRUD operations |

---

## Role-Based Access

| Role | Capabilities |
|---|---|
| **Guest** | Browse, search, view products · Local cart + favorites |
| **Customer** | All guest features + persistent cart/favorites · Checkout · Orders · Profile · Retailer upgrade request |
| **Retailer** | All customer features + Retailer Mode (bulk pricing, min qty) · B2B Dashboard · Analytics · Reorder · Invoice center |
| **Admin** | Admin Panel only (redirected from `/`) · Full back-office management |

---

## Purchase Mode System

Retailers can switch between **Customer Mode** (standard pricing) and **Retailer Mode** (bulk pricing, min order qty).

```
Navbar → mode dropdown → confirmation modal → wipeCart() → setMode()
```

- Switching mode **always clears the cart** to prevent mixing pricing tiers.
- Mode is persisted to `localStorage` (`kc_purchase_mode`).
- The active mode is reflected as `data-purchase-mode` on `<html>` for CSS-level style hooks.
- The `/b2b` route is only accessible in Retailer Mode.

---

## Authentication

| Flow | How |
|---|---|
| Email + Password | `signIn()` → JWT access token + httpOnly refresh cookie |
| Email OTP | `requestOtp(email)` → `signInWithOtp(email, otp)` |
| Google OAuth | `@react-oauth/google` `GoogleOAuthProvider` → `googleSignIn(credential)` |
| Token Refresh | Auto-scheduled ~60 s before JWT `exp` via `setTimeout` |
| Session Restore | On page load, stored token is validated via `refreshAccess()`; 401/403 triggers logout, network errors preserve session |
| Logout | `signOut()` → clears token, user, role, localStorage + calls backend logout |

Tokens are stored in `localStorage` under the key `auth` as `{ token, user, role }`.

---

## Payment Integration (Razorpay)

The Razorpay checkout JS SDK is loaded **lazily** (only when the user selects Online Payment in step 2 of checkout) to avoid any blocking.

**Flow:**
1. `createOrder()` → backend creates app order in MongoDB
2. `createRazorpayOrder(orderId)` → backend creates Razorpay order, returns `{ keyId, razorpayOrder }`
3. Razorpay modal opens with order details
4. On payment success → `verifyPayment(razorpayResponse)` → backend verifies signature
5. `clearCart()` + redirect to `/success/:orderId`

**COD flow** skips steps 2–4 entirely.

> 💡 If Razorpay fails to load, prompt the user to disable ad blockers. A warning banner is shown automatically when Razorpay is selected.

---

## Mobile / PWA / Capacitor

The frontend is wrapped as an Android app via Capacitor + TWA (Trusted Web Activity).

**Capacitor config** (`capacitor.config.json`):
```json
{
  "appId": "com.kc.app",
  "appName": "KripaConnect",
  "webDir": "dist",
  "server": {
    "url": "https://kripa-connect-app.vercel.app",
    "cleartext": false
  }
}
```

- Mobile UI uses a **floating bottom dock** nav (Home, Products, Search, Favorites, Profile, B2B).
- A **fullscreen search overlay** is triggered from the dock.
- `useNativePress` provides native-feel tap/long-press interactions via the Capacitor bridge.
- `usePreventRageTap` debounces rapid taps — critical for mobile UX.
- `NetworkStatus` component shows an offline/online banner.
- PWA icons are auto-generated by `scripts/generatePwaIcons.mjs` before every build.

For the Android TWA build, see `twa-kripa-connect/` in the monorepo root.

---

## Deployment (Vercel)

The `vercel.json` handles:
- **SPA routing** — all paths rewrite to `index.html`
- **Asset caching** — `Cache-Control: immutable` for hashed static assets
- **COOP header** — `Cross-Origin-Opener-Policy: same-origin-allow-popups` required for Google OAuth popup flow

```bash
# Production build
npm run build
# → generates dist/ (deploy this folder)
```

Set these environment variables in your Vercel project settings:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_URL=https://your-backend.onrender.com/api/auth/google/oauth
```

> The backend automatically whitelists `*.vercel.app` preview deployment URLs in its CORS config.
