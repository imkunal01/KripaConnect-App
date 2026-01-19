✅ **MASTER PROMPT:** Convert KC App to Customer-Only + Guest Checkout

## Context
This project is an e-commerce website/app (KC / Kripa Connect). Currently, the codebase contains retailer flow, role selection, and mode switching between customer and retailer. I want to completely remove all retailer-related logic and convert the app into a customer-only shopping experience with guest checkout support.

## 🎯 Goals (Very Important)
- Customer-only app
- No retailer role, no role switching
- Guest users can browse and order without login
- Login/signup is optional and only for saving data
- Simple, fast checkout (local-shop friendly)

## 🧹 Task 1: Remove Retailer Flow Completely
Remove all of the following from the codebase:
- Retailer role
- Retailer login/signup
- Role selection screen
- User mode switching (customer ↔ retailer)
- Retailer-only UI components
- Retailer-only APIs
- Retailer-only database fields
- Retailer pricing, wholesale pricing, MOQ logic
- Retailer dashboards, routes, guards, permissions

### Code Cleanup Checklist
- Delete retailer constants, enums, flags
- Remove `role === "retailer"` conditions
- Remove retailer middleware/guards
- Remove retailer navigation items
- Remove retailer-specific API routes
- Remove retailer fields from User schema

After this step, only one user type exists: **CUSTOMER**.

## 👤 Task 2: Simplify User Model (Customer Only)
User entity:
```ts
User {
    id
    name
    phone
    email? // optional
    authProvider // guest | email | google
    createdAt
}
```
- No role field
- No retailer flags
- No permissions logic

## 👀 Task 3: Guest-First User Experience
### Browsing Rules
User can:
- Browse products
- Add to cart
- View cart
- Proceed to checkout  
Without logging in.

### Cart Behavior
Guest cart stored in:
- Local storage (web)
- App state (mobile)

Cart persists until order is placed or cleared.

## 🛒 Task 4: Guest Checkout Flow (Critical)
### Checkout Flow (Guest)
Cart → Checkout  
Ask only:
- Full name
- Phone number
- Delivery address
- Place order

Create order linked to:
- `guest_user_id` or `phone_number`

### Backend Rule
Guest order does not require a user account. Phone number is mandatory (for contact and trust).

## 🔐 Task 5: Optional Login/Signup (Post-Checkout Friendly)
Login/signup must be:
- Optional
- Non-blocking
- Never forced before checkout

Offer login at:
- Order success page
- Profile page
- Orders page

Messaging example:  
“Want to track orders and reorder faster? Create an account in 10 seconds.”

## 🔑 Auth Methods to Support
- Google login
- Phone/Email OTP (optional)
- Normal email signup (optional)

If user logs in:
- Merge guest orders (by phone number)
- Save address and order history
- Enable reorder feature

## 📦 Task 6: Order & Data Handling
Orders table:
```ts
Order {
    id
    user_id? // nullable
    guest_phone
    guest_name
    address
    items
    total
    status
    created_at
}
```

Rules:
- If logged in → `user_id` filled
- If guest → `user_id = null`, phone required

## 🧭 Task 7: UI/UX Cleanup
Remove:
- Role selection screens
- “Switch mode” buttons
- Retailer labels, tags, pricing

Keep:
- Simple home page
- Product listing
- Cart
- Checkout
- Optional login/signup

Header UX:
- Show “Login” only
- No role dropdown
- Profile shows only customer options

## ⚡ Task 8: Performance & Trust (Important)
- Fast page transitions
- No auth checks blocking navigation
- Checkout loads instantly

Show:
- “Local store delivery”
- “Pay on delivery available”
- “We’ll call you for confirmation”

## 🧪 Task 9: Test Cases (Mandatory)
Ensure:
- Guest can place order without login
- Login does not clear cart
- Guest order visible after signup (phone match)
- No retailer route accessible
- No retailer API callable

## 🧠 Final Rules
- Treat login as a feature, not a requirement
- Optimize for small orders and local trust
- Keep flows minimal
- Zero friction before checkout

## ✅ Expected Outcome
After implementation:
- KC works like a local-first Blinkit-style app
- Customers can order in < 30 seconds
- Login feels optional, not forced
- Codebase is cleaner and easier to extend later with retailer flow

