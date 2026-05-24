import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaHeartBroken, FaSpinner, FaShoppingCart } from 'react-icons/fa'
import { FiHeart } from 'react-icons/fi'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import { listFavorites } from '../services/favorites'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
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

  // Only fetch full item details on initial load or when favorites length changes significantly
  useEffect(() => {
    if (!token) {
      const t = setTimeout(() => {
        setItems([])
        setLoading(false)
        loadedRef.current = false
      }, 0)

      return () => clearTimeout(t)
    }

    // If we already loaded and the user removed favorites, no refetch needed.
    // If favorites increased (new items), refetch to get full product details.
    if (loadedRef.current && favorites.length <= items.length) return

    let active = true
    const t = setTimeout(() => {
      if (!active) return
      setLoading(true)
      listFavorites(token)
        .then(data => {
          if (active) {
            setItems(data)
            loadedRef.current = true
          }
        })
        .catch(err => console.error('Failed to load favorites:', err))
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      clearTimeout(t)
    }
  }, [token, favorites.length]) // Only depend on length, not the full array

  return (
    <div className="favorites-page">
      <Navbar />
      <div className="favorites-container">
        {loading ? (
          <div className="favorites-loading">
            <FaSpinner className="favorites-loading-icon" />
            <p>Loading your saved items...</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="favorites-empty-state">
            <FiHeart className="favorites-empty-icon" />
            <h2 className="favorites-empty-title">You haven't saved any items yet</h2>
            <p className="favorites-empty-text">
              Keep track of your favorite products by clicking the heart icon. Start browsing to find something you'll love!
            </p>
            <Link to="/products" className="favorites-empty-btn">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {visibleItems.map(p => (
              <div key={p._id} className="favorite-card">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(p._id);
                  }} 
                  className="favorite-remove-icon-btn"
                  title="Remove from favorites"
                >
                  <FaHeartBroken />
                </button>
                <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="favorite-image-wrapper">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="favorite-image" />
                    ) : (
                      <div className="favorite-image-placeholder">📦</div>
                    )}
                  </div>
                  <div className="favorite-content">
                    <h3 className="favorite-name">{p.name}</h3>

                    <div className="favorite-pricing">
                      {(() => {
                        const minBulkQty = p?.min_bulk_qty > 0 ? p.min_bulk_qty : 1
                        const bulkUnitPrice = p?.price_bulk || p?.retailer_price || p?.price
                        const hasBulkPricing = !!p?.price_bulk && minBulkQty > 1

                        if (retailerBulk && hasBulkPricing) {
                          return (
                            <>
                              <div className="favorite-price-row">
                                <span className="favorite-price">₹{bulkUnitPrice?.toLocaleString('en-IN')}</span>
                                <span className="favorite-price-strike">₹{p.price?.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="favorite-bulk-hint">Min bulk qty: {minBulkQty}</div>
                            </>
                          )
                        }

                        return (
                          <>
                            <div className="favorite-price">₹{p.price?.toLocaleString('en-IN')}</div>
                            {isRetailer && hasBulkPricing && (
                              <div className="favorite-bulk-hint">
                                Bulk pricing available in Retailer Mode (min {minBulkQty})
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    <div className="favorite-actions">
                      {(() => {
                        const minBulkQty = p?.min_bulk_qty > 0 ? p.min_bulk_qty : 1
                        const hasBulkPricing = !!p?.price_bulk && minBulkQty > 1
                        const canQuickAdd = !retailerBulk || !hasBulkPricing

                        return (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(p, 1);
                            }}
                            className="favorite-add-cart-btn"
                            disabled={!canQuickAdd}
                            title={!canQuickAdd ? `Minimum ${minBulkQty} units required in Retailer Mode` : undefined}
                          >
                            <FaShoppingCart /> {!canQuickAdd ? `Min Qty: ${minBulkQty}` : 'Move to Cart'}
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
