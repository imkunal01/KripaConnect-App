import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import AuthContext from './AuthContext.jsx'
import { listFavorites, addFavorite, removeFavorite } from '../services/favorites'
import { getCart, addToCart as apiAddToCart, updateCartItem, removeCartItem } from '../services/cart'
import { useToast } from './ToastContext.jsx'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const { token } = useContext(AuthContext)
  const toast = useToast()
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_cart')) || [] } catch { return [] }
  })
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_favs')) || [] } catch { return [] }
  })

  useEffect(() => { localStorage.setItem('kc_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('kc_favs', JSON.stringify(favorites)) }, [favorites])

  // Track in-flight cart and favorite operations to avoid duplicate actions
  const addingCartRef = useRef(new Set())
  const togglingFavRef = useRef(new Set())

  const addToCart = useCallback(async (product, qty = 1) => {
    const productId = product._id
    if (addingCartRef.current.has(productId)) {
      // Prevent duplicate rapid add actions
      return
    }
    if (token) {
      try {
        addingCartRef.current.add(productId)
        await apiAddToCart(productId, qty, token)
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
        toast.success('Item added to cart')
      } catch (e) {
        toast.error(e.message || 'Failed to add to cart')
      } finally {
        addingCartRef.current.delete(productId)
      }
    } else {
      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === product._id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], qty: next[idx].qty + qty }
          toast.success('Cart quantity updated')
          return next
        }
        toast.success('Item added to cart')
        return [...prev, { productId: product._id, name: product.name, price: product.price, image: product.images?.[0]?.url, qty }]
      })
    }
  }, [token, toast])

  const removeFromCart = useCallback(async (productId) => {
    if (token) {
      try {
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
        toast.info('Item removed from cart')
      } catch (e) {
        toast.error(e.message || 'Failed to remove from cart')
      }
    } else {
      setCart(prev => {
        const next = prev.filter(i => i.productId !== productId)
        if (next.length !== prev.length) {
          toast.info('Item removed from cart')
        }
        return next
      })
    }
  }, [token, toast])

  const updateQty = useCallback(async (productId, qty) => {
    if (token) {
      try {
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
        toast.success('Cart updated')
      } catch (e) {
        toast.error(e.message || 'Failed to update cart')
      }
    } else {
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
      toast.success('Cart updated')
    }
  }, [token, toast])

  const toggleFavorite = useCallback(async (productId) => {
    if (togglingFavRef.current.has(productId)) return
    if (token) {
      const exists = favorites.includes(productId)
      // Optimistic update
      setFavorites(prev => exists ? prev.filter(id => id !== productId) : [...prev, productId])
      togglingFavRef.current.add(productId)
      try {
        if (exists) {
          await removeFavorite(productId, token)
          toast.info('Removed from favorites')
        } else {
          await addFavorite(productId, token)
          toast.success('Added to favorites')
        }
        const items = await listFavorites(token)
        setFavorites(items.map(p => p._id))
      } catch (e) {
        // revert on error
        setFavorites(prev => exists ? [...prev, productId] : prev.filter(id => id !== productId))
        toast.error(e.message || 'Failed to update favorites')
      } finally {
        togglingFavRef.current.delete(productId)
      }
    } else {
      setFavorites(prev => {
        const exists = prev.includes(productId)
        const next = exists ? prev.filter(id => id !== productId) : [...prev, productId]
        toast[exists ? 'info' : 'success'](exists ? 'Removed from favorites' : 'Added to favorites')
        return next
      })
    }
  }, [token, favorites, toast])

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

  const value = useMemo(() => ({ cart, favorites, addToCart, removeFromCart, updateQty, toggleFavorite }), [cart, favorites, addToCart, removeFromCart, updateQty, toggleFavorite])
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export default ShopContext
