# 🔄 Migration Checklist

Use this checklist to upgrade existing pages/components to native mobile patterns.

---

## 🎯 Quick Wins (Apply These First)

### ✅ All Pages
- [ ] No changes needed - global CSS already applied
- [x] Browser tap highlights removed globally
- [x] 300ms delay eliminated globally  
- [x] Native press feedback on all buttons (via CSS)

---

## 📄 Page-by-Page Migration

### Dashboard.jsx
- [ ] Add skeleton loader while products load
  ```jsx
  import { ProductListSkeleton } from '../components/SkeletonLoader'
  if (loading) return <ProductListSkeleton count={8} />
  ```
- [ ] Apply prefetch to product cards (already in ProductCard.jsx)

### Products.jsx
- [ ] Add skeleton loader for product grid
- [ ] Add prefetch for category filters

### ProductDetails.jsx  
- [ ] Add skeleton loader for product info
- [ ] Add rage-tap prevention to "Add to Cart" button
  ```jsx
  import { usePreventRageTap } from '../hooks/usePreventRageTap'
  const [isAdding, withPrevent] = usePreventRageTap()
  
  <button 
    disabled={isAdding}
    onClick={withPrevent(async () => addToCart(product, qty))}
  >
    {isAdding ? 'Adding...' : 'Add to Cart'}
  </button>
  ```

### CartPage.jsx
- [ ] Add skeleton loader for cart items
- [ ] Quantity +/- buttons already optimistic (ShopContext)
- [ ] Add rage-tap prevention to "Proceed to Checkout"

### CheckoutPage.jsx
- [ ] Add rage-tap prevention to "Place Order" button (likely already has state management)
- [ ] Verify optimistic address updates

### Favorites.jsx
- [ ] Add skeleton loader for favorites grid
- [ ] Add rage-tap to "Add to Cart" buttons
  ```jsx
  const [isAdding, withPrevent] = usePreventRageTap()
  
  <button 
    onClick={withPrevent(async () => addToCart(p, 1))}
    disabled={isAdding}
  >
    {isAdding ? 'Adding...' : 'Add to Cart'}
  </button>
  ```

### ProfilePage.jsx
- [ ] Add rage-tap prevention to "Save Changes"
- [ ] Show multi-state feedback (Saving... → Saved ✓)
  ```jsx
  const [state, setState] = useState('idle')
  
  const handleSave = async () => {
    setState('loading')
    try {
      await saveProfile()
      setState('success')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }
  ```

### OrdersPage.jsx
- [ ] Add skeleton loader for orders list
- [ ] Add prefetch to order detail links

### Categories.jsx
- [ ] Add skeleton loader for categories
- [ ] Add prefetch to category links

---

## 🔧 Component-by-Component

### ✅ Already Updated
- [x] ProductCard.jsx - Rage-tap + optimistic favorites
- [x] FavoritesButton.jsx - Rage-tap + optimistic toggle
- [x] ShopContext.jsx - Fully optimistic cart & favorites

### 🔄 Need Updates

#### AddressForm.jsx
- [ ] Add rage-tap prevention to submit
- [ ] Show "Saving..." → "Saved ✓" feedback

#### Navbar.jsx (Optional Enhancement)
- [ ] Add prefetch to navigation links
  ```jsx
  import { usePrefetch } from '../hooks/usePrefetch'
  
  const prefetchProducts = usePrefetch(() => {
    // Prefetch products data
  })
  
  <Link to="/products" {...prefetchProducts}>Products</Link>
  ```

#### Footer.jsx
- [ ] No changes needed (links work fine)

---

## 🎨 CSS Enhancements (Optional)

### Add to Specific Components

```css
/* Button loading spinner */
.btn-loading::after {
  content: '';
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Pop animation for success */
.pop {
  animation: pop 0.3s ease-out;
}
@keyframes pop {
  50% { transform: scale(1.1); }
}
```

Or import the utilities:
```css
@import './styles/native-mobile-utils.css';
```

---

## 📋 Testing Checklist

After each component update, test:

- [ ] Button responds instantly on tap (<50ms)
- [ ] No blue tap highlights
- [ ] Loading state shows during async operations
- [ ] Button disables to prevent double-tap
- [ ] Success feedback appears
- [ ] Error states handled gracefully
- [ ] Skeleton shows while initial data loads
- [ ] No white flashes on navigation

---

## 🚀 Priority Order

### Week 1 (High Impact)
1. ✅ Global CSS (DONE)
2. ✅ Cart operations (DONE)  
3. ✅ Favorites (DONE)
4. ⚠️ Skeleton loaders on main pages
5. ⚠️ Checkout button rage-tap prevention

### Week 2 (Nice to Have)
6. Profile page improvements
7. Address form enhancements
8. Prefetch on navigation
9. Orders page skeleton

### Week 3 (Polish)
10. Image lazy loading
11. Page transitions
12. Additional animations

---

## 📖 Reference

- **Full Guide:** [NATIVE_MOBILE_IMPLEMENTATION.md](NATIVE_MOBILE_IMPLEMENTATION.md)
- **Examples:** [ExamplePatterns.jsx](frontend/src/components/ExamplePatterns.jsx)
- **Utilities:** [native-mobile-utils.css](frontend/src/styles/native-mobile-utils.css)

---

## ✅ Quick Reference

### Import Hooks
```javascript
import { usePreventRageTap } from '../hooks/usePreventRageTap'
import { usePrefetch } from '../hooks/usePrefetch'
import { useNativePress } from '../hooks/useNativePress'
```

### Import Components
```javascript
import { ProductListSkeleton, PageSkeleton } from '../components/SkeletonLoader'
```

### Basic Pattern
```javascript
const [isProcessing, withPrevent] = usePreventRageTap()

<button
  disabled={isProcessing}
  onClick={withPrevent(async () => {
    await asyncAction()
  })}
>
  {isProcessing ? 'Processing...' : 'Submit'}
</button>
```

---

**Remember:** The goal is instant user feedback. Update UI first, sync with API after! 🚀
