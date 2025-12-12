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
    <div className="dashboard-container">
      <Navbar />

      <main className="hero-section">
        <div className="hero-content">
          <h1>Premium Electronics<br />At Your Doorstep</h1>
          <p>Discover the latest gadgets, secure payments, and fast delivery.</p>
          
          {user ? (
            <div className="user-dashboard-card">
              <h3>Your Dashboard</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Role</label>
                  <span>{role}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{user.email}</span>
                </div>
              </div>
              {role === 'admin' && (
                <Link to="/admin" className="action-btn">Go to Admin Panel</Link>
              )}
            </div>
          ) : (
            <div className="cta-group">
              <Link to="/signup" state={{ from }} className="cta-btn primary">Get Started</Link>
              <Link to="/login" state={{ from }} className="cta-btn secondary">Sign In</Link>
            </div>
          )}
        </div>
      </main>

      <section style={{ padding: '0 32px 32px' }}>
        <h3>Categories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {categories.map(c => (
            <Link key={c._id} to={`/products?category=${c._id}`} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff' }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 32px 32px' }}>
        <h3>Trending Products</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {trending.map(p => (
            <div key={p._id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff' }}>
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
                <img src={p.images?.[0]?.url} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: '#333' }}>₹{p.price}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
