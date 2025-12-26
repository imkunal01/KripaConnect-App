import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import AuthContext from './AuthContext.jsx'
import { listFavorites, addFavorite, removeFavorite } from '../services/favorites'
import { getCart, addToCart as apiAddToCart, updateCartItem, removeCartItem } from '../services/cart'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const { token } = useContext(AuthContext)
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_cart')) || [] } catch { return [] }
  })
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_favs')) || [] } catch { return [] }
  })

  useEffect(() => { localStorage.setItem('kc_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('kc_favs', JSON.stringify(favorites)) }, [favorites])

  // Clear cart/favorites on logout
  useEffect(() => {
    if (!token) {
      // If we just logged out, we should probably clear the view, 
      // UNLESS we want to support "guest cart" merging later.
      // But the user specifically asked to remove items after logout.
      // So we reset to empty or guest state.
      // For now, let's assume logout means "clear user data".
      // But wait, if I had a guest cart before login, I might want it back?
      // The current implementation loads from localStorage on init.
      // If I log out, token becomes null.
      // The requirement: "cart items Show NaN after we log out".
      // This implies the user wants a clean slate or a valid guest cart.
      // Since the corruption comes from backend data, clearing it is safest.
      setCart([])
      setFavorites([])
      localStorage.removeItem('kc_cart')
      localStorage.removeItem('kc_favs')
    }
  }, [token])

  const addToCart = useCallback(async (product, qty = 1) => {
    if (token) {
      await apiAddToCart(product._id, qty, token)
      const items = await getCart(token)
      setCart(items.map(i => ({ 
        productId: i.product, 
        name: i.name, 
        price: i.price, 
        image: i.image, 
        qty: i.qty,
        regularPrice: i.regularPrice,
        retailerPrice: i.retailerPrice,
        bulkPrice: i.bulkPrice,
        minBulkQty: i.minBulkQty,
        isBulkPrice: i.isBulkPrice
      })))
    } else {
      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === product._id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], qty: next[idx].qty + qty }
          return next
        }
        return [...prev, { productId: product._id, name: product.name, price: product.price, image: product.images?.[0]?.url, qty }]
      })
    }
  }, [token])

  const removeFromCart = useCallback(async (productId) => {
    if (token) {
      await removeCartItem(productId, token)
      const items = await getCart(token)
      setCart(items.map(i => ({ 
        productId: i.product, 
        name: i.name, 
        price: i.price, 
        image: i.image, 
        qty: i.qty,
        regularPrice: i.regularPrice,
        retailerPrice: i.retailerPrice,
        bulkPrice: i.bulkPrice,
        minBulkQty: i.minBulkQty,
        isBulkPrice: i.isBulkPrice
      })))
    } else {
      setCart(prev => prev.filter(i => i.productId !== productId))
    }
  }, [token])

  const updateQty = useCallback(async (productId, qty) => {
    if (token) {
      await updateCartItem(productId, qty, token)
      const items = await getCart(token)
      setCart(items.map(i => ({ 
        productId: i.product, 
        name: i.name, 
        price: i.price, 
        image: i.image, 
        qty: i.qty,
        regularPrice: i.regularPrice,
        retailerPrice: i.retailerPrice,
        bulkPrice: i.bulkPrice,
        minBulkQty: i.minBulkQty,
        isBulkPrice: i.isBulkPrice
      })))
    } else {
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
    }
  }, [token])

  const toggleFavorite = useCallback(async (productId) => {
    if (token) {
      const exists = favorites.includes(productId)
      if (exists) await removeFavorite(productId, token)
      else await addFavorite(productId, token)
      const items = await listFavorites(token)
      setFavorites(items.map(p => p._id))
    } else {
      setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId])
    }
  }, [token, favorites])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      const [favItems, cartItems] = await Promise.all([listFavorites(token), getCart(token)])
      setFavorites(favItems.map(p => p._id))
      setCart(cartItems.map(i => ({ 
        productId: i.product, 
        name: i.name, 
        price: i.price, 
        image: i.image, 
        qty: i.qty,
        regularPrice: i.regularPrice,
        retailerPrice: i.retailerPrice,
        bulkPrice: i.bulkPrice,
        minBulkQty: i.minBulkQty,
        isBulkPrice: i.isBulkPrice
      })))
    })()
  }, [token])

  const clearCart = useCallback(async () => {
    if (token) {
      // For COD orders, backend clears the cart. 
      // For others, we might need an endpoint or just refresh.
      // Ideally we call an endpoint DELETE /api/cart, but since we don't have it,
      // we'll just fetch the empty cart or set it to empty if we know it's cleared.
      // Let's just fetch to be safe and consistent.
      const items = await getCart(token)
      setCart(items.map(i => ({ 
        productId: i.product, 
        name: i.name, 
        price: i.price, 
        image: i.image, 
        qty: i.qty,
        regularPrice: i.regularPrice,
        retailerPrice: i.retailerPrice,
        bulkPrice: i.bulkPrice,
        minBulkQty: i.minBulkQty,
        isBulkPrice: i.isBulkPrice
      })))
    } else {
      setCart([])
    }
  }, [token])

  const value = useMemo(() => ({ cart, favorites, addToCart, removeFromCart, updateQty, toggleFavorite, clearCart }), [cart, favorites, addToCart, removeFromCart, updateQty, toggleFavorite, clearCart])
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export default ShopContext
