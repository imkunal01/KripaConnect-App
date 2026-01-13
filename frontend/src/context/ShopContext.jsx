import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import AuthContext from './AuthContext.jsx'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import { listFavorites, addFavorite, removeFavorite } from '../services/favorites'
import { getCart, addToCart as apiAddToCart, updateCartItem, removeCartItem } from '../services/cart'
import toast from 'react-hot-toast'

const ShopContext = createContext(null)

// Helper to map cart item from API response
function mapCartItem(i) {
  return {
    productId: i.product,
    name: i.name,
    price: i.price,
    image: i.image,
    qty: i.qty,
    stock: i.stock,
    regularPrice: i.regularPrice,
    retailerPrice: i.retailerPrice,
    bulkPrice: i.bulkPrice,
    minBulkQty: i.minBulkQty,
    isBulkPrice: i.isBulkPrice
  }
}

export function ShopProvider({ children }) {
  const { token } = useContext(AuthContext)
  const { mode } = usePurchaseMode()
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_cart')) || [] } catch { return [] }
  })
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_favs')) || [] } catch { return [] }
  })
  const [loading, setLoading] = useState(false)
  const initialLoadDone = useRef(false)

  useEffect(() => { localStorage.setItem('kc_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('kc_favs', JSON.stringify(favorites)) }, [favorites])

  // Clear cart/favorites on logout
  useEffect(() => {
    if (!token) {
      const t = setTimeout(() => {
        setCart([])
        setFavorites([])
        localStorage.removeItem('kc_cart')
        localStorage.removeItem('kc_favs')
        initialLoadDone.current = false
      }, 0)

      return () => clearTimeout(t)
    }
  }, [token])

  const addToCart = useCallback(async (product, qty = 1) => {
    // INSTANT UI UPDATE - no awaits before this
    const tempItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url,
      qty,
      stock: product.stock,
      regularPrice: product.regularPrice,
      retailerPrice: product.retailerPrice,
      bulkPrice: product.bulkPrice,
      minBulkQty: product.minBulkQty,
      isBulkPrice: false
    }

    // Update UI INSTANTLY
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === product._id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty }
        return updated
      }
      return [...prev, tempItem]
    })

    // Show success immediately
    toast.success('Added to cart')

    // Then sync with backend
    if (token) {
      try {
        const res = await apiAddToCart(product._id, qty, token, mode)
        // Update with real data from server
        if (res.data?.item) {
          const newItem = mapCartItem(res.data.item)
          setCart(prev => {
            const idx = prev.findIndex(i => i.productId === product._id)
            if (idx >= 0) {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], ...newItem }
              return updated
            }
            return prev
          })
        }
      } catch (err) {
        console.error('Add to cart failed:', err)
        // Rollback on error
        setCart(prev => {
          const idx = prev.findIndex(i => i.productId === product._id)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx].qty -= qty
            if (updated[idx].qty <= 0) return prev.filter((_, i) => i !== idx)
            return updated
          }
          return prev.filter(i => i.productId !== product._id)
        })
        toast.error(err?.message || 'Failed to add to cart')
        throw err
      }
    }
  }, [token, mode])

  const removeFromCart = useCallback(async (productId) => {
    if (token) {
      // Optimistically remove from UI first
      setCart(prev => prev.filter(i => i.productId !== productId))
      try {
        await removeCartItem(productId, token)
        toast.success('Removed from cart')
      } catch (err) {
        // Revert on error - refetch cart
        const items = await getCart(token, mode)
        setCart(items.map(mapCartItem))
        toast.error(err?.message || 'Failed to remove item')
        throw err
      }
    } else {
      setCart(prev => prev.filter(i => i.productId !== productId))
      toast.success('Removed from cart')
    }
  }, [token, mode])

  const updateQty = useCallback(async (productId, qty) => {
    if (token) {
      // Optimistically update UI
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
      try {
        const res = await updateCartItem(productId, qty, token, mode)
        if (res.data?.removed) {
          setCart(prev => prev.filter(i => i.productId !== productId))
        } else if (res.data?.item) {
          const updated = mapCartItem(res.data.item)
          setCart(prev => prev.map(i => i.productId === productId ? { ...i, ...updated } : i))
        }
      } catch (err) {
        // Revert on error - refetch cart
        const items = await getCart(token, mode)
        setCart(items.map(mapCartItem))
        throw err
      }
    } else {
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
    }
  }, [token, mode])

  const toggleFavorite = useCallback(async (productId) => {
    const exists = favorites.includes(productId)
    
    // INSTANT UI UPDATE - no conditions, no awaits
    setFavorites(prev => exists ? prev.filter(id => id !== productId) : [...prev, productId])
    toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist')

    // Then sync with backend
    if (token) {
      try {
        if (exists) {
          await removeFavorite(productId, token)
        } else {
          await addFavorite(productId, token)
        }
      } catch (err) {
        // Rollback on error
        setFavorites(prev => exists ? [...prev, productId] : prev.filter(id => id !== productId))
        toast.error(err?.message || 'Wishlist update failed')
        throw err
      }
    }
  }, [token, favorites])

  // Initial load - only once when token becomes available
  useEffect(() => {
    if (!token || initialLoadDone.current) return

    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled) return
      setLoading(true)
      Promise.all([listFavorites(token), getCart(token, mode)])
        .then(([favItems, cartItems]) => {
          if (cancelled) return
          setFavorites(favItems.map(p => p._id))
          setCart(cartItems.map(mapCartItem))
          initialLoadDone.current = true
        })
        .catch(err => console.error('Failed to load cart/favorites:', err))
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [token, mode])

  const clearCart = useCallback(async () => {
    if (token) {
      // Fetch latest cart state (after order placement, cart should be empty)
      try {
        const items = await getCart(token, mode)
        setCart(items.map(mapCartItem))
      } catch {
        setCart([])
      }
    } else {
      setCart([])
    }
  }, [token, mode])

  // Phase 3: used when switching purchase modes (must fully empty cart)
  const wipeCart = useCallback(async () => {
    // Always clear local cart immediately; if server clearing fails we will restore from server.
    const prev = cart
    setCart([])

    if (!token) return true

    try {
      const ids = Array.isArray(prev) ? prev.map(i => i.productId).filter(Boolean) : []
      for (const productId of ids) {
        // best-effort delete; backend cart endpoints don't have a single clear route
        await removeCartItem(productId, token)
      }

      const items = await getCart(token, mode)
      setCart(items.map(mapCartItem))
      return items.length === 0
    } catch {
      // Restore UI from server as source of truth
      try {
        const items = await getCart(token, mode)
        setCart(items.map(mapCartItem))
      } catch {
        // If even refresh fails, keep UI empty (user can refresh)
      }
      return false
    }
  }, [token, cart, mode])

  const refreshCart = useCallback(async () => {
    if (!token) return
    try {
      const items = await getCart(token, mode)
      setCart(items.map(mapCartItem))
    } catch (err) {
      console.error('Failed to refresh cart:', err)
    }
  }, [token, mode])

  const value = useMemo(() => ({ 
    cart, 
    favorites, 
    loading,
    addToCart, 
    removeFromCart, 
    updateQty, 
    toggleFavorite, 
    clearCart,
    wipeCart,
    refreshCart
  }), [cart, favorites, loading, addToCart, removeFromCart, updateQty, toggleFavorite, clearCart, wipeCart, refreshCart])
  
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export default ShopContext
