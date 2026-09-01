import { Link, useNavigate } from 'react-router-dom'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import './Dashboard.css'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import { listCategories } from '../services/categories'
import { listProducts } from '../services/products'
import ShopContext from '../context/ShopContext.jsx'
import { ProductGridSkeleton } from '../components/SkeletonLoader.jsx'
import toast from 'react-hot-toast'

// Icons
import {
  FiArrowRight,
  FiArrowUpRight,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiHeadphones,
  FiZap,
  FiTrendingUp,
  FiClock,
  FiSearch,
  FiBox,
  FiCheckCircle,
  FiPercent,
  FiStar,
  FiShoppingBag,
  FiHeart,
  FiChevronRight,
  FiAward,
  FiLayers,
  FiCpu,
  FiSend
} from 'react-icons/fi'
import { FaHeart, FaShoppingCart, FaFire, FaBolt, FaStar } from 'react-icons/fa'

// Assets
import heroimg from '../assets/auntyvibing.png'
import heroimg2 from '../assets/heroimg.png'

export default function Dashboard() {
  const { user, role, openAuthModal } = useAuth()
  const { mode, setMode } = usePurchaseMode()
  const navigate = useNavigate()
  const { addToCart, favorites, toggleFavorite } = useContext(ShopContext)

  useEffect(() => {
    if (user && role === 'admin') navigate('/admin', { replace: true })
  }, [user, role, navigate])

  const [products, setProducts] = useState([])
  const [discountProducts, setDiscountProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Interactive UI States
  const [heroTab, setHeroTab] = useState('trending') // 'trending' | 'deal' | 'wholesale'
  const [catalogTab, setCatalogTab] = useState('trending') // 'trending' | 'deals' | 'bestsellers' | 'new'
  const [searchQuery, setSearchQuery] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [addingId, setAddingId] = useState(null)

  // Flash Vault Live Countdown (Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 42, seconds: 18 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 12, minutes: 0, seconds: 0 } // reset cycle
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, newestRes, discountRes, bestRes] = await Promise.all([
          listCategories().catch(() => []),
          listProducts({ sort: '-createdAt', limit: 12 }).catch(() => ({ items: [] })),
          listProducts({ sort: 'price', limit: 8 }).catch(() => ({ items: [] })),
          listProducts({ sort: '-sold', limit: 12 }).catch(() => ({ items: [] }))
        ])

        const newestItems = newestRes?.items || newestRes || []
        const discountItems = discountRes?.items || discountRes || []
        const bestItems = bestRes?.items || bestRes || []

        setProducts(newestItems)
        setDiscountProducts(discountItems)
        setBestSellers(bestItems)
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (err) {
        console.error('Dashboard load failed', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Helper getters
  function getImageUrl(p) {
    return p?.images?.[0]?.url || ''
  }

  function formatPrice(num) {
    return (num ?? 0).toLocaleString('en-IN')
  }

  // Active Hero Product based on chosen Hero Tab (prefer items with high image quality / price)
  const activeHeroProduct = useMemo(() => {
    const prominentItems = (products.length > 0 ? products : bestSellers).filter(p => (p.price || 0) > 100)
    const fallbackList = products.length > 0 ? products : bestSellers
    
    if (heroTab === 'deal') {
      return discountProducts.find(p => (p.price || 0) > 50) || discountProducts[0] || fallbackList[0] || null
    }
    if (heroTab === 'wholesale') {
      return bestSellers.find(p => p.retailer_price || p.price_bulk) || bestSellers[1] || fallbackList[1] || fallbackList[0] || null
    }
    return prominentItems[0] || bestSellers[0] || fallbackList[0] || null
  }, [heroTab, bestSellers, discountProducts, products])

  // Active Flash Vault Product
  const flashVaultProduct = useMemo(() => {
    const prominent = products.filter(p => (p.price || 0) > 200)
    return prominent[0] || discountProducts.find(p => (p.price || 0) > 100) || products[0] || null
  }, [discountProducts, products])

  // Dynamic Vault Savings calculation
  const vaultSavings = useMemo(() => {
    if (!flashVaultProduct?.price) return 1200
    return Math.round(flashVaultProduct.price * 0.35) || 500
  }, [flashVaultProduct])

  // Filtered Catalog items based on catalogTab
  const displayedCatalogProducts = useMemo(() => {
    switch (catalogTab) {
      case 'deals':
        return discountProducts.length > 0 ? discountProducts : products
      case 'bestsellers':
        return bestSellers.length > 0 ? bestSellers : products
      case 'new':
        return products
      case 'trending':
      default:
        return bestSellers.length > 0 ? bestSellers.slice(0, 8) : products.slice(0, 8)
    }
  }, [catalogTab, products, discountProducts, bestSellers])

  // Cart Add Handler
  async function handleAddToCart(product, e) {
    if (e) e.stopPropagation()
    const inStock = (product?.stock || 0) > 0
    if (!inStock) {
      toast.error('Item is currently out of stock')
      return
    }
    setAddingId(product._id)
    try {
      await addToCart(product, 1)
      toast.success(`${product.name} added to cart!`, { icon: '🛒' })
    } catch (err) {
      console.error(err)
    } finally {
      setAddingId(null)
    }
  }

  // Search Submit
  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Newsletter Submit
  function handleNewsletterSubmit(e) {
    e.preventDefault()
    if (newsletterEmail.trim() && newsletterEmail.includes('@')) {
      setNewsletterSubscribed(true)
      toast.success('🎉 Welcome to VIP Club! Use code VIP500 at checkout.', { duration: 5000 })
    } else {
      toast.error('Please enter a valid email address')
    }
  }

  return (
    <div className="dash-canvas">
      <SEO
        title="KripaConnect® | Next-Gen Tech Commerce & Wholesale Ecosystem"
        description="Experience out-of-the-box electronics shopping and B2B direct wholesale pricing. High quality, verified warranty, pan-India fast shipping."
        canonical="/"
      />

      <Navbar />

      <main className="dash-main-flow">
        {/* ========================================================================= */}
        {/* 1. NEXT-GEN FULL-BLEED HERO SPOTLIGHT STAGE                                */}
        {/* ========================================================================= */}
        <section className="dash-hero-stage">
          {/* Ambient Cyber Light Gradients */}
          <div className="dash-hero-glow-1" aria-hidden="true" />
          <div className="dash-hero-glow-2" aria-hidden="true" />
          <div className="dash-hero-grid-pattern" aria-hidden="true" />

          <div className="dash-hero-content-wrap">
            {/* Left Editorial Narrative */}
            <div className="dash-hero-narrative">
              <div className="dash-hero-pulse-chip">
                <span className="dash-pulse-dot" />
                <span className="dash-pulse-text">DIRECT OEM SOURCING • PAN-INDIA EXPRESS FREIGHT</span>
                <span className="dash-pulse-tag">NEW v2.0</span>
              </div>

              <h1 className="dash-hero-headline">
                THE FUTURE OF <br />
                <span className="dash-gradient-text">TECH COMMERCE.</span>
              </h1>

              <p className="dash-hero-lead">
                Transforming how India buys consumer electronics and wholesale inventory. Direct-from-manufacturer pricing, transparent GST invoicing, and verified OEM warranty.
              </p>

              {/* In-Hero Quick Search Bar */}
              <form className="dash-hero-search-bar" onSubmit={handleSearchSubmit}>
                <FiSearch className="dash-search-icon" />
                <input
                  type="text"
                  placeholder="Search 4,000+ smart TVs, kitchen tech, bulk lots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dash-search-input"
                />
                <button type="submit" className="dash-search-btn">
                  Search
                </button>
              </form>

              {/* Quick Filter Tag Pills */}
              <div className="dash-hero-tag-pills">
                <span className="dash-tag-label">Trending:</span>
                <Link to="/products?category=696e069a547ac33f254e7093" className="dash-tag-pill">Smart Audio</Link>
                <Link to="/products?category=696e069b547ac33f254e70b0" className="dash-tag-pill">Home Tech</Link>
                <Link to="/products?category=696e069c547ac33f254e70cb" className="dash-tag-pill">Kitchen Appliances</Link>
                <Link to="/b2b" className="dash-tag-pill dash-tag-pill--highlight">B2B Wholesale</Link>
              </div>

              {/* Action Buttons */}
              <div className="dash-hero-actions">
                <Link to="/products" className="dash-btn-glow">
                  <span>Explore Full Catalog</span>
                  <FiArrowRight className="dash-btn-icon" />
                </Link>

                <Link to="/b2b" className="dash-btn-cyber">
                  <FiBox />
                  <span>Retailer Wholesale Hub</span>
                </Link>
              </div>

              {/* Real-time Metric Badges */}
              <div className="dash-hero-metrics-bar">
                <div className="dash-metric-item">
                  <div className="dash-metric-number">4,500+</div>
                  <div className="dash-metric-desc">Verified Products</div>
                </div>
                <div className="dash-metric-separator" />
                <div className="dash-metric-item">
                  <div className="dash-metric-number">24H</div>
                  <div className="dash-metric-desc">Express Dispatch</div>
                </div>
                <div className="dash-metric-separator" />
                <div className="dash-metric-item">
                  <div className="dash-metric-number">100%</div>
                  <div className="dash-metric-desc">OEM Genuine</div>
                </div>
                <div className="dash-metric-separator" />
                <div className="dash-metric-item">
                  <div className="dash-metric-number">₹0</div>
                  <div className="dash-metric-desc">GST Claim Friction</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Holo-Stage */}
            <div className="dash-hero-showcase">
              {/* Stage Switcher Controls */}
              <div className="dash-stage-controls" role="tablist">
                <button
                  className={`dash-stage-tab ${heroTab === 'trending' ? 'active' : ''}`}
                  onClick={() => setHeroTab('trending')}
                  type="button"
                >
                  <FaFire className="dash-tab-icon fire" />
                  <span>Flagship Drop</span>
                </button>
                <button
                  className={`dash-stage-tab ${heroTab === 'deal' ? 'active' : ''}`}
                  onClick={() => setHeroTab('deal')}
                  type="button"
                >
                  <FaBolt className="dash-tab-icon bolt" />
                  <span>Flash Steal</span>
                </button>
                <button
                  className={`dash-stage-tab ${heroTab === 'wholesale' ? 'active' : ''}`}
                  onClick={() => setHeroTab('wholesale')}
                  type="button"
                >
                  <FiBox className="dash-tab-icon" />
                  <span>B2B Hot Pick</span>
                </button>
              </div>

              {/* 3D Holo-Card */}
              <div className="dash-holo-card">
                <div className="dash-holo-glass-bg" />
                <div className="dash-holo-radial" />

                {/* Floating Badges */}
                <div className="dash-holo-badge-row">
                  <span className="dash-holo-badge-status">
                    <span className="dash-badge-dot" />
                    {heroTab === 'trending' ? 'TOP TRENDING' : heroTab === 'deal' ? '50% FLASH VALUE' : 'B2B BULK LOT'}
                  </span>

                  <div className="dash-holo-rating">
                    <FaStar className="dash-star-icon" />
                    <span>4.9 (1.2k+ Reviews)</span>
                  </div>
                </div>

                {/* Main Visual Display */}
                <div className="dash-holo-visual-wrap">
                  {activeHeroProduct ? (
                    <Link to={`/product/${activeHeroProduct._id}`} className="dash-holo-link">
                      <img
                        src={getImageUrl(activeHeroProduct) || heroimg}
                        alt={activeHeroProduct.name}
                        className="dash-holo-img"
                      />
                    </Link>
                  ) : (
                    <img src={heroimg} alt="Featured Tech" className="dash-holo-img" />
                  )}

                  {/* Ambient Base Shadow */}
                  <div className="dash-holo-pedestal" />
                </div>

                {/* Product Detail Info & Instant Add */}
                <div className="dash-holo-footer">
                  <div className="dash-holo-info">
                    <span className="dash-holo-category">
                      {heroTab === 'wholesale' ? 'B2B Wholesale Lot' : 'Consumer Flagship'}
                    </span>
                    <h3 className="dash-holo-title">
                      {activeHeroProduct?.name || 'Ultra HD 4K Smart Audio Display'}
                    </h3>

                    <div className="dash-holo-price-row">
                      <span className="dash-holo-price">
                        ₹{activeHeroProduct ? formatPrice(activeHeroProduct.price) : '24,999'}
                      </span>
                      {activeHeroProduct?.price && (
                        <span className="dash-holo-mrp">
                          ₹{formatPrice(Math.round(activeHeroProduct.price * 1.35))}
                        </span>
                      )}
                      <span className="dash-holo-save">Save 35%</span>
                    </div>
                  </div>

                  <div className="dash-holo-action-col">
                    {activeHeroProduct ? (
                      <button
                        type="button"
                        className="dash-holo-add-btn"
                        onClick={(e) => handleAddToCart(activeHeroProduct, e)}
                        disabled={addingId === activeHeroProduct._id}
                      >
                        <FaShoppingCart />
                        <span>{addingId === activeHeroProduct._id ? 'Adding...' : 'Quick Add'}</span>
                      </button>
                    ) : (
                      <Link to="/products" className="dash-holo-add-btn">
                        <span>View Deal</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Live Stock Meter Indicator */}
                <div className="dash-holo-stock-bar">
                  <div className="dash-stock-label-row">
                    <span>🔥 High Demand</span>
                    <span>92% Units Claimed</span>
                  </div>
                  <div className="dash-stock-track">
                    <div className="dash-stock-fill" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. KINETIC INFINITE MARQUEE RIBBON (100vw Edge-to-Edge)                    */}
        {/* ========================================================================= */}
        <div className="dash-marquee-bar" aria-hidden="true">
          <div className="dash-marquee-track">
            {[1, 2, 3].map((loopIndex) => (
              <div key={loopIndex} className="dash-marquee-group">
                <span className="dash-marquee-item">
                  <FiZap className="dash-marquee-icon glow" />
                  <strong>SAME-DAY DISPATCH</strong> ON ORDERS BEFORE 2PM
                </span>
                <span className="dash-marquee-dot">•</span>
                <span className="dash-marquee-item">
                  <FiBox className="dash-marquee-icon" />
                  <strong>DIRECT OEM & BULK PRICING</strong> FOR RETAILERS
                </span>
                <span className="dash-marquee-dot">•</span>
                <span className="dash-marquee-item">
                  <FiShield className="dash-marquee-icon" />
                  <strong>100% VERIFIED</strong> BRAND WARRANTY
                </span>
                <span className="dash-marquee-dot">•</span>
                <span className="dash-marquee-item">
                  <FiTruck className="dash-marquee-icon" />
                  <strong>PAN-INDIA</strong> FREIGHT & FAST COURIER
                </span>
                <span className="dash-marquee-dot">•</span>
                <span className="dash-marquee-item">
                  <FiRefreshCw className="dash-marquee-icon" />
                  <strong>7-DAY HASSLE-FREE</strong> REPLACEMENT
                </span>
                <span className="dash-marquee-dot">•</span>
                <span className="dash-marquee-item">
                  <FiPercent className="dash-marquee-icon glow" />
                  <strong>AUTOMATED GST INVOICING</strong> & TAX CREDITS
                </span>
                <span className="dash-marquee-dot">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. ASYMMETRICAL BENTO CATEGORY MATRIX                                      */}
        {/* ========================================================================= */}
        <section className="dash-bento-section">
          <div className="dash-section-header-wide">
            <div className="dash-section-headline-group">
              <span className="dash-section-kicker">CURATED ECOSYSTEM</span>
              <h2 className="dash-section-title">EXPLORE BY CATEGORY MATRIX</h2>
              <p className="dash-section-desc">Engineered for precision browsing across consumer tech, home appliances, and bulk trade lines.</p>
            </div>
            <Link to="/categories" className="dash-view-all-link">
              <span>View All Categories</span>
              <FiArrowUpRight />
            </Link>
          </div>

          <div className="dash-bento-grid">
            {/* Bento 1: Large Featured Entertainment & Visual (2x2) */}
            <Link
              to="/products?category=696e069a547ac33f254e7093"
              className="dash-bento-card dash-bento--hero"
            >
              <div className="dash-bento-ambient-glow" />
              <div className="dash-bento-content">
                <span className="dash-bento-pill">Flagship Visuals</span>
                <h3 className="dash-bento-title">TV, Audio & Entertainment</h3>
                <p className="dash-bento-text">
                  Cinematic Smart 4K OLEDs, heavy bass soundbars, theater-grade audio, and stage setups.
                </p>
                <div className="dash-bento-stats">
                  <span>140+ Models</span>
                  <span className="dash-bento-arrow-circle"><FiArrowRight /></span>
                </div>
              </div>
              <div className="dash-bento-media">
                <img src={heroimg2} alt="Entertainment" className="dash-bento-img" />
              </div>
            </Link>

            {/* Bento 2: Smart Kitchen & Home Appliances (Wide 2x1) */}
            <Link
              to="/products?category=696e069c547ac33f254e70cb"
              className="dash-bento-card dash-bento--wide"
            >
              <div className="dash-bento-content">
                <span className="dash-bento-pill">Essential Living</span>
                <h3 className="dash-bento-title">Smart Kitchen & Cooking</h3>
                <p className="dash-bento-text">Commercial mixies, induction cooktops, heavy duty air fryers & blenders.</p>
                <div className="dash-bento-tags">
                  <span className="dash-mini-tag">Mixers</span>
                  <span className="dash-mini-tag">Induction</span>
                  <span className="dash-mini-tag">Juicers</span>
                </div>
              </div>
              <div className="dash-bento-corner-icon">🍳</div>
            </Link>

            {/* Bento 3: B2B Wholesale Lots & Combos (Tall 1x2) */}
            <Link
              to="/b2b"
              className="dash-bento-card dash-bento--tall"
            >
              <div className="dash-bento-badge-pulse">WHOLESALE EXCLUSIVE</div>
              <div className="dash-bento-content">
                <span className="dash-bento-pill dash-bento-pill--gold">B2B Trade Vault</span>
                <h3 className="dash-bento-title">Deals, Combos & Bulk Wholesale</h3>
                <p className="dash-bento-text">
                  Direct master carton lots with tiered volume pricing, GST invoices & freight insurance.
                </p>
                <div className="dash-bento-perks-list">
                  <div className="dash-perk-line"><FiCheckCircle /> Up to 40% Margin</div>
                  <div className="dash-perk-line"><FiCheckCircle /> Pallet & Carton Lots</div>
                  <div className="dash-perk-line"><FiCheckCircle /> Instant GST Input Credit</div>
                </div>
                <div className="dash-bento-cta-bar">
                  <span>Enter Wholesale Desk</span>
                  <FiArrowRight />
                </div>
              </div>
            </Link>

            {/* Bento 4: Home Ventilation & Fans */}
            <Link
              to="/products?category=696e069b547ac33f254e70b0"
              className="dash-bento-card dash-bento--medium"
            >
              <div className="dash-bento-content">
                <span className="dash-bento-pill">Climate & Air</span>
                <h3 className="dash-bento-title">Fans & Home Appliances</h3>
                <p className="dash-bento-text">Exhaust fans, BLDC high speed ceiling fans, water heaters & irons.</p>
              </div>
              <div className="dash-bento-corner-icon">🌀</div>
            </Link>

            {/* Bento 5: Electricals & Power Solutions */}
            <Link
              to="/products?category=696e069e547ac33f254e7101"
              className="dash-bento-card dash-bento--medium"
            >
              <div className="dash-bento-content">
                <span className="dash-bento-pill">Power & Grid</span>
                <h3 className="dash-bento-title">Electricals & Smart Power</h3>
                <p className="dash-bento-text">Surge protectors, modular switches, heavy inverters & LED fixtures.</p>
              </div>
              <div className="dash-bento-corner-icon">⚡</div>
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. DYNAMIC CATALOG MATRIX WITH LIVE FILTER TABS                           */}
        {/* ========================================================================= */}
        <section className="dash-catalog-section">
          <div className="dash-section-header-wide">
            <div className="dash-section-headline-group">
              <span className="dash-section-kicker">LIVE INVENTORY PULSE</span>
              <h2 className="dash-section-title">CURATED HARDWARE DROPS</h2>
              <p className="dash-section-desc">Real-time dynamic feed directly synced with central warehouse availability.</p>
            </div>

            {/* Filter Tabs */}
            <div className="dash-catalog-tabs" role="tablist">
              <button
                type="button"
                className={`dash-catalog-tab ${catalogTab === 'trending' ? 'active' : ''}`}
                onClick={() => setCatalogTab('trending')}
              >
                <FaFire /> <span>Trending Now</span>
              </button>
              <button
                type="button"
                className={`dash-catalog-tab ${catalogTab === 'deals' ? 'active' : ''}`}
                onClick={() => setCatalogTab('deals')}
              >
                <FaBolt /> <span>Flash Steals</span>
              </button>
              <button
                type="button"
                className={`dash-catalog-tab ${catalogTab === 'bestsellers' ? 'active' : ''}`}
                onClick={() => setCatalogTab('bestsellers')}
              >
                <FiStar /> <span>Top Rated</span>
              </button>
              <button
                type="button"
                className={`dash-catalog-tab ${catalogTab === 'new' ? 'active' : ''}`}
                onClick={() => setCatalogTab('new')}
              >
                <FiZap /> <span>Fresh Arrivals</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="dash-catalog-grid" aria-busy={loading ? 'true' : 'false'}>
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : displayedCatalogProducts.length > 0 ? (
              displayedCatalogProducts.map((p) => {
                const inStock = (p.stock || 0) > 0
                const isFavorite = Array.isArray(favorites) && favorites.some(id => (typeof id === 'object' ? id._id : id) === p._id)
                const discount = Math.round(((p.price * 1.3) - p.price) / (p.price * 1.3) * 100) || 25
                const isRetailer = role === 'retailer' && mode === 'retailer'

                return (
                  <div key={p._id} className="dash-product-card">
                    {/* Glass Badges */}
                    <div className="dash-card-badge-row">
                      <span className="dash-card-discount-pill">
                        <FaFire /> {discount}% OFF
                      </span>

                      <button
                        type="button"
                        className={`dash-card-wish-btn ${isFavorite ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(p._id)
                        }}
                        aria-label="Toggle Wishlist"
                      >
                        {isFavorite ? <FaHeart style={{ color: '#FF3D3D' }} /> : <FiHeart />}
                      </button>
                    </div>

                    {/* Media */}
                    <Link to={`/product/${p._id}`} className="dash-card-media-stage">
                      {getImageUrl(p) ? (
                        <img
                          src={getImageUrl(p)}
                          alt={p.name}
                          className="dash-card-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="dash-card-fallback-box">
                          <FiBox />
                        </div>
                      )}

                      {/* Stock pill */}
                      <div className={`dash-card-stock-pill ${inStock ? 'in-stock' : 'out-stock'}`}>
                        <span className="dash-stock-dot" />
                        <span>{inStock ? `${p.stock} in Stock` : 'Backorder'}</span>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="dash-card-info">
                      <div className="dash-card-category-meta">
                        <span>{p.category?.name || 'Electronics'}</span>
                        <div className="dash-card-stars">
                          <FaStar /> <span>5.0</span>
                        </div>
                      </div>

                      <Link to={`/product/${p._id}`} className="dash-card-name-link">
                        <h4 className="dash-card-name" title={p.name}>
                          {p.name}
                        </h4>
                      </Link>

                      {/* Price Matrix */}
                      <div className="dash-card-price-matrix">
                        <div className="dash-card-price-main">
                          <span className="dash-price-symbol">₹</span>
                          <span className="dash-price-val">
                            {isRetailer && p.retailer_price ? formatPrice(p.retailer_price) : formatPrice(p.price)}
                          </span>
                        </div>

                        <span className="dash-card-price-mrp">
                          ₹{formatPrice(Math.round((p.price || 1000) * 1.3))}
                        </span>

                        {isRetailer && (
                          <span className="dash-card-b2b-tag">B2B Bulk Rate</span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="dash-card-actions-wrap">
                        <button
                          type="button"
                          className="dash-card-add-button"
                          onClick={(e) => handleAddToCart(p, e)}
                          disabled={!inStock || addingId === p._id}
                        >
                          <FaShoppingCart />
                          <span>
                            {!inStock ? 'Out of Stock' : addingId === p._id ? 'Adding...' : 'Add to Cart'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="dash-empty-state">
                <FiBox className="dash-empty-icon" />
                <p>No products available right now. Check back shortly!</p>
              </div>
            )}
          </div>

          <div className="dash-catalog-footer-cta">
            <Link to="/products" className="dash-btn-glow">
              <span>View All 4,000+ Hardware Products</span>
              <FiArrowRight />
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. "FLASH VAULT" DEAL OF THE DAY (Asymmetrical Split Section)             */}
        {/* ========================================================================= */}
        <section className="dash-vault-section">
          <div className="dash-vault-container">
            <div className="dash-vault-ambient-red" aria-hidden="true" />
            
            <div className="dash-vault-left">
              <div className="dash-vault-badge">
                <FaBolt /> <span>FLASH VAULT • EXCLUSIVE DROP</span>
              </div>

              <h2 className="dash-vault-heading">
                LIMITED-TIME <br />
                <span className="dash-vault-highlight">PRICE CRASH EVENT</span>
              </h2>

              <p className="dash-vault-sub">
                Massive manufacturer-subsidized deal expiring strictly when the countdown hits zero or stock depletes.
              </p>

              {/* Live Countdown Timer */}
              <div className="dash-countdown-row" aria-label="Deal countdown">
                <div className="dash-countdown-card">
                  <span className="dash-countdown-num">0{timeLeft.hours}</span>
                  <span className="dash-countdown-lbl">HOURS</span>
                </div>
                <span className="dash-countdown-colon">:</span>
                <div className="dash-countdown-card">
                  <span className="dash-countdown-num">{timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}</span>
                  <span className="dash-countdown-lbl">MINUTES</span>
                </div>
                <span className="dash-countdown-colon">:</span>
                <div className="dash-countdown-card dash-countdown-card--active">
                  <span className="dash-countdown-num">{timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}</span>
                  <span className="dash-countdown-lbl">SECONDS</span>
                </div>
              </div>

              {/* Stock Depletion Urgency Bar */}
              <div className="dash-vault-urgency">
                <div className="dash-urgency-labels">
                  <span>⚡ <strong>84% Sold Out</strong></span>
                  <span>Only <strong>14 units</strong> remaining</span>
                </div>
                <div className="dash-urgency-track">
                  <div className="dash-urgency-fill" style={{ width: '84%' }} />
                </div>
              </div>

              {/* Vault CTAs */}
              <div className="dash-vault-action-row">
                {flashVaultProduct ? (
                  <button
                    type="button"
                    className="dash-vault-claim-btn"
                    onClick={(e) => handleAddToCart(flashVaultProduct, e)}
                    disabled={addingId === flashVaultProduct._id}
                  >
                    <FaShoppingCart />
                    <span>Claim Deal for ₹{formatPrice(flashVaultProduct.price)}</span>
                  </button>
                ) : (
                  <Link to="/products" className="dash-vault-claim-btn">
                    <span>Claim Deal Now</span>
                  </Link>
                )}

                <Link to="/products?sort=price" className="dash-vault-explore-link">
                  <span>Explore More Steals</span>
                  <FiChevronRight />
                </Link>
              </div>
            </div>

            <div className="dash-vault-right">
              <div className="dash-vault-card-stage">
                <div className="dash-vault-saving-badge">
                  <span>SAVE</span>
                  <strong>₹{formatPrice(vaultSavings)}</strong>
                </div>

                <div className="dash-vault-img-wrap">
                  <img
                    src={getImageUrl(flashVaultProduct) || heroimg}
                    alt={flashVaultProduct?.name || 'Vault Special'}
                    className="dash-vault-img"
                  />
                </div>

                <div className="dash-vault-meta">
                  <div className="dash-vault-product-name">
                    {flashVaultProduct?.name || 'Heavy Duty Industrial Exhaust Ventilation System'}
                  </div>
                  <div className="dash-vault-specs-chips">
                    <span>⚡ 100% Copper Core</span>
                    <span>🛡️ 2-Year Warranty</span>
                    <span>📦 Free Next-Day Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. B2B RETAILER & WHOLESALE POWERHOUSE COMMAND HUB                        */}
        {/* ========================================================================= */}
        <section className="dash-b2b-powerhouse">
          <div className="dash-b2b-wrap">
            <div className="dash-b2b-header-row">
              <div className="dash-b2b-narrative">
                <span className="dash-b2b-kicker">WHOLESALE & RETAILER ECOSYSTEM</span>
                <h2 className="dash-b2b-title">
                  POWERING 5,000+ TECH RETAILERS ACROSS INDIA
                </h2>
                <p className="dash-b2b-desc">
                  Eliminate distributors and middlemen. Source genuine electronic goods, appliances, and components straight from certified manufacturers with transparent GST invoicing.
                </p>
              </div>

              <div className="dash-b2b-cta-group">
                <Link to="/b2b" className="dash-btn-b2b-primary">
                  <FiBox />
                  <span>Launch Wholesale Portal</span>
                </Link>
                <Link to="/signup" className="dash-btn-b2b-outline">
                  Register as Retailer
                </Link>
              </div>
            </div>

            {/* 4 Feature Pillars */}
            <div className="dash-b2b-pillars-grid">
              <div className="dash-pillar-card">
                <div className="dash-pillar-icon"><FiPercent /></div>
                <h3 className="dash-pillar-title">Tiered Volume Pricing</h3>
                <p className="dash-pillar-text">
                  Save up to 45% when ordering full cartons, master packs, or pallets with zero MOQ barriers.
                </p>
              </div>

              <div className="dash-pillar-card">
                <div className="dash-pillar-icon"><FiCheckCircle /></div>
                <h3 className="dash-pillar-title">Automated GST Invoicing</h3>
                <p className="dash-pillar-text">
                  Instant B2B tax receipts with your registered GSTIN for hassle-free 100% input tax credit (ITC).
                </p>
              </div>

              <div className="dash-pillar-card">
                <div className="dash-pillar-icon"><FiTruck /></div>
                <h3 className="dash-pillar-title">Insured Heavy Freight</h3>
                <p className="dash-pillar-text">
                  Dedicated road freight & express courier networks with real-time tracking directly to your shop.
                </p>
              </div>

              <div className="dash-pillar-card">
                <div className="dash-pillar-icon"><FiHeadphones /></div>
                <h3 className="dash-pillar-title">Dedicated Account Desk</h3>
                <p className="dash-pillar-text">
                  Personal B2B relationship manager on WhatsApp and call for bulk quotes and warranty claims.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. TRUST & VALUE PROPOSITION MATRIX                                       */}
        {/* ========================================================================= */}
        <section className="dash-trust-section">
          <div className="dash-trust-grid">
            <div className="dash-trust-card">
              <div className="dash-trust-icon-box"><FiTruck /></div>
              <div className="dash-trust-content">
                <h4 className="dash-trust-title">Pan-India Tracked Logistics</h4>
                <p className="dash-trust-text">Fast dispatch from multi-hub state warehouses with doorstep delivery.</p>
              </div>
            </div>

            <div className="dash-trust-card">
              <div className="dash-trust-icon-box"><FiShield /></div>
              <div className="dash-trust-content">
                <h4 className="dash-trust-title">100% OEM Original</h4>
                <p className="dash-trust-text">Direct manufacturer sourcing with verified brand warranty cards.</p>
              </div>
            </div>

            <div className="dash-trust-card">
              <div className="dash-trust-icon-box"><FiRefreshCw /></div>
              <div className="dash-trust-content">
                <h4 className="dash-trust-title">7-Day Easy Replacement</h4>
                <p className="dash-trust-text">Zero-friction replacement guarantee for damaged or defective items.</p>
              </div>
            </div>

            <div className="dash-trust-card">
              <div className="dash-trust-icon-box"><FiHeadphones /></div>
              <div className="dash-trust-content">
                <h4 className="dash-trust-title">24/7 Priority Support</h4>
                <p className="dash-trust-text">Dedicated human support via WhatsApp, phone, and ticket desk.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. VERIFIED CUSTOMER REVIEWS & COMMUNITY PULSE                            */}
        {/* ========================================================================= */}
        <section className="dash-reviews-section">
          <div className="dash-section-header-wide">
            <div className="dash-section-headline-group">
              <span className="dash-section-kicker">VERIFIED EXPERIENCES</span>
              <h2 className="dash-section-title">WHAT BUYERS & RETAILERS SAY</h2>
              <p className="dash-section-desc">Real reviews from individual homeowners, technicians, and store owners.</p>
            </div>
          </div>

          <div className="dash-reviews-grid">
            <div className="dash-review-card">
              <div className="dash-review-stars">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="dash-review-body">
                “Sourcing exhaust fans and kitchen appliances in bulk has never been this smooth. Genuine products, fast dispatch, and instant GST invoices!”
              </p>
              <div className="dash-review-author">
                <div className="dash-author-avatar">RK</div>
                <div className="dash-author-info">
                  <strong>Rajesh Kumar</strong>
                  <span>Electronics Retailer • Jaipur</span>
                </div>
                <span className="dash-verified-badge"><FiCheckCircle /> Verified Buyer</span>
              </div>
            </div>

            <div className="dash-review-card">
              <div className="dash-review-stars">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="dash-review-body">
                “Ordered a 43-inch Smart TV and a mixer grinder for home. Delivered in 48 hours in wooden crate packing. Superb quality and unbeatable prices!”
              </p>
              <div className="dash-review-author">
                <div className="dash-author-avatar">PS</div>
                <div className="dash-author-info">
                  <strong>Pooja Sharma</strong>
                  <span>Homeowner • New Delhi</span>
                </div>
                <span className="dash-verified-badge"><FiCheckCircle /> Verified Buyer</span>
              </div>
            </div>

            <div className="dash-review-card">
              <div className="dash-review-stars">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="dash-review-body">
                “The B2B margin structure allowed my shop to compete with big online platforms. Excellent customer service team and genuine warranty.”
              </p>
              <div className="dash-review-author">
                <div className="dash-author-avatar">AM</div>
                <div className="dash-author-info">
                  <strong>Amit Mehta</strong>
                  <span>Hardware Distributor • Pune</span>
                </div>
                <span className="dash-verified-badge"><FiCheckCircle /> Verified Buyer</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. VIP PERKS & NEWSLETTER DROP LOUNGE                                     */}
        {/* ========================================================================= */}
        <section className="dash-newsletter-section">
          <div className="dash-newsletter-card">
            <div className="dash-newsletter-glow" aria-hidden="true" />
            
            <div className="dash-newsletter-content">
              <span className="dash-newsletter-pill">VIP MEMBERSHIP</span>
              <h2 className="dash-newsletter-title">
                GET ₹500 OFF YOUR FIRST ORDER & EARLY ACCESS TO WHOLESALE DROPS
              </h2>
              <p className="dash-newsletter-desc">
                Join 25,000+ tech lovers and business owners getting flash sale alerts, wholesale lot previews, and exclusive discount codes.
              </p>

              {newsletterSubscribed ? (
                <div className="dash-newsletter-success">
                  <FiCheckCircle className="dash-success-icon" />
                  <div>
                    <strong>You're on the VIP list!</strong>
                    <p>Use code <code>VIP500</code> at checkout to redeem your welcome discount.</p>
                  </div>
                </div>
              ) : (
                <form className="dash-newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="dash-newsletter-input"
                  />
                  <button type="submit" className="dash-newsletter-btn">
                    <span>Join VIP Club</span>
                    <FiSend />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
