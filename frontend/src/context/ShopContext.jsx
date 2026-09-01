import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import AuthContext from './AuthContext.jsx'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import { listFavorites, addFavorite, removeFavorite } from '../services/favorites'
import { getCart, addToCart as apiAddToCart, updateCartItem, removeCartItem, mergeCart } from '../services/cart'
import toast from 'react-hot-toast'

const ShopContext = createContext(null)

const GUEST_CART_KEY = 'kc_guest_cart'
const GUEST_FAVS_KEY = 'kc_guest_favs'

// Helper to map cart item from API response
function mapCartItem(i) {
  return {
    productId: i.product || i.productId,
    name: i.name,
    price: i.price,
    image: i.image || i.images?.[0]?.url,
    qty: i.qty,
    stock: i.stock,
    regularPrice: i.regularPrice,
    retailerPrice: i.retailerPrice,
    bulkPrice: i.bulkPrice,
    minBulkQty: i.minBulkQty,
    isBulkPrice: i.isBulkPrice
  }
}

function loadGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || []
  } catch {
    return []
  }
}

function loadGuestFavs() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_FAVS_KEY)) || []
  } catch {
    return []
  }
}

export function ShopProvider({ children }) {
  const { token } = useContext(AuthContext)
  const { mode } = usePurchaseMode()

  const [cart, setCart] = useState(() => {
    return loadGuestCart()
  })
  const [favorites, setFavorites] = useState(() => {
    return loadGuestFavs()
  })
  const [loading, setLoading] = useState(false)
  const prevTokenRef = useRef(token)
  const initialLoadDone = useRef(false)

  // Persist guest cart & favorites when unauthenticated
  useEffect(() => {
    if (!token) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))
    }
  }, [cart, token])

  useEffect(() => {
    if (!token) {
      localStorage.setItem(GUEST_FAVS_KEY, JSON.stringify(favorites))
    }
  }, [favorites, token])

  // Handle Login & Logout state transitions (including Guest Cart Merge)
  useEffect(() => {
    const wasGuest = !prevTokenRef.current && !!token
    const wasAuth = !!prevTokenRef.current && !token
    prevTokenRef.current = token

    if (wasAuth) {
      // User logged out: clear state and reset to fresh guest state
      setCart([])
      setFavorites([])
      localStorage.removeItem(GUEST_CART_KEY)
      localStorage.removeItem(GUEST_FAVS_KEY)
      initialLoadDone.current = false
      return
    }

    if (token) {
      let cancelled = false
      setLoading(true)

      const guestItems = wasGuest ? loadGuestCart() : []

      const loadPromise = (guestItems.length > 0)
        ? mergeCart(guestItems, token, mode).then((merged) => {
            localStorage.removeItem(GUEST_CART_KEY)
            return merged
          })
        : getCart(token, mode)

      Promise.all([listFavorites(token).catch(() => []), loadPromise.catch(() => [])])
        .then(([favItems, cartItems]) => {
          if (cancelled) return
          setFavorites(favItems.map(p => p._id || p))
          setCart((cartItems || []).map(mapCartItem))
          initialLoadDone.current = true
        })
        .catch(err => {
          console.error('Failed to sync cart/favorites on auth change:', err)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => {
        cancelled = true
      }
    }
  }, [token, mode])

  const addToCart = useCallback(async (product, qty = 1) => {
    const pId = product._id || product.productId
    const tempItem = {
      productId: pId,
      name: product.name,
      price: product.price,
      image: product.image || product.images?.[0]?.url,
      qty,
      stock: product.stock ?? 999,
      regularPrice: product.regularPrice || product.price,
      retailerPrice: product.retailerPrice,
      bulkPrice: product.bulkPrice,
      minBulkQty: product.minBulkQty,
      isBulkPrice: false
    }

    let snapshot = null

    // INSTANT OPTIMISTIC UI UPDATE
    setCart(prev => {
      snapshot = prev
      const idx = prev.findIndex(i => i.productId === pId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty }
        return updated
      }
      return [...prev, tempItem]
    })

    toast.success('Added to cart')

    if (token) {
      try {
        const res = await apiAddToCart(pId, qty, token, mode)
        if (res.data?.item) {
          const newItem = mapCartItem(res.data.item)
          setCart(prev => {
            const idx = prev.findIndex(i => i.productId === pId)
            if (idx >= 0) {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], ...newItem }
              return updated
            }
            return prev
          })
        }
      } catch (err) {
        console.error('Add to cart failed, rolling back:', err)
        if (snapshot) setCart(snapshot)
        toast.error(err?.message || 'Failed to add to cart')
        throw err
      }
    }
  }, [token, mode])

  const removeFromCart = useCallback(async (productId) => {
    let snapshot = null
    // Optimistically remove from UI
    setCart(prev => {
      snapshot = prev
      return prev.filter(i => i.productId !== productId)
    })
    toast.success('Removed from cart')

    if (token) {
      try {
        await removeCartItem(productId, token)
      } catch (err) {
        console.error('Remove from cart failed, rolling back:', err)
        if (snapshot) setCart(snapshot)
        toast.error(err?.message || 'Failed to remove item')
        throw err
      }
    }
  }, [token])

  const updateQty = useCallback(async (productId, qty) => {
    let snapshot = null
    const targetQty = Number(qty)

    // Optimistically update quantity
    setCart(prev => {
      snapshot = prev
      if (targetQty <= 0) {
        return prev.filter(i => i.productId !== productId)
      }
      return prev.map(i => i.productId === productId ? { ...i, qty: targetQty } : i)
    })

    if (token) {
      try {
        const res = await updateCartItem(productId, targetQty, token, mode)
        if (res.data?.removed) {
          setCart(prev => prev.filter(i => i.productId !== productId))
        } else if (res.data?.item) {
          const updated = mapCartItem(res.data.item)
          setCart(prev => prev.map(i => i.productId === productId ? { ...i, ...updated } : i))
        }
      } catch (err) {
        console.error('Update quantity failed, rolling back:', err)
        if (snapshot) setCart(snapshot)
        toast.error(err?.message || 'Failed to update quantity')
        throw err
      }
    }
  }, [token, mode])

  const toggleFavorite = useCallback(async (productId) => {
    const exists = favorites.includes(productId)
    let snapshot = null

    // INSTANT OPTIMISTIC UI UPDATE
    setFavorites(prev => {
      snapshot = prev
      return exists ? prev.filter(id => id !== productId) : [...prev, productId]
    })
    toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist')

    if (token) {
      try {
        if (exists) {
          await removeFavorite(productId, token)
        } else {
          await addFavorite(productId, token)
        }
      } catch (err) {
        console.error('Wishlist sync failed, rolling back:', err)
        if (snapshot) setFavorites(snapshot)
        toast.error(err?.message || 'Wishlist update failed')
        throw err
      }
    }
  }, [token, favorites])

  const clearCart = useCallback(async () => {
    setCart([])
    if (token) {
      try {
        const items = await getCart(token, mode)
        setCart((items || []).map(mapCartItem))
      } catch {
        setCart([])
      }
    } else {
      localStorage.removeItem(GUEST_CART_KEY)
    }
  }, [token, mode])

  const wipeCart = useCallback(async () => {
    const prev = cart
    setCart([])

    if (!token) {
      localStorage.removeItem(GUEST_CART_KEY)
      return true
    }

    try {
      const ids = Array.isArray(prev) ? prev.map(i => i.productId).filter(Boolean) : []
      for (const productId of ids) {
        await removeCartItem(productId, token)
      }
      const items = await getCart(token, mode)
      setCart((items || []).map(mapCartItem))
      return items.length === 0
    } catch {
      try {
        const items = await getCart(token, mode)
        setCart((items || []).map(mapCartItem))
      } catch {}
      return false
    }
  }, [token, cart, mode])

  const refreshCart = useCallback(async () => {
    if (!token) return
    try {
      const items = await getCart(token, mode)
      setCart((items || []).map(mapCartItem))
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

