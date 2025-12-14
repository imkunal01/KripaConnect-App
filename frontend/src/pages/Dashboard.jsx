import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import './Dashboard.css'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { listCategories } from '../services/categories'
import { listProducts } from '../services/products'

export default function Dashboard() {
  const { user, role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  // We'll pass the current location to the login page so it knows where to return
  const from = location.pathname || '/'

  useEffect(() => {
    if (user && role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, role, navigate])

  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  useEffect(() => {
    async function loadHome() {
      const cats = await listCategories().catch(() => [])
      setCategories(Array.isArray(cats) ? cats : [])
      const prods = await listProducts({ sort: '-createdAt', limit: 8 }).catch(() => ({ items: [] }))
      setTrending(prods.items || [])
    }
    loadHome()
  }, [])

  return (
    <div className="dashboard-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Premium Electronics<br />At Your Doorstep</h1>
            <p>Discover the latest gadgets, secure payments, and fast delivery. Shop with confidence.</p>
            
            {/* Search Bar - Hero Focus */}
            <form onSubmit={(e) => {
              e.preventDefault()
              const query = e.target.search.value.trim()
              if (query) navigate(`/products?search=${encodeURIComponent(query)}`)
            }}>
              <div className="hero-search-container">
                <input
                  name="search"
                  type="text"
                  placeholder="Search for products..."
                  className="hero-search-input"
                />
                <button type="submit" className="hero-search-button">
                  Search
                </button>
              </div>
            </form>

            <div className="hero-cta-group">
              <Link to="/products" className="hero-cta-primary">
                Shop Products
              </Link>
              <Link to="/categories" className="hero-cta-secondary">
                View Deals
              </Link>
            </div>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="hero-image">
            <div className="hero-image-placeholder">
              <span style={{ fontSize: '4rem', opacity: 0.5 }}>📱</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          {categories.map(c => (
            <Link
              key={c._id}
              to={`/products?category=${c._id}`}
              className="category-card"
            >
              <div className="category-icon">📦</div>
              <div className="category-name">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="trending-section">
        <h2>Trending Products</h2>
        <div className="trending-grid">
          {trending.map(p => (
            <Link
              key={p._id}
              to={`/product/${p._id}`}
              className="trending-product-card"
            >
              <div className="trending-product-image">
                {p.images?.[0]?.url ? (
                  <img
                    src={p.images[0].url}
                    alt={p.name}
                  />
                ) : (
                  <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
                )}
              </div>
              <div className="trending-product-name">{p.name}</div>
              <div className="trending-product-price">₹{p.price?.toLocaleString('en-IN')}</div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
