import { Link, useNavigate } from 'react-router-dom'
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
  
  useEffect(() => {
    if (user && role === 'admin') navigate('/admin', { replace: true })
  }, [user, role, navigate])

  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  const [deals, setDeals] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)

  // Mock Hero Slides
  const slides = [
    { id: 1, title: "Big Sale Festival", subtitle: "Up to 80% Off on Electronics", color: "#111", bg: "#FF3D3D" },
    { id: 2, title: "New Collection", subtitle: "Discover the latest trends", color: "#333", bg: "#f3f4f6" },
    { id: 3, title: "Home Essentials", subtitle: "Upgrade your living space", color: "#fff", bg: "#10b981" }
  ]

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods, dealProds, bestProds] = await Promise.all([
          listCategories().catch(() => []),
          listProducts({ sort: '-createdAt', limit: 8 }).catch(() => ({ items: [] })),
          listProducts({ sort: 'price', limit: 5 }).catch(() => ({ items: [] })), // Low price as "deals"
          listProducts({ sort: '-sold', limit: 8 }).catch(() => ({ items: [] })) // Sold count (mock)
        ])
        setCategories(Array.isArray(cats) ? cats : [])
        setTrending(prods.items || [])
        setDeals(dealProds.items || [])
        setBestSellers(bestProds.items || [])
      } catch (err) {
        console.error("Dashboard load failed", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="pop-dashboard">
      <Navbar />

      <main className="pop-container">
        {/* --- Hero Slider --- */}
        <section className="hero-slider">
          {slides.map((slide, idx) => (
            <div 
              key={slide.id} 
              className={`slide-item ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundColor: slide.bg }}
            >
              <div className="slide-content">
                <h2 style={{ color: idx === 0 ? 'white' : slide.color }}>{slide.title}</h2>
                <p style={{ color: idx === 0 ? 'rgba(255,255,255,0.9)' : slide.color }}>{slide.subtitle}</p>
                <Link to="/products" className={`btn-slide ${idx === 0 ? 'btn-white' : 'btn-red'}`}>
                  Shop Now
                </Link>
              </div>
            </div>
          ))}
          <div className="slide-dots">
            {slides.map((_, idx) => (
              <span 
                key={idx} 
                className={`dot ${idx === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(idx)}
              />
            ))}
          </div>
        </section>

        {/* --- Shop by Category (Circle UI) --- */}
        <section className="section-block categories-row">
          <div className="cat-grid-circles">
            {loading ? <div className="skeleton-circle"></div> : categories.map((c) => (
              <Link key={c._id} to={`/products?category=${c._id}`} className="cat-circle-item">
                <div className="cat-circle">
                  {/* Mock icon/image based on name first char */}
                  <span className="cat-char">{c.name.charAt(0)}</span>
                </div>
                <span className="cat-label">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* --- Deal of the Day --- */}
        <section className="deal-section">
          <div className="section-header-row">
            <div className="deal-title-box">
              <h2>Deal of the Day</h2>
              <div className="countdown-timer">
                <span>08</span>:<span>45</span>:<span>12</span>
              </div>
            </div>
            <Link to="/products" className="view-all-link">View All</Link>
          </div>
          <div className="products-scroll-row">
            {deals.map((p) => (
              <Link key={p._id} to={`/product/${p._id}`} className="product-card-compact">
                <div className="img-box">
                  {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.name} /> : '📷'}
                </div>
                <div className="compact-details">
                  <span className="deal-badge">Up to 40% off</span>
                  <p className="compact-name">{p.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- Bank/Offer Banner --- */}
        <section className="promo-banner">
          <div className="promo-content">
            <h3>HDFC Bank Offer</h3>
            <p>10% Instant Discount on Credit Cards</p>
          </div>
          <div className="promo-content secondary">
            <h3>Free Shipping</h3>
            <p>On all orders above ₹499</p>
          </div>
        </section>

        {/* --- Best Sellers (Horizontal Scroll) --- */}
        <section className="section-block">
          <div className="section-header">
            <h2>Best Sellers</h2>
            <Link to="/products?sort=-sold" className="btn-link">See All</Link>
          </div>
          <div className="products-scroll-row">
            {loading ? <p>Loading...</p> : bestSellers.map((p) => (
              <Link key={p._id} to={`/product/${p._id}`} className="product-card-std">
                <div className="std-img">
                  {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.name} /> : '📷'}
                </div>
                <div className="std-details">
                  <h4>{p.name}</h4>
                  <div className="std-price">
                    <span className="curr-price">₹{p.price?.toLocaleString('en-IN')}</span>
                    {p.price && <span className="old-price">₹{(p.price * 1.2).toFixed(0)}</span>}
                  </div>
                  <button className="btn-add-sm">Add</button>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- New Arrivals (Grid) --- */}
        <section className="section-block">
          <div className="section-header">
            <h2>New Arrivals</h2>
            <Link to="/products" className="btn-link">View All</Link>
          </div>
          <div className="product-grid-dense">
            {loading ? <p>Loading...</p> : trending.map((p) => (
              <Link key={p._id} to={`/product/${p._id}`} className="product-card-dense">
                <div className="dense-img">
                  {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.name} /> : '📷'}
                </div>
                <div className="dense-info">
                  <h4>{p.name}</h4>
                  <div className="dense-rating">⭐⭐⭐⭐☆ (42)</div>
                  <div className="dense-price-row">
                    <span className="price-lg">₹{p.price?.toLocaleString('en-IN')}</span>
                    <span className="discount-tag">20% off</span>
                  </div>
                  <div className="delivery-tag">FREE Delivery by Tomorrow</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* --- Bottom Features --- */}
        <section className="features-strip">
           <div className="feature-item">
             <div className="feature-icon">🚚</div>
             <div className="feature-text">
               <h4>Fast Delivery</h4>
               <p>Cheaper & faster</p>
             </div>
           </div>
           <div className="feature-item">
             <div className="feature-icon">💳</div>
             <div className="feature-text">
               <h4>Secure Payment</h4>
               <p>100% secure</p>
             </div>
           </div>
           <div className="feature-item">
             <div className="feature-icon">🛡️</div>
             <div className="feature-text">
               <h4>Quality Guarantee</h4>
               <p>Verified sellers</p>
             </div>
           </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
