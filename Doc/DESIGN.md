# Design System, UI/UX & Data Models — KripaConnect

> **Scope:** Design Tokens, UI Components, Responsive Layouts, Data Models, and Interface Contracts  
> **Status:** Production Specification  
> **Last Updated:** September 2026  

---

## 1. Design System & Visual Identity

KripaConnect adopts a modern, premium e-commerce aesthetic featuring vibrant jewel tones, glassmorphism surfaces, sleek dark mode accents, and smooth micro-interactions.

### 1.1 Color Tokens & Palette

The design system relies on semantic CSS custom properties defined in [`frontend/src/index.css`](file:///c:/Users/Kunal/Desktop/Projects/SKE/frontend/src/index.css) and component stylesheets:

| Token Name | Value | Description & Usage |
|---|---|---|
| `--color-primary` | `#2563eb` (Blue 600) | Primary brand color: buttons, active tabs, highlights |
| `--color-primary-hover` | `#1d4ed8` (Blue 700) | Button hover states and interactive accents |
| `--color-primary-light` | `#eff6ff` (Blue 50) | Background for badges, active list items, alerts |
| `--color-secondary` | `#059669` (Emerald 600) | Success states, B2B wholesale badges, savings tags |
| `--color-accent` | `#f59e0b` (Amber 500) | Star ratings, promotional banners, warning alerts |
| `--color-danger` | `#dc2626` (Red 600) | Destructive actions, stock out warnings, error badges |
| `--color-surface` | `#ffffff` | Primary card and container background |
| `--color-surface-subtle` | `#f8fafc` (Slate 50) | App body background, table alternating rows |
| `--color-border` | `#e2e8f0` (Slate 200) | Card borders, input field outlines, dividers |
| `--color-text-primary` | `#0f172a` (Slate 900) | Headings, high-emphasis text |
| `--color-text-secondary` | `#475569` (Slate 600) | Body copy, secondary descriptions, breadcrumbs |
| `--color-text-muted` | `#94a3b8` (Slate 400) | Placeholder text, disabled labels |

#### Glassmorphism & Elevation Tokens
```css
--glass-bg: rgba(255, 255, 255, 0.85);
--glass-backdrop: blur(12px);
--glass-border: 1px solid rgba(255, 255, 255, 0.4);

--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-full: 9999px;
```

### 1.2 Typography System
The platform utilizes **Inter** and **Outfit** imported from Google Fonts:
- **Display / Headings (`font-heading`):** `'Outfit', sans-serif` — semi-bold (600) and bold (700) for hero banners, page titles, and modal headers.
- **Body / Interface (`font-body`):** `'Inter', sans-serif` — regular (400) and medium (500) for form controls, body text, and product details.

| Scale | Size | Line Height | Tracking | Recommended Use |
|---|---|---|---|---|
| `text-xs` | 12px / 0.75rem | 16px | +0.02em | Badges, timestamps, small tags |
| `text-sm` | 14px / 0.875rem | 20px | Normal | Secondary text, form helper text |
| `text-base` | 16px / 1.0rem | 24px | Normal | Body text, input field contents |
| `text-lg` | 18px / 1.125rem | 28px | Normal | Subheadings, card titles |
| `text-xl` | 20px / 1.25rem | 28px | -0.01em | Modal titles, section headers |
| `text-2xl` | 24px / 1.5rem | 32px | -0.02em | Page headers, dashboard KPI numbers |
| `text-3xl` | 30px / 1.875rem | 36px | -0.02em | Hero banner headlines |

---

## 2. UI Component Catalogue & Layouts

### 2.1 Navigation & Global Layout
1. **`Navbar.jsx`:**
   - Sticky glassmorphic header with brand logo, purchase mode toggle (Retail vs B2B), search bar trigger, cart counter badge, wishlist counter, and user profile avatar.
2. **`MobileBottomBar.jsx`:**
   - Fixed bottom navigation bar for mobile viewports (<768px): Home, Categories, Cart (with badge), Wishlist, and Profile.
3. **`SmartSearchModal.jsx`:**
   - Centered AI search modal triggered by `Cmd+K` / `Ctrl+K` or clicking search input.
   - Accepts natural language queries (e.g. *"Show me red party dresses under 2000"*).
   - Displays AI answer reasoning, top recommended products, and a comparison table.
4. **`AuthModal.jsx`:**
   - Global login/signup modal accessible anywhere via `openAuthModal()` without losing current checkout/browse state.
   - Includes Google One-Tap / OAuth button, email/password form, and OTP verification screen.
5. **`ApkDownloadModal.jsx`:**
   - Smart prompt modal encouraging mobile browser users to install the native Android APK or PWA.

---

## 3. Data Models & Database Schemas (Mongoose / MongoDB)

### 3.1 User Model (`backend/src/models/User.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String, default: null },
  phone: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['customer', 'retailer', 'admin'], 
    default: 'customer' 
  },
  companyDetails: {
    companyName: { type: String },
    gstNumber: { type: String },
    panNumber: { type: String },
    isVerified: { type: Boolean, default: false }
  },
  addresses: [{
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  otp: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  refreshToken: { type: String, default: null }
}
```

### 3.2 Product Model (`backend/src/models/Product.js`)
```javascript
{
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  Category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  Subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  price: { type: Number, required: true, min: 0 },
  retailer_price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  minOrderQuantity: { type: Number, default: 1 },
  images: [{ type: String, required: true }],
  tags: [{ type: String, index: true }],
  active: { type: Boolean, default: true, index: true },
  ratings: { type: Number, default: 4.5 },
  numReviews: { type: Number, default: 0 }
}
```

### 3.3 Order Model (`backend/src/models/Order.js`)
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String }
  }],
  shippingAddress: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
  paymentResult: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    status: { type: String, default: 'pending' }
  },
  itemsPrice: { type: Number, required: true },
  taxPrice: { type: Number, default: 0 },
  shippingPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  deliveredAt: { type: Date },
  timeline: [{
    status: { type: String, required: true },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}
```

### 3.4 Transaction Model (`backend/src/models/Transaction.js`)
```javascript
{
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentGateway: { type: String, default: 'razorpay' },
  gatewayTransactionId: { type: String, index: true },
  gatewayOrderId: { type: String, index: true },
  status: { 
    type: String, 
    enum: ['created', 'captured', 'failed', 'refunded'], 
    default: 'created' 
  },
  metadata: { type: mongoose.Schema.Types.Mixed }
}
```

---

## 4. RAG Pydantic Data Contracts (`RAG_kc/app/models/`)

### 4.1 Recommendation Request & Response
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class RecommendationRequest(BaseModel):
    query: str = Field(..., description="Natural language search prompt")
    limit: int = Field(default=10, ge=1, le=50)

class ProductOut(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    price: float
    retailer_price: float
    stock: int
    rating: float
    description: str
    tags: List[str]
    images: List[str]

class RecommendationResponse(BaseModel):
    query: str
    answer: str
    count: int
    total: int
    top_products: List[ProductOut]
    why_recommended: List[str]
    comparison: List[str]
```

---

## 5. Standard API Communication Contracts

All REST responses adhere to a consistent JSON envelope:

### 5.1 Success Envelope
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [...],
    "page": 1,
    "pages": 5,
    "total": 48
  }
}
```

### 5.2 Error Envelope
```json
{
  "success": false,
  "message": "Invalid credentials provided",
  "error": "AUTH_INVALID_CREDENTIALS"
}
```

### 5.3 WebSocket Events (Socket.IO)
- Client -> Server: `join-order-room` with payload `{ orderId: string }`
- Server -> Client: `location-update` with payload `{ orderId: string, lat: number, lng: number, timestamp: string }`
- Server -> Client: `order:status_update` with payload `{ orderId: string, status: string, message: string }`
