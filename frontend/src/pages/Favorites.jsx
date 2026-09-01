import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiHeart,
  FiShoppingBag,
  FiTrash2,
  FiArrowRight,
  FiPlus,
  FiCheck
} from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import { listFavorites } from '../services/favorites'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import { ProductGridSkeleton } from '../components/SkeletonLoader.jsx'
import toast from 'react-hot-toast'
import './Favorites.css'

export default function Favorites() {
  const { token } = useContext(AuthContext)
  const { addToCart, toggleFavorite, favorites } = useContext(ShopContext)
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const isRetailer = role === 'retailer'
  const retailerBulk = isRetailer && mode === 'retailer'

  const visibleItems = useMemo(() => {
    if (!token) return []
    const favSet = new Set(favorites)
    return items.filter(p => favSet.has(p._id))
  }, [token, favorites, items])

  useEffect(() => {
    if (!token) {
      setItems([])
      setLoading(false)
      loadedRef.current = false
      return
    }

    if (loadedRef.current && favorites.length <= items.length) return

    let active = true
    setLoading(true)
    listFavorites(token)
      .then(data => {
        if (active) {
          setItems(Array.isArray(data) ? data : [])
          loadedRef.current = true
        }
      })
      .catch(err => console.error('Failed to load favorites:', err))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [token, favorites.length])

  const handleMoveToCart = async (product) => {
    const minQty = retailerBulk ? (product.min_bulk_qty || 1) : 1
    await addToCart(product, minQty)
    toast.success(`Added ${product.name} to cart!`, { icon: '🛒' })
  }

  return (
    <div className="favorites-page">
      <SEO
        title="Saved Wishlist & Favorites | KripaConnect"
        description="View and manage your favorite electronics, appliances, and saved products on KripaConnect."
        canonical="/favorites"
        robots="noindex, follow"
      />
      <Navbar />

      <main className="favorites-container">
        {/* Header */}
        <header className="favorites-header">
          <div>
            <span className="favorites-eyebrow">Saved Wishlist</span>
            <h1 className="favorites-title">Your Favorite Products</h1>
            <p className="favorites-subtitle">
              Quickly re-visit and purchase the appliances and gadgets you have saved.
            </p>
          </div>
          <span className="favorites-count-badge">
            {visibleItems.length} {visibleItems.length === 1 ? 'saved item' : 'saved items'}
          </span>
        </header>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : visibleItems.length === 0 ? (
          <div className="favorites-empty-card">
            <div className="favorites-empty-icon-wrap">
              <FiHeart />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Save items you are interested in by tapping the heart icon on any product card.</p>
            <Link to="/products" className="favorites-empty-cta">
              <FiShoppingBag /> Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {visibleItems.map(p => {
              const inStock = (p.stock || 0) > 0
              const priceNum = Number(p.price) || 0
              const bulkPrice = Number(p.price_bulk || p.retailer_price || p.price) || 0
              const minBulkQty = p?.min_bulk_qty > 0 ? p.min_bulk_qty : 1

              return (
                <article key={p._id} className="favorite-card">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(p._id)
                      toast.success(`Removed "${p.name}" from wishlist`)
                    }}
                    className="favorite-remove-btn"
                    title="Remove from favorites"
                    aria-label={`Remove ${p.name} from wishlist`}
                  >
                    <FaHeart className="favorite-heart-active" />
                  </button>

                  <Link to={`/product/${p._id}`} className="favorite-img-link">
                    <div className="favorite-img-wrap">
                      <img
                        src={p.images?.[0]?.url || 'https://via.placeholder.com/200'}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </Link>

                  <div className="favorite-body">
                    <div className="favorite-cat">
                      {p.Category?.name || (typeof p.category_id === 'object' ? p.category_id?.name : 'Electronics')}
                    </div>

                    <Link to={`/product/${p._id}`} className="favorite-name-link">
                      <h3 className="favorite-name" title={p.name}>{p.name}</h3>
                    </Link>

                    <div className="favorite-pricing-row">
                      {retailerBulk ? (
                        <div className="favorite-price-group">
                          <span className="favorite-price">₹{bulkPrice.toLocaleString('en-IN')}</span>
                          <span className="favorite-strike">₹{priceNum.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="favorite-price">₹{priceNum.toLocaleString('en-IN')}</span>
                      )}

                      <span className={`favorite-stock-dot ${inStock ? 'is-in' : 'is-out'}`}>
                        {inStock ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>

                    {retailerBulk && minBulkQty > 1 && (
                      <div className="favorite-min-bulk">Min order: {minBulkQty} units</div>
                    )}

                    <div className="favorite-actions">
                      <button
                        type="button"
                        className="favorite-btn-add"
                        disabled={!inStock}
                        onClick={() => handleMoveToCart(p)}
                      >
                        <FiShoppingBag /> Move to Cart
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
