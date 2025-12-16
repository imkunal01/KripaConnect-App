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
  const navigate = useNavigate()
  
  // Auth Redirect Logic
  useEffect(() => {
    if (user && role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, role, navigate])

  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods] = await Promise.all([
          listCategories().catch(() => []),
          listProducts({ sort: '-createdAt', limit: 8 }).catch(() => ({ items: [] }))
        ])
        setCategories(Array.isArray(cats) ? cats : [])
        setTrending(prods.items || [])
      } catch (err) {
        console.error("Dashboard load failed", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const query = e.target.search.value.trim()
    if (query) navigate(`/products?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="modern-dashboard">
      <Navbar />

      <main className="main-content">
        {/* Modern Split Hero */}
        <header className="brand-hero">
          <div className="hero-backdrop" />
          <div className="container hero-layout">
            <div className="hero-text">
              <span className="badge-new">New Collection 2024</span>
              <h1>Next Gen <span className="text-gradient">Tech</span></h1>
              <p>Upgrade your setup with the world's most advanced electronics. Fast shipping, authenticated quality.</p>
              
              <form onSubmit={handleSearch} className="search-bar-wrapper">
                <input 
                  type="text" 
                  name="search" 
                  placeholder="What are you looking for?" 
                  autoComplete="off"
                />
                <button type="submit" aria-label="Search">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
              </form>
            </div>
            
            {/* Abstract visual decoration */}
            <div className="hero-visual">
              <div className="glass-card float-animation">
                <div className="icon-box">⚡</div>
                <div>
                  <strong>Fast Delivery</strong>
                  <small>Within 24 Hours</small>
                </div>
              </div>
              <div className="circle-blur"></div>
            </div>
          </div>
        </header>

        {/* Horizontal Category Rail */}
        <section className="section-container">
          <div className="section-header">
            <h3>Explore Categories</h3>
            <Link to="/categories" className="link-subtle">View All &rarr;</Link>
          </div>
          
          <div className="category-rail">
            {loading ? (
              <div className="skeleton-pill"></div>
            ) : (
              categories.map(c => (
                <Link key={c._id} to={`/products?category=${c._id}`} className="category-pill">
                  <span className="cat-emoji">📦</span>
                  <span>{c.name}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Masonry-style Product Grid */}
        <section className="section-container bg-offset">
          <div className="section-header">
            <h3>Trending Now</h3>
            <Link to="/products" className="btn-outline">Shop All</Link>
          </div>

          <div className="product-grid-modern">
            {loading ? <p>Loading deals...</p> : trending.map(p => (
              <Link key={p._id} to={`/product/${p._id}`} className="modern-card">
                <div className="card-image-container">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.name} loading="lazy" />
                  ) : (
                    <div className="placeholder-img">📷</div>
                  )}
                  <div className="card-overlay">
                    <span className="btn-view">View Details</span>
                  </div>
                </div>
                <div className="card-details">
                  <div className="card-meta">
                    <h4>{p.name}</h4>
                    <span className="price">₹{p.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <small className="category-tag">Electronics</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}