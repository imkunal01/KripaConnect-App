import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import { listFavorites } from '../services/favorites'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Favorites.css'

export default function Favorites() {
  const { token } = useContext(AuthContext)
  const { addToCart, toggleFavorite, favorites } = useContext(ShopContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

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
                  <div className="favorite-price">₹{p.price?.toLocaleString('en-IN')}</div>
                </Link>
                <div className="favorite-actions">
                  <button onClick={() => addToCart(p, 1)} className="favorite-add-cart-btn">
                    Add to Cart
                  </button>
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
