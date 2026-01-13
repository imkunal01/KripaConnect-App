/**
 * Example Component: Complete Implementation Guide
 * 
 * This file demonstrates all the native mobile patterns in one place.
 * Copy and adapt these patterns to your components.
 */

import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import ShopContext from '../context/ShopContext'
import { usePreventRageTap } from '../hooks/usePreventRageTap'
import { usePrefetch } from '../hooks/usePrefetch'
import { ProductListSkeleton } from './SkeletonLoader'

// ========================================
// PATTERN 1: Optimistic UI Button
// ========================================
function OptimisticButton({ product }) {
  const { addToCart } = useContext(ShopContext)
  const [isAdding, withPrevent] = usePreventRageTap({ minDelay: 200 })

  return (
    <button
      className="product-card-button"
      disabled={isAdding}
      onClick={withPrevent(async () => {
        // UI updates instantly in ShopContext
        // API call happens in background
        // Rollback on error
        await addToCart(product, 1)
      })}
    >
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}

// ========================================
// PATTERN 2: Prefetch on Intent
// ========================================
function PrefetchLink({ productId, children }) {
  const prefetchProps = usePrefetch(() => {
    // This runs on touch/hover
    console.log('Prefetching product:', productId)
    // fetchProductDetails(productId) // Add your prefetch logic
  })

  return (
    <Link 
      to={`/product/${productId}`}
      {...prefetchProps}
      className="product-link"
    >
      {children}
    </Link>
  )
}

// ========================================
// PATTERN 3: Skeleton Loading State
// ========================================
function ProductList() {
  const [products, setProducts] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulated fetch
  useState(() => {
    setTimeout(() => {
      setProducts([/* products */])
      setLoading(false)
    }, 1000)
  }, [])

  // Show skeleton IMMEDIATELY while loading
  if (loading) return <ProductListSkeleton count={8} />

  return (
    <div className="product-grid">
      {products.map(p => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  )
}

// ========================================
// PATTERN 4: Multi-State Button
// ========================================
function MultiStateButton({ onSubmit }) {
  const [state, setState] = useState('idle') // idle | loading | success | error
  
  const handleClick = async () => {
    setState('loading')
    try {
      await onSubmit()
      setState('success')
      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const buttonText = {
    idle: 'Save Changes',
    loading: 'Saving...',
    success: 'Saved ✓',
    error: 'Failed ✗'
  }[state]

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={`btn ${state === 'success' ? 'btn-success' : ''} ${state === 'error' ? 'btn-error' : ''}`}
    >
      {buttonText}
    </button>
  )
}

// ========================================
// PATTERN 5: Quantity Selector with Optimistic UI
// ========================================
function QuantitySelector({ productId, currentQty }) {
  const { updateQty } = useContext(ShopContext)
  const [isUpdating, withPrevent] = usePreventRageTap({ minDelay: 150 })

  return (
    <div className="qty-selector">
      <button
        onClick={withPrevent(async () => updateQty(productId, currentQty - 1))}
        disabled={isUpdating || currentQty <= 1}
      >
        −
      </button>
      <span>{currentQty}</span>
      <button
        onClick={withPrevent(async () => updateQty(productId, currentQty + 1))}
        disabled={isUpdating}
      >
        +
      </button>
    </div>
  )
}

// ========================================
// PATTERN 6: Form Submit with Rage-Tap Prevention
// ========================================
function ProfileForm() {
  const [isSubmitting, withPrevent] = usePreventRageTap({ minDelay: 300 })
  const [formData, setFormData] = useState({ name: '', email: '' })

  const handleSubmit = withPrevent(async (e) => {
    e.preventDefault()
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Form submitted:', formData)
  })

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="selectable" // Allow text selection in inputs
      />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}

// ========================================
// PATTERN 7: Delete with Confirmation
// ========================================
function DeleteButton({ itemId, onDelete }) {
  const [isDeleting, withPrevent] = usePreventRageTap({ minDelay: 200 })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = withPrevent(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000) // Auto-cancel after 3s
      return
    }
    
    await onDelete(itemId)
    setConfirmDelete(false)
  })

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`btn-danger ${confirmDelete ? 'btn-confirm' : ''}`}
    >
      {isDeleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete?' : 'Delete'}
    </button>
  )
}

// ========================================
// PATTERN 8: Favorite Toggle with Animation
// ========================================
function FavoriteButton({ productId, isFavorite }) {
  const { toggleFavorite } = useContext(ShopContext)
  const [isToggling, withPrevent] = usePreventRageTap({ minDelay: 200 })
  const [animate, setAnimate] = useState(false)

  const handleToggle = withPrevent(async () => {
    setAnimate(true)
    await toggleFavorite(productId) // Optimistic update in context
    setTimeout(() => setAnimate(false), 300)
  })

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`favorite-btn ${isFavorite ? 'active' : ''} ${animate ? 'pop' : ''}`}
    >
      {isFavorite ? '❤️' : '🤍'}
    </button>
  )
}

// ========================================
// USAGE GUIDE
// ========================================
/*

## When to Use Each Pattern

1. **OptimisticButton** - Cart actions, favorites, simple updates
2. **PrefetchLink** - Navigation to detail pages
3. **ProductList** - Any list/grid that loads data
4. **MultiStateButton** - Profile updates, settings changes
5. **QuantitySelector** - Cart quantity adjustments
6. **ProfileForm** - Any form submission
7. **DeleteButton** - Destructive actions needing confirmation
8. **FavoriteButton** - Toggle actions with visual feedback

## Key Principles

✅ UI updates BEFORE API calls (optimistic)
✅ Show loading states AFTER user action starts
✅ Prevent multiple taps with disabled state
✅ Show skeleton loaders while initial data loads
✅ Prefetch data on touch/hover intent
✅ Keep animations <150ms
✅ Rollback on error

❌ Never wait for API before updating UI
❌ Never allow multiple simultaneous submissions
❌ Never show spinners without disabling the button
❌ Never use setTimeout for artificial delays

*/

export {
  OptimisticButton,
  PrefetchLink,
  ProductList,
  MultiStateButton,
  QuantitySelector,
  ProfileForm,
  DeleteButton,
  FavoriteButton
}
