import { useContext, useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

// Visual Assets Matching Screenshot
import headerBag from '../assets/blinkitBag.jpg'
import bannerGraphic from '../assets/blinkitBanner.jpg'

// Real Vector SVG Icons (No Emojis)
import {
  LuShoppingBag,
  LuTv,
  LuFan,
  LuChefHat,
  LuLightbulb,
  LuCable,
  LuZap,
  LuPackage,
  LuShieldCheck,
  LuSearch,
  LuMic,
  LuMapPin,
  LuChevronDown,
  LuArrowRight,
  LuPlus,
  LuMinus,
  LuHeart,
  LuUser,
  LuX,
  LuSparkles,
  LuAward,
  LuCircleCheck
} from 'react-icons/lu'
import { FaHeart, FaShoppingCart } from 'react-icons/fa'

// Category Filter Items with REAL Vector Icons
const CATEGORIES = [
  { id: 'all', name: 'All', icon: LuShoppingBag },
  { id: 'tv_audio', name: 'TV & Audio', icon: LuTv, match: ['tv', 'audio', 'sound', 'entertainment'] },
  { id: 'fans', name: 'Fans & Air', icon: LuFan, match: ['fan', 'ventilation', 'air', 'cooler'] },
  { id: 'kitchen', name: 'Kitchen Tech', icon: LuChefHat, match: ['kitchen', 'mixer', 'cooking', 'kettle'] },
  { id: 'lighting', name: 'Lighting & LEDs', icon: LuLightbulb, match: ['light', 'led', 'tube'] },
  { id: 'electricals', name: 'Wires & Power', icon: LuCable, match: ['wiring', 'electrical', 'wire', 'surge', 'cable'] },
  { id: 'appliances', name: 'Appliances', icon: LuZap, match: ['home', 'appliances', 'iron', 'geyser'] },
  { id: 'b2b', name: 'B2B Wholesale', icon: LuPackage, match: ['bulk', 'wholesale', 'carton'] }
]

// Top Electronics & Appliance Brands
const BRANDS = [
  { name: 'boAt', tag: 'Smart Audio' },
  { name: 'Havells', tag: 'Fans & Wires' },
  { name: 'Sony', tag: 'Smart 4K TVs' },
  { name: 'Crompton', tag: 'BLDC Motors' },
  { name: 'Bajaj', tag: 'Kitchen Tech' },
  { name: 'Philips', tag: 'LED Lighting' },
  { name: 'Zebronics', tag: 'Surge Strips' },
  { name: 'Orient', tag: 'Ventilation' }
]

export default function Dashboard() {
  const { user, role, openAuthModal } = useAuth()
  const { mode } = usePurchaseMode()
  const navigate = useNavigate()
  const { cart, addToCart, updateQty, removeFromCart, favorites, toggleFavorite } = useContext(ShopContext)

  useEffect(() => {
    if (user && role === 'admin') navigate('/admin', { replace: true })
  }, [user, role, navigate])

  // Data states
  const [products, setProducts] = useState([])
  const [discountProducts, setDiscountProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Interactive UI states
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bannerSlide, setBannerSlide] = useState(0)

  // Refs for horizontal scrolling shelves
  const dealsScrollRef = useRef(null)
  const bestScrollRef = useRef(null)
  const tvScrollRef = useRef(null)
  const kitchenScrollRef = useRef(null)

  // Auto banner dots
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerSlide(prev => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Load products & categories
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const [cats, allRes, discountRes, bestRes] = await Promise.all([
          listCategories().catch(() => []),
          listProducts({ limit: 60 }).catch(() => ({ items: [] })),
          listProducts({ sort: 'price', limit: 16 }).catch(() => ({ items: [] })),
          listProducts({ sort: '-sold', limit: 16 }).catch(() => ({ items: [] }))
        ])

        if (!isMounted) return
        setProducts(allRes?.items || allRes || [])
        setDiscountProducts(discountRes?.items || discountRes || [])
        setBestSellers(bestRes?.items || bestRes || [])
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (err) {
        console.error('Failed to load store data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [])

  // Helpers
  function getImageUrl(p) {
    return p?.images?.[0]?.url || p?.image || ''
  }

  function formatPrice(num) {
    return (num ?? 0).toLocaleString('en-IN')
  }

  function getCartItemQty(productId) {
    if (!Array.isArray(cart)) return 0
    const item = cart.find(i => (i.productId === productId || i._id === productId))
    return item ? Number(item.qty || 0) : 0
  }

  // Calculate cart total count and price
  const cartSummary = useMemo(() => {
    if (!Array.isArray(cart) || cart.length === 0) return { count: 0, total: 0 }
    let count = 0
    let total = 0
    cart.forEach(item => {
      const q = Number(item.qty || 0)
      const p = Number(item.price || 0)
      count += q
      total += q * p
    })
    return { count, total }
  }, [cart])

  // Cart actions
  async function handleAddOne(product, e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const inStock = (product?.stock || 0) > 0
    if (!inStock) {
      toast.error('Item is out of stock')
      return
    }
    try {
      await addToCart(product, 1)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleIncrement(product, currentQty, e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const inStock = (product?.stock || 0) > 0
    if (!inStock || (product?.stock && currentQty >= product.stock)) {
      toast.error('Maximum stock reached')
      return
    }
    try {
      await updateQty(product._id || product.productId, currentQty + 1)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDecrement(product, currentQty, e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const pId = product._id || product.productId
    try {
      if (currentQty <= 1) {
        await removeFromCart(pId)
      } else {
        await updateQty(pId, currentQty - 1)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filter products by category matches
  const filterByKeywords = (items, keywords) => {
    return items.filter(p => {
      const catName = (p.category?.name || typeof p.category === 'string' ? p.category : '').toLowerCase()
      const prodName = (p.name || '').toLowerCase()
      const tags = (p.tags || []).join(' ').toLowerCase()
      return keywords.some(k => catName.includes(k) || prodName.includes(k) || tags.includes(k))
    })
  }

  // Categorized product shelves
  const tvProducts = useMemo(() => filterByKeywords(products, ['tv', 'audio', 'sound', 'entertainment']), [products])
  const fanProducts = useMemo(() => filterByKeywords(products, ['fan', 'ventilation', 'air', 'cooler']), [products])
  const kitchenProducts = useMemo(() => filterByKeywords(products, ['kitchen', 'mixer', 'cooking', 'kettle']), [products])
  const wholesaleProducts = useMemo(() => products.filter(p => p.retailer_price || p.price_bulk || p.min_bulk_qty > 1), [products])

  // Filtered view when search or non-all category is selected
  const activeFilteredProducts = useMemo(() => {
    if (selectedCategory === 'all' && !searchQuery.trim()) return []

    let list = [...products]

    if (selectedCategory === 'deals') {
      list = discountProducts.length > 0 ? discountProducts : list
    } else if (selectedCategory === 'b2b') {
      list = wholesaleProducts
    } else if (selectedCategory !== 'all') {
      const catObj = CATEGORIES.find(c => c.id === selectedCategory)
      if (catObj?.match) {
        list = filterByKeywords(products, catObj.match)
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q) ||
        p.tags?.some(t => String(t).toLowerCase().includes(q))
      )
    }

    return list
  }, [selectedCategory, searchQuery, products, discountProducts, wholesaleProducts])

  // Render Product Card exactly as shown in screenshot with Red Primary Accent
  const renderCard = (p) => {
    const inStock = (p.stock || 0) > 0
    const isFavorite = Array.isArray(favorites) && favorites.some(id => (typeof id === 'object' ? id._id : id) === p._id)
    const discount = Math.round(((p.price * 1.35) - p.price) / (p.price * 1.35) * 100) || 20
    const isRetailer = role === 'retailer' && mode === 'retailer'
    const currentPrice = isRetailer && p.retailer_price ? p.retailer_price : p.price
    const mrpPrice = Math.round((currentPrice || 1000) * 1.35)
    const cartQty = getCartItemQty(p._id)

    return (
      <div key={p._id} className="bk-shot-card" data-instock={inStock}>
        {/* Top Badges: Red Discount pill + Wishlist */}
        <div className="bk-shot-badge-row">
          {discount > 0 ? (
            <span className="bk-shot-discount-pill">{discount}% OFF</span>
          ) : <span />}

          <button
            type="button"
            className={`bk-shot-fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(p._id)
            }}
            aria-label="Wishlist"
          >
            {isFavorite ? <FaHeart style={{ color: '#FF3D3D' }} /> : <LuHeart />}
          </button>
        </div>

        {/* Product Media */}
        <Link to={`/product/${p._id}`} className="bk-shot-img-link">
          {getImageUrl(p) ? (
            <img
              src={getImageUrl(p)}
              alt={p.name}
              className="bk-shot-img"
              loading="lazy"
            />
          ) : (
            <div className="bk-shot-img-fallback">
              <LuPackage />
            </div>
          )}
        </Link>

        {/* Card Content */}
        <div className="bk-shot-content">
          <div className="bk-shot-title-row">
            <Link to={`/product/${p._id}`} className="bk-shot-title-link">
              <h4 className="bk-shot-title" title={p.name}>
                {p.name}
              </h4>
            </Link>
            <span className="bk-shot-weight">
              {p.min_bulk_qty > 1 ? `${p.min_bulk_qty} pcs` : '1 unit'}
            </span>
          </div>

          {/* Pricing & Circular Red Plus Button */}
          <div className="bk-shot-bottom-row">
            <div className="bk-shot-pricing">
              <span className="bk-shot-price">₹{formatPrice(currentPrice)}</span>
              <span className="bk-shot-mrp">₹{formatPrice(mrpPrice)}</span>
            </div>

            {/* Red Plus / Stepper Button */}
            <div className="bk-shot-action">
              {!inStock ? (
                <span className="bk-shot-out">Out</span>
              ) : cartQty === 0 ? (
                <button
                  type="button"
                  className="bk-shot-plus-circle"
                  onClick={(e) => handleAddOne(p, e)}
                  aria-label={`Add ${p.name}`}
                >
                  <LuPlus />
                </button>
              ) : (
                <div className="bk-shot-stepper">
                  <button
                    type="button"
                    className="bk-shot-step-btn"
                    onClick={(e) => handleDecrement(p, cartQty, e)}
                    aria-label="Decrease"
                  >
                    <LuMinus />
                  </button>
                  <span className="bk-shot-step-count">{cartQty}</span>
                  <button
                    type="button"
                    className="bk-shot-step-btn"
                    onClick={(e) => handleIncrement(p, cartQty, e)}
                    aria-label="Increase"
                  >
                    <LuPlus />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bk-shot-canvas">
      <SEO
        title="KripaConnect | 10-Minute Electronics & Appliance Sourcing"
        description="India's fastest electronics & appliances quick-commerce app. 10-minute express delivery to your doorstep."
        canonical="/"
      />

      <Navbar />

      <main className="bk-shot-main">
        <div className="bk-shot-container">

          {/* ========================================================================= */}
          {/* 1. TOP HEADER (Exact Screenshot Layout with Smart Red Cart Icon on Right)  */}
          {/* ========================================================================= */}
          <header className="bk-shot-header">
            <div className="bk-shot-header-left">
              <span className="bk-shot-deliver-to">Deliver to</span>
              <div className="bk-shot-location-picker">
                <strong>Delhi High Court, India Gate</strong>
                <LuChevronDown className="bk-shot-dropdown-icon" />
              </div>

              <div className="bk-shot-eta-row">
                <span className="bk-shot-eta-num">10</span>
                <span className="bk-shot-eta-lbl">Minutes</span>
              </div>

              <div className="bk-shot-guarantee-row">
                <span className="bk-shot-express-tag">Express Delivery</span>
                <span className="bk-shot-dot-sep">•</span>
                <div className="bk-shot-ontime-tag">
                  <LuShieldCheck className="bk-shot-shield-icon" />
                  <span>On-time Guarantee</span>
                </div>
              </div>
            </div>

            {/* Smart Cart Icon, Profile Avatar & 3D Shopping Bag */}
            <div className="bk-shot-header-right">
              <div className="bk-shot-header-actions">
                {/* Smart Cart Icon with Live Red Badge */}
                <Link to="/cart" className="bk-shot-header-cart-icon" aria-label="Shopping Cart">
                  <LuShoppingBag />
                  {cartSummary.count > 0 && (
                    <span className="bk-shot-header-cart-badge">{cartSummary.count}</span>
                  )}
                </Link>

                {/* Profile Shortcut */}
                <button
                  type="button"
                  className="bk-shot-header-profile-btn"
                  onClick={() => user ? navigate('/profile') : openAuthModal('login')}
                  aria-label="My Account"
                >
                  <LuUser />
                </button>
              </div>

              {/* 3D Shopping Bag Illustration */}
              <div className="bk-shot-bag-wrapper">
                <img src={headerBag} alt="Shopping Bag" className="bk-shot-bag-img" />
                <div className="bk-shot-bag-pin">
                  <LuMapPin />
                </div>
              </div>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* 2. SEARCH BAR WITH RED MIC BUTTON                                         */}
          {/* ========================================================================= */}
          <div className="bk-shot-search-wrapper">
            <LuSearch className="bk-shot-search-lens" />
            <input
              type="text"
              className="bk-shot-search-input"
              placeholder="Search for smart TVs, BLDC fans, mixers & more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
            />
            {searchQuery ? (
              <button
                type="button"
                className="bk-shot-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <LuX />
              </button>
            ) : (
              <button type="button" className="bk-shot-mic-btn" aria-label="Voice Search">
                <LuMic />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. TOP CATEGORY FILTER TABS (Real Vector Icons - Zero Emojis)              */}
          {/* ========================================================================= */}
          <div className="bk-shot-categories-scroll">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id
              const IconComp = cat.icon
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`bk-shot-cat-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setSearchQuery('')
                  }}
                >
                  <div className="bk-shot-cat-icon-box">
                    <IconComp className="bk-shot-cat-svg-icon" />
                  </div>
                  <span className="bk-shot-cat-name">{cat.name}</span>
                </button>
              )
            })}
          </div>

          {/* If Search is active or specific category is selected, show filtered grid */}
          {selectedCategory !== 'all' || searchQuery.trim() ? (
            <section className="bk-shot-filtered-section">
              <div className="bk-shot-section-head">
                <h3 className="bk-shot-section-title">
                  {searchQuery.trim()
                    ? `Results for "${searchQuery}"`
                    : CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Products'}
                </h3>
                <span className="bk-shot-count-lbl">({activeFilteredProducts.length} items)</span>
              </div>

              {loading ? (
                <ProductGridSkeleton count={6} />
              ) : activeFilteredProducts.length > 0 ? (
                <div className="bk-shot-grid">
                  {activeFilteredProducts.map((p) => renderCard(p))}
                </div>
              ) : (
                <div className="bk-shot-empty">
                  <LuPackage className="bk-shot-empty-icon" />
                  <h4>No products found</h4>
                  <p>Try a different keyword or category.</p>
                  <button
                    type="button"
                    className="bk-shot-reset-btn"
                    onClick={() => {
                      setSelectedCategory('all')
                      setSearchQuery('')
                    }}
                  >
                    View All Products
                  </button>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* 4. PROMO BANNER CAROUSEL (Warm Golden/Amber Banner in Screenshot)          */}
              {/* ========================================================================= */}
              <div className="bk-shot-promo-banner">
                <div className="bk-shot-banner-left">
                  <div className="bk-shot-banner-tag">
                    <LuSparkles /> <span>SPECIAL TECH FEST</span>
                  </div>
                  <h3 className="bk-shot-banner-headline">
                    Mega Tech Deals<br />Delivered to You
                  </h3>
                  <p className="bk-shot-banner-subtitle">
                    Celebrate with premium quality, brand warranty & best offers
                  </p>
                  <Link to="/products" className="bk-shot-banner-cta">
                    <span>Shop Now</span>
                    <LuArrowRight />
                  </Link>
                </div>

                <div className="bk-shot-banner-right">
                  <img
                    src={bannerGraphic}
                    alt="Festive tech deals"
                    className="bk-shot-banner-img"
                  />
                </div>

                {/* Banner Dots */}
                <div className="bk-shot-banner-dots">
                  {[0, 1, 2, 3].map((dot) => (
                    <span
                      key={dot}
                      className={`bk-shot-dot ${bannerSlide === dot ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 5. PHOTO-STORY CURATED BENTO GRID (Screenshot 2 Match)                    */}
              {/* ========================================================================= */}
              <section className="bk-story-section">
                <div className="bk-story-grid">
                  {/* Hero 2x1 Card: Smart 4K UHD TVs */}
                  <Link
                    to="/products?category=696e069a547ac33f254e7093"
                    className="bk-story-card bk-story-card--hero"
                  >
                    <div className="bk-story-overlay" />
                    <div className="bk-story-content">
                      <span className="bk-story-badge red">FLAGSHIP VISUALS</span>
                      <h4 className="bk-story-title">Smart 4K UHD Displays</h4>
                      <div className="bk-story-perks">
                        <span><LuCircleCheck /> 3-Yr OEM Warranty</span>
                        <span><LuCircleCheck /> Express Delivery</span>
                        <span><LuCircleCheck /> Free Wall Mount</span>
                      </div>
                    </div>
                    <div className="bk-story-icon-wrap">
                      <LuTv />
                    </div>
                  </Link>

                  {/* 1x1 Card: BLDC Ceiling Fans */}
                  <Link
                    to="/products?category=696e069b547ac33f254e70b0"
                    className="bk-story-card bk-story-card--compact teal"
                  >
                    <div className="bk-story-overlay" />
                    <div className="bk-story-content">
                      <span className="bk-story-badge">COOLING</span>
                      <h4 className="bk-story-title">BLDC Super Energy Fans</h4>
                    </div>
                    <div className="bk-story-icon-wrap">
                      <LuFan />
                    </div>
                  </Link>

                  {/* 1x1 Card: Heavy Kitchen Mixers */}
                  <Link
                    to="/products?category=696e069c547ac33f254e70cb"
                    className="bk-story-card bk-story-card--compact orange"
                  >
                    <div className="bk-story-overlay" />
                    <div className="bk-story-content">
                      <span className="bk-story-badge">KITCHEN</span>
                      <h4 className="bk-story-title">Heavy 750W Copper Mixers</h4>
                    </div>
                    <div className="bk-story-icon-wrap">
                      <LuChefHat />
                    </div>
                  </Link>

                  {/* 1x1 Card: Pure Copper Wiring Coils */}
                  <Link
                    to="/products?category=696e069e547ac33f254e7101"
                    className="bk-story-card bk-story-card--compact purple"
                  >
                    <div className="bk-story-overlay" />
                    <div className="bk-story-content">
                      <span className="bk-story-badge">POWER</span>
                      <h4 className="bk-story-title">Copper Wires & Surge Strips</h4>
                    </div>
                    <div className="bk-story-icon-wrap">
                      <LuCable />
                    </div>
                  </Link>

                  {/* 1x1 Card: B2B Wholesale Packs */}
                  <Link
                    to="/b2b"
                    className="bk-story-card bk-story-card--compact blue"
                  >
                    <div className="bk-story-overlay" />
                    <div className="bk-story-content">
                      <span className="bk-story-badge gold">WHOLESALE</span>
                      <h4 className="bk-story-title">B2B Master Carton Lots</h4>
                    </div>
                    <div className="bk-story-icon-wrap">
                      <LuPackage />
                    </div>
                  </Link>
                </div>
              </section>

              {/* ========================================================================= */}
              {/* 6. SHELF 1: "Festive Specials" (Horizontal Scrolling Row)                 */}
              {/* ========================================================================= */}
              <section className="bk-shot-shelf-section">
                <div className="bk-shot-shelf-header">
                  <h3 className="bk-shot-shelf-title">Festive Specials</h3>
                  <Link to="/products?sort=price" className="bk-shot-see-all">
                    <span>See all</span>
                    <LuArrowRight />
                  </Link>
                </div>

                <div className="bk-shot-shelf-wrapper">
                  <div className="bk-shot-shelf-row" ref={dealsScrollRef}>
                    {discountProducts.length > 0 ? (
                      discountProducts.map((p) => renderCard(p))
                    ) : (
                      products.slice(0, 6).map((p) => renderCard(p))
                    )}
                  </div>
                </div>
              </section>

              {/* ========================================================================= */}
              {/* 7. 4-COLUMN CATEGORY ESSENTIALS MATRIX (Screenshot 3 phone #1 Match)      */}
              {/* ========================================================================= */}
              <section className="bk-matrix-section">
                <div className="bk-shot-shelf-header">
                  <h3 className="bk-shot-shelf-title">Explore Store Categories</h3>
                  <Link to="/categories" className="bk-shot-see-all">
                    <span>View all</span>
                    <LuArrowRight />
                  </Link>
                </div>

                <div className="bk-matrix-grid">
                  <Link to="/products?category=696e069a547ac33f254e7093" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box coral"><LuTv /></div>
                    <span className="bk-matrix-label">Smart TVs</span>
                  </Link>

                  <Link to="/products?category=696e069b547ac33f254e70b0" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box emerald"><LuFan /></div>
                    <span className="bk-matrix-label">BLDC Fans</span>
                  </Link>

                  <Link to="/products?category=696e069c547ac33f254e70cb" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box amber"><LuChefHat /></div>
                    <span className="bk-matrix-label">Mixer Grinders</span>
                  </Link>

                  <Link to="/products?category=696e069e547ac33f254e7101" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box indigo"><LuCable /></div>
                    <span className="bk-matrix-label">Wires & Power</span>
                  </Link>

                  <Link to="/products" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box yellow"><LuLightbulb /></div>
                    <span className="bk-matrix-label">LED Lighting</span>
                  </Link>

                  <Link to="/products" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box teal"><LuZap /></div>
                    <span className="bk-matrix-label">Appliances</span>
                  </Link>

                  <Link to="/b2b" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box blue"><LuPackage /></div>
                    <span className="bk-matrix-label">Wholesale Packs</span>
                  </Link>

                  <Link to="/products?sort=price" className="bk-matrix-item">
                    <div className="bk-matrix-icon-box rose"><LuSparkles /></div>
                    <span className="bk-matrix-label">Flash Steals</span>
                  </Link>
                </div>
              </section>

              {/* ========================================================================= */}
              {/* 8. SHELF 2: "Best Sellers" (Horizontal Scrolling Row)                     */}
              {/* ========================================================================= */}
              <section className="bk-shot-shelf-section">
                <div className="bk-shot-shelf-header">
                  <h3 className="bk-shot-shelf-title">Best Sellers</h3>
                  <Link to="/products" className="bk-shot-see-all">
                    <span>See all</span>
                    <LuArrowRight />
                  </Link>
                </div>

                <div className="bk-shot-shelf-wrapper">
                  <div className="bk-shot-shelf-row" ref={bestScrollRef}>
                    {bestSellers.length > 0 ? (
                      bestSellers.map((p) => renderCard(p))
                    ) : (
                      products.slice(6, 12).map((p) => renderCard(p))
                    )}
                  </div>
                </div>
              </section>

              {/* ========================================================================= */}
              {/* 9. SHOP BY TOP BRANDS STRIP (Screenshot 3 style)                          */}
              {/* ========================================================================= */}
              <section className="bk-brands-section">
                <div className="bk-shot-shelf-header">
                  <h3 className="bk-shot-shelf-title">Shop by Top Brands</h3>
                </div>

                <div className="bk-brands-scroll">
                  {BRANDS.map((b) => (
                    <Link
                      key={b.name}
                      to={`/products?search=${encodeURIComponent(b.name)}`}
                      className="bk-brand-card"
                    >
                      <strong className="bk-brand-name">{b.name}</strong>
                      <span className="bk-brand-tag">{b.tag}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* ========================================================================= */}
              {/* 10. SHELF 3: "Kitchen & Cooking Essentials"                               */}
              {/* ========================================================================= */}
              {kitchenProducts.length > 0 && (
                <section className="bk-shot-shelf-section">
                  <div className="bk-shot-shelf-header">
                    <h3 className="bk-shot-shelf-title">Kitchen & Cooking Essentials</h3>
                    <Link to="/products" className="bk-shot-see-all">
                      <span>See all</span>
                      <LuArrowRight />
                    </Link>
                  </div>

                  <div className="bk-shot-shelf-wrapper">
                    <div className="bk-shot-shelf-row" ref={kitchenScrollRef}>
                      {kitchenProducts.map((p) => renderCard(p))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 11. FLOATING BOTTOM RED CART PILL (Appears when items are in cart)         */}
      {/* ========================================================================= */}
      {cartSummary.count > 0 && (
        <div className="bk-shot-floating-cart-anchor">
          <Link to="/cart" className="bk-shot-floating-cart-bar" aria-label="View Cart">
            <div className="bk-shot-cart-left">
              <div className="bk-shot-cart-bag">
                <FaShoppingCart />
              </div>
              <div className="bk-shot-cart-info">
                <span className="bk-shot-cart-count">
                  {cartSummary.count} {cartSummary.count === 1 ? 'ITEM' : 'ITEMS'}
                </span>
                <span className="bk-shot-cart-total">₹{formatPrice(cartSummary.total)}</span>
              </div>
            </div>

            <div className="bk-shot-cart-right">
              <span>View Cart</span>
              <LuArrowRight />
            </div>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  )
}