---

## ✅ MASTER PROMPT: Implement Category, Subcategory & Product Management (Customer-Only)

## Context
This project (KC / Kripa Connect) is now a customer-only e-commerce app with guest checkout. There is no retailer flow, no roles, and no wholesale logic. Implement a clean category → subcategory → product system, fully manageable from the Admin Panel, and fully consumable by customers.

## 🎯 Goals
- Admin can create, edit, enable/disable categories
- Admin can create, edit, enable/disable subcategories
- Admin can add products under a selected category and subcategory
- Customer sees only active categories, subcategories, and products
- Frontend must not hardcode categories

## 🧱 Task 1: Category Management (Level 1)
Admin Panel → Categories

### Fields
```ts
Category {
    id
    name
    slug // auto-generated
    icon // image or svg
    description? // optional
    status // active | inactive
    display_order
    created_at
}
```

### Admin Capabilities
- Create category
- Edit category
- Enable/disable category (soft delete)
- Reorder categories (`display_order`)
- Prevent deletion if subcategories/products exist

## 🧩 Task 2: Subcategory Management (Level 2)
Admin Panel → Subcategories

### Fields
```ts
Subcategory {
    id
    category_id // FK
    name
    slug
    image? // optional
    status // active | inactive
    display_order
    created_at
}
```

### Rules
- Subcategory must belong to a category
- Dropdown shows only active categories
- If a category is inactive → hide its subcategories automatically
- Prevent deletion if products exist

## 📦 Task 3: Product Management (Level 3)
Admin Panel → Products → Add Product

### Step 1: Classification
- Select Category (required)
- Select Subcategory (required, filtered by category)

If no subcategory exists:
- Show “Create Subcategory” inline modal → auto-select after creation

### Step 2: Product Details
```ts
Product {
    id
    category_id
    subcategory_id
    name
    brand
    description // rich text
    images // multiple
}
```

### Step 3: Pricing & Inventory
```ts
pricing {
    mrp
    selling_price
    gst_percentage
}

inventory {
    stock_quantity
    in_stock // boolean
}
```

### Step 4: Services & Metadata
```ts
services {
    warranty? // optional
    installation_available // true/false
    returnable // true/false
}
```

### Step 5: Publish Control
- Save as Draft
- Publish
- Enable/disable product

## 👀 Task 4: Customer-Facing Category Flow
### Home Page
- Show only active categories
- Ordered by `display_order`

### Navigation
Category → Subcategory → Product list

### Product Listing Rules
- Hide inactive categories/subcategories/products
- Fast loading (API-based, cache-ready)
- Empty state if no products

## 🔌 Task 5: API Design (Clean & Simple)
### Admin APIs
- `POST /admin/categories`
- `POST /admin/subcategories`
- `POST /admin/products`
- `PUT /admin/categories/:id`
- `PUT /admin/subcategories/:id`
- `PUT /admin/products/:id`

### Public APIs (Customer)
- `GET /categories`
- `GET /subcategories?categoryId=ID`
- `GET /products?subcategoryId=ID`
- `GET /products/:id`

## ⚠️ Task 6: Important Rules (Do Not Skip)
- Do not hardcode category names in frontend
- Do not allow product without subcategory
- Do not permanently delete records
- Use status flags for visibility
- Store both `category_id` and `subcategory_id` in product
- Validate category-subcategory relationship server-side

## 🧠 Task 7: Admin UX Requirements
- Categories, Subcategories, Products in separate screens
- Search + filter products by category/subcategory
- Inline “Create Subcategory” from product form
- Image upload with preview
- Clear error messages

## 🧪 Task 8: Test Cases
Ensure:
- Inactive category hides all subcategories and products
- Product cannot be created without category + subcategory
- Customer API never returns inactive data
- Admin can safely reorder categories
- No frontend crash if category has no products

## 🚀 Expected Result
After implementation:
- Admin fully controls catalog
- Customer app loads dynamically
- Easy to scale categories later
- Clean data model
- Ready for Redis/caching later

## 🔮 Future Ready (Do Not Implement Now)
- Category banners
- Featured categories
- Product attributes (RAM, size, color)
- Bulk upload (CSV)
