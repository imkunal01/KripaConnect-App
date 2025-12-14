import { useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        if (token) {
          const data = await listFavorites(token)
          if (active) setItems(data)
        } else {
          setItems([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [token, favorites])

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
        ) : items.length === 0 ? (
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
            {items.map(p => (
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
