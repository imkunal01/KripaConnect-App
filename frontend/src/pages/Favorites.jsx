import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
        <div className="favorites-header">
          <h1 className="favorites-title">My Favorites</h1>
          <p className="favorites-subtitle">Your saved products for later purchase</p>
        </div>

        {loading ? (
          <div className="favorites-loading">
            <div className="favorites-loading-icon">⏳</div>
            <p style={{ color: '#6b7280' }}>Loading favorites...</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="favorites-empty-state">
            <div className="favorites-empty-icon">❤️</div>
            <h2 className="favorites-empty-title">No favorites yet</h2>
            <p className="favorites-empty-text">
              Start adding products to your favorites to see them here
            </p>
            <Link to="/products" className="hero-cta-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {visibleItems.map(p => (
              <div key={p._id} className="favorite-card">
                <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="favorite-image">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} />
                    ) : (
                      <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
                    )}
                  </div>
                  <div className="favorite-name">{p.name}</div>

                  {(() => {
                    const minBulkQty = p?.min_bulk_qty > 0 ? p.min_bulk_qty : 1
                    const bulkUnitPrice = p?.price_bulk || p?.retailer_price || p?.price
                    const hasBulkPricing = !!p?.price_bulk && minBulkQty > 1

                    if (retailerBulk && hasBulkPricing) {
                      return (
                        <>
                          <div className="favorite-price-row">
                            <span className="favorite-price-strike">₹{p.price?.toLocaleString('en-IN')}</span>
                            <span className="favorite-price">₹{bulkUnitPrice?.toLocaleString('en-IN')}</span>
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
                </Link>
                <div className="favorite-actions">
                  {(() => {
                    const minBulkQty = p?.min_bulk_qty > 0 ? p.min_bulk_qty : 1
                    const hasBulkPricing = !!p?.price_bulk && minBulkQty > 1
                    const canQuickAdd = !retailerBulk || !hasBulkPricing

                    return (
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="favorite-add-cart-btn"
                        disabled={!canQuickAdd}
                        title={!canQuickAdd ? `Minimum ${minBulkQty} units required in Retailer Mode` : undefined}
                      >
                        {!canQuickAdd ? `Min ${minBulkQty}` : 'Add to Cart'}
                      </button>
                    )
                  })()}
                  <button onClick={() => toggleFavorite(p._id)} className="favorite-remove-btn">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
