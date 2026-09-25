# AI Agent Rules & Development Guidelines — KripaConnect

> **Purpose:** Strict engineering constraints, coding standards, and architectural guardrails for AI agents and human contributors working on KripaConnect.  
> **Status:** Active & Mandatory  
> **Last Updated:** September 2026  

---

## 1. The 10 Golden Rules (Non-Negotiable)

1. **Strict Monorepo Boundary:**
   - Never import frontend code or modules into `backend/` or `RAG_kc/`.
   - Never import backend code into `frontend/` or `RAG_kc/`.
   - Communication between `frontend`, `backend`, and `RAG_kc` occurs **strictly via HTTP REST or WebSockets**.
2. **Zero Secret Leakage:**
   - Never hardcode API keys, passwords, JWT secrets, or connection URIs in any source file.
   - Always read credentials from environment variables (`process.env` in Node.js, `os.getenv()` in Python, `import.meta.env` in Vite).
3. **Always Invalidate Redis Cache on Mutation:**
   - Any controller or service modifying products, categories, subcategories, or banners **must** call `invalidateCache()` or `invalidatePattern()` from [`backend/src/utils/cacheUtils.js`](file:///c:/Users/Kunal/Desktop/Projects/SKE/backend/src/utils/cacheUtils.js).
   - Stale cache bugs will break live store inventory.
4. **Mandatory Cryptographic Payment Verification:**
   - Never mark an order as `paid` based solely on a client-side request.
   - Razorpay payments must verify `razorpay_signature` via HMAC-SHA256 on the backend before state changes are committed.
5. **Preserve Existing Business Logic & Comments:**
   - Do not replace entire existing files if only modifying a specific function or block. Use targeted replacement tools.
   - Preserve existing docstrings, validation rules, and error handling.
6. **No Tailwind CSS (Unless Explicitly Requested):**
   - The frontend uses Vanilla CSS and CSS modules. Do not install or introduce Tailwind CSS classes unless the user explicitly requests it.
7. **Read-Only Mongoose Queries Must Use `.lean()`:**
   - To maintain sub-100ms response times, all read-only MongoDB queries in controllers must chain `.lean()` unless Mongoose virtuals or `.save()` are explicitly required.
8. **Always Use `apiFetch` in Frontend:**
   - Never use raw `fetch()` or install external Axios instances in frontend components.
   - Always route HTTP calls through [`frontend/src/services/api.js`](file:///c:/Users/Kunal/Desktop/Projects/SKE/frontend/src/services/api.js) to leverage automatic JWT refresh, cookie inclusion, and error formatting.
9. **RAG Microservice Must Fail Gracefully:**
   - The e-commerce store must function even if the RAG service is down.
   - Backend `recommendationController.js` must maintain its fallback to native MongoDB regex search when `RAG_SERVICE_URL` times out or fails.
10. **Sanitize All User Inputs:**
    - Never bypass `mongo-sanitize` or `xss` filters in backend routes.
    - All incoming route parameters must be validated using `express-validator`.

---

## 2. Backend (Node.js / Express 5) Standards

### 2.1 Controller Pattern
- Controllers must be lean and focused on HTTP request/response orchestration:
  ```javascript
  // Standard Controller Pattern
  const Product = require('../models/Product');
  const { getOrSetCache, invalidatePattern } = require('../utils/cacheUtils');

  exports.getProducts = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;
      const cacheKey = `products:list:${page}:${limit}:${req.query.category || 'all'}`;

      const data = await getOrSetCache(cacheKey, 300, async () => {
        const query = { active: true };
        if (req.query.category) query.Category = req.query.category;

        const [items, total] = await Promise.all([
          Product.find(query)
            .populate('Category', 'name slug')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Product.countDocuments(query),
        ]);

        return { items, page, pages: Math.ceil(total / limit), total };
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
  ```

### 2.2 Error Handling & Responses
- Always pass uncaught errors to `next(error)` to be caught by `errorHandler.js`.
- Never return raw stack traces in production (`NODE_ENV === 'production'`).
- Always return consistent JSON response envelopes:
  - `{ success: true, data: ..., message: ... }`
  - `{ success: false, message: ..., error: ... }`

---

## 3. Frontend (React 19 / Vite 7) Standards

### 3.1 Routing & Code-Splitting
- All new pages must be placed in `frontend/src/pages/` and registered in [`frontend/src/App.jsx`](file:///c:/Users/Kunal/Desktop/Projects/SKE/frontend/src/App.jsx) using `lazy(() => import('./pages/...'))`.
- Protected routes must be wrapped with `<ProtectedRoute>`:
  - Customer protected: `<ProtectedRoute><MyComponent /></ProtectedRoute>`
  - Role protected: `<ProtectedRoute allow={['retailer']}><B2BComponent /></ProtectedRoute>`

### 3.2 State Management
- Avoid adding Redux or Zustand unless requested.
- Leverage the existing React Contexts:
  - `useAuth()` from `AuthContext`: Access user, role, token, logout, login.
  - `useShop()` from `ShopContext`: Access cart, addToCart, removeFromCart, wishlist.
  - `usePurchaseMode()` from `PurchaseModeContext`: Access `isB2B`, toggleMode.

### 3.3 CSS & Styling Conventions
- Create dedicated CSS files (e.g. `ComponentName.css`) in `frontend/src/styles/` or alongside the component.
- Use BEM-like naming conventions (e.g., `.product-card`, `.product-card__image`, `.product-card--discounted`).
- Use CSS custom properties defined in `index.css` for colors, radiuses, and shadows.

---

## 4. Python / FastAPI (RAG Microservice) Standards

### 4.1 Type Annotations & Schemas
- Every FastAPI endpoint must specify:
  - `response_model=...`
  - Explicit parameter type annotations
  - Docstrings explaining input and output formats
- Use Pydantic v2 models in `app/models/` for request and response validation.

### 4.2 Logging & Exception Handling
- Use Python's standard `logging` module with structured formats.
- Never let unhandled exceptions crash Uvicorn workers. Wrap external calls (Pinecone, Groq, Gemini) in `try...except` and return graceful fallback responses.

---

## 5. Testing & Verification Requirements

Before submitting code or declaring a task complete, verify:
1. **Backend Tests:** Run existing scripts in `backend/scripts/` (e.g. `node scripts/testRazorpay.js`, `node scripts/checkPaymentStatus.js`).
2. **Frontend Build & Lint:** Ensure `npm run build` in `frontend/` succeeds without JSX or Vite compilation errors.
3. **RAG Microservice:** Run `python test_api.py` in `RAG_kc/` to confirm `/ping`, `/health`, and `/recommend` endpoints pass.
