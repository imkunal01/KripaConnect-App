import { useCallback, useEffect, useMemo, useState, useContext } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { listProducts } from '../services/products'
import { listCategories } from '../services/categories'
import { listSubcategories } from '../services/subcategories'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import { ProductGridSkeleton } from '../components/SkeletonLoader.jsx'
import toast from 'react-hot-toast'
import './Products.css'

// Vector Icons (No Emojis)
import {
  LuArrowLeft,
  LuSearch,
  LuSlidersHorizontal,
  LuChevronDown,
  LuX,
  LuPlus,
  LuMinus,
  LuHeart,
  LuStar,
  LuClock,
  LuShoppingBag,
  LuPackage,
  LuCheck,
  LuArrowRight,
  LuLayoutGrid,
  LuTruck,
  LuArrowUpDown
} from 'react-icons/lu'
import { FaHeart, FaShoppingCart, FaStar } from 'react-icons/fa'

// Curated Sort Options with descriptive labels
const SORT_OPTIONS = [
  { value: '', label: 'Popular & Relevant', shortLabel: 'Popular', desc: 'Curated by popularity and trending customer orders' },
  { value: 'price', label: 'Price: Low to High', shortLabel: 'Price: Low-High', desc: 'Most affordable budget products first' },
  { value: '-price', label: 'Price: High to Low', shortLabel: 'Price: High-Low', desc: 'Premium flagship & higher capacity models first' },
  { value: '-sold', label: 'Top Rated & Bestsellers', shortLabel: 'Top Rated', desc: 'Highest reviewed and top selling products' },
  { value: '-createdAt', label: 'Newest Arrivals', shortLabel: 'Newest', desc: 'Recently added electronics and appliances' }
]

// Brands for the "Shop by brands" section
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

export default function Products() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  const { cart, addToCart, updateQty, removeFromCart, favorites, toggleFavorite } = useContext(ShopContext)

  // Data states
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)

  // URL Params
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const subcategory = params.get('subcategory') || ''
  const sort = params.get('sort') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const ratingFilter = params.get('rating') || ''
  const inStockFilter = params.get('inStock') || ''

  const [searchInput, setSearchInput] = useState(search)

  const currentSortObj = useMemo(() => {
    return SORT_OPTIONS.find(o => o.value === sort) || SORT_OPTIONS[0]
  }, [sort])

  const hasActiveFilters = Boolean(category || subcategory || sort || minPrice || maxPrice || inStockFilter)

  const handleClearAllFilters = () => {
    updateParams({
      category: '',
      subcategory: '',
      sort: '',
      minPrice: '',
      maxPrice: '',
      inStock: ''
    })
  }

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // Load Categories & Subcategories
  useEffect(() => {
    Promise.all([
      listCategories().catch(() => []),
      listSubcategories().catch(() => [])
    ]).then(([catList, subList]) => {
      setCategories(Array.isArray(catList) ? catList : [])
      setSubcategories(Array.isArray(subList) ? subList : [])
    })
  }, [])

  // Fetch Products
  useEffect(() => {
    let isMounted = true
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await listProducts({
          search,
          category,
          subcategory,
          sort,
          minPrice,
          maxPrice,
          limit: 48
        })
        if (!isMounted) return
        setItems(data?.items || data || [])
      } catch (err) {
        console.error('Failed to load products:', err)
        if (isMounted) setItems([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 200)

    return () => {
      isMounted = false
      clearTimeout(t)
    }
  }, [search, category, subcategory, sort, minPrice, maxPrice])

  // Helpers
  const updateParams = useCallback((newParams) => {
    const next = new URLSearchParams(params)
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === null) {
        next.delete(k)
      } else {
        next.set(k, String(v))
      }
    })
    setParams(next)
  }, [params, setParams])

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

  // Cart summary
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

  function handleSearchSubmit(e) {
    e.preventDefault()
    updateParams({ search: searchInput.trim() })
  }

  // Filtered in-memory items (for client-side fast chips)
  const displayedItems = useMemo(() => {
    let list = [...items]
    if (inStockFilter === 'true') {
      list = list.filter(p => (p.stock || 0) > 0)
    }
    return list
  }, [items, inStockFilter])

  const selectedCategoryObj = categories.find(c => c._id === category)

  return (
    <div className="bk-prod-canvas">
      <SEO
        title={selectedCategoryObj ? `${selectedCategoryObj.name} | KripaConnect` : search ? `"${search}" - KripaConnect` : 'All Products | KripaConnect'}
        description="Browse genuine consumer electronics, appliances, and wholesale components with 10-15 minute delivery."
        canonical="/products"
      />

      <Navbar />

      <main className="bk-prod-main">
        <div className="bk-prod-container">

          {/* ========================================================================= */}
          {/* 1. BLINKIT SEARCH & BACK HEADER (Screenshot 3 phone #2)                  */}
          {/* ========================================================================= */}
          <div className="bk-prod-top-header">
            <button
              type="button"
              className="bk-prod-back-btn"
              onClick={() => {
                if (window.history?.state?.idx > 0) {
                  navigate(-1)
                } else {
                  navigate('/')
                }
              }}
              aria-label="Go Back"
            >
              <LuArrowLeft />
            </button>

            <form onSubmit={handleSearchSubmit} className="bk-prod-search-form">
              <LuSearch className="bk-prod-search-ico" />
              <input
                type="text"
                className="bk-prod-search-input"
                placeholder='Search electronics, fans, appliances...'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="bk-prod-search-clear"
                  onClick={() => {
                    setSearchInput('')
                    updateParams({ search: '' })
                  }}
                  aria-label="Clear"
                >
                  <LuX />
                </button>
              )}
            </form>

            <Link to="/cart" className="bk-prod-cart-link" aria-label="Cart">
              <LuShoppingBag />
              {cartSummary.count > 0 && (
                <span className="bk-prod-cart-count-badge">{cartSummary.count}</span>
              )}
            </Link>
          </div>

          {/* Active Query Title & Count */}
          <div className="bk-prod-result-title-bar">
            <h1 className="bk-prod-result-headline">
              {search.trim()
                ? `Showing results for "${search}"`
                : selectedCategoryObj
                ? selectedCategoryObj.name
                : 'All Products & Categories'}
            </h1>
            <span className="bk-prod-result-count">({displayedItems.length} items)</span>
          </div>

          {/* ========================================================================= */}
          {/* 1. DEDICATED CATEGORY SUGGESTION BAR (Horizontal Scroll Strip)           */}
          {/* ========================================================================= */}
          <nav className="bk-prod-category-bar" aria-label="Category suggestions">
            <button
              type="button"
              className={`bk-cat-tab ${!category ? 'is-active' : ''}`}
              onClick={() => updateParams({ category: '', subcategory: '' })}
            >
              <LuLayoutGrid className="bk-cat-tab-icon" />
              <span>All Products</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`bk-cat-tab ${category === cat._id ? 'is-active' : ''}`}
                onClick={() => updateParams({ category: category === cat._id ? '' : cat._id, subcategory: '' })}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </nav>

          {/* ========================================================================= */}
          {/* 2. REFINED SORT & QUICK FILTER BAR                                       */}
          {/* ========================================================================= */}
          <div className="bk-prod-filter-bar">
            {/* Custom Modern Sort Trigger Pill */}
            <button
              type="button"
              className={`bk-sort-pill-trigger ${sort ? 'is-active' : ''}`}
              onClick={() => setSortModalOpen(true)}
              aria-label="Sort products"
            >
              <LuArrowUpDown className="bk-sort-pill-icon" />
              <span className="bk-sort-pill-text">{currentSortObj.shortLabel}</span>
              <LuChevronDown className="bk-sort-pill-arrow" />
            </button>

            {/* In Stock Toggle Chip */}
            <button
              type="button"
              className={`bk-quick-chip ${inStockFilter === 'true' ? 'is-active' : ''}`}
              onClick={() => updateParams({ inStock: inStockFilter === 'true' ? '' : 'true' })}
            >
              <span>In Stock</span>
              {inStockFilter === 'true' && <LuCheck className="bk-chip-check" />}
            </button>

            {/* Price Filter Chips */}
            <button
              type="button"
              className={`bk-quick-chip ${maxPrice === '1000' ? 'is-active' : ''}`}
              onClick={() => updateParams({ maxPrice: maxPrice === '1000' ? '' : '1000' })}
            >
              Under ₹1,000
            </button>

            <button
              type="button"
              className={`bk-quick-chip ${minPrice === '1000' && maxPrice === '5000' ? 'is-active' : ''}`}
              onClick={() => {
                if (minPrice === '1000' && maxPrice === '5000') {
                  updateParams({ minPrice: '', maxPrice: '' })
                } else {
                  updateParams({ minPrice: '1000', maxPrice: '5000' })
                }
              }}
            >
              ₹1,000 - ₹5,000
            </button>

            {/* Clear Filters Reset Pill */}
            {hasActiveFilters && (
              <button
                type="button"
                className="bk-quick-chip bk-quick-chip--clear"
                onClick={handleClearAllFilters}
                title="Reset all active filters"
              >
                <LuX />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. HIGH DENSITY BLINKIT PRODUCT GRID (Screenshot 3 phone #2)             */}
          {/* ========================================================================= */}
          <div className="bk-prod-grid-stage">
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : displayedItems.length > 0 ? (
              <div className="bk-prod-grid">
                {displayedItems.map((p) => {
                  const inStock = (p.stock || 0) > 0
                  const isFavorite = Array.isArray(favorites) && favorites.some(id => (typeof id === 'object' ? id._id : id) === p._id)
                  const discount = Math.round(((p.price * 1.35) - p.price) / (p.price * 1.35) * 100) || 24
                  const isRetailer = role === 'retailer' && mode === 'retailer'
                  const currentPrice = isRetailer && p.retailer_price ? p.retailer_price : p.price
                  const mrpPrice = Math.round((currentPrice || 1000) * 1.35)
                  const cartQty = getCartItemQty(p._id)

                  return (
                    <div key={p._id} className="bk-item-card" data-instock={inStock}>
                      {/* Top Badges */}
                      <div className="bk-item-header">
                        {discount > 0 ? (
                          <span className="bk-item-discount">{discount}% OFF</span>
                        ) : <span />}

                        <button
                          type="button"
                          className={`bk-item-fav-btn ${isFavorite ? 'active' : ''}`}
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

                      {/* Product Image Stage */}
                      <Link to={`/product/${p._id}`} className="bk-item-img-stage">
                        {getImageUrl(p) ? (
                          <img
                            src={getImageUrl(p)}
                            alt={p.name}
                            className="bk-item-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="bk-item-img-fallback">
                            <LuPackage />
                          </div>
                        )}

                        {/* Delivery speed pill */}
                        <div className="bk-item-time-pill">
                          <LuClock className="bk-item-clock" />
                          <span>10 MINS</span>
                        </div>
                      </Link>

                      {/* Product Content */}
                      <div className="bk-item-body">
                        {/* Rating Row */}
                        <div className="bk-item-meta-row">
                          <span className="bk-item-weight">
                            {p.min_bulk_qty > 1 ? `${p.min_bulk_qty} pcs (Carton)` : '1 unit'}
                          </span>
                          <span className="bk-item-rating">
                            <FaStar className="bk-item-star" /> 4.8
                          </span>
                        </div>

                        {/* Title */}
                        <Link to={`/product/${p._id}`} className="bk-item-title-link">
                          <h3 className="bk-item-title" title={p.name}>
                            {p.name}
                          </h3>
                        </Link>

                        {/* Price & Red ADD Button Row */}
                        <div className="bk-item-action-row">
                          <div className="bk-item-pricing">
                            <span className="bk-item-price">₹{formatPrice(currentPrice)}</span>
                            <span className="bk-item-mrp">₹{formatPrice(mrpPrice)}</span>
                          </div>

                          {/* Action Button: Red ADD / Stepper */}
                          <div className="bk-item-btn-wrap">
                            {!inStock ? (
                              <button type="button" className="bk-item-out-btn" disabled>
                                OUT
                              </button>
                            ) : cartQty === 0 ? (
                              <button
                                type="button"
                                className="bk-item-add-btn"
                                onClick={(e) => handleAddOne(p, e)}
                                aria-label={`Add ${p.name}`}
                              >
                                <span>ADD</span>
                                <LuPlus className="bk-item-plus-icon" />
                              </button>
                            ) : (
                              <div className="bk-item-stepper">
                                <button
                                  type="button"
                                  className="bk-item-step-btn"
                                  onClick={(e) => handleDecrement(p, cartQty, e)}
                                  aria-label="Decrease"
                                >
                                  <LuMinus />
                                </button>
                                <span className="bk-item-step-count">{cartQty}</span>
                                <button
                                  type="button"
                                  className="bk-item-step-btn"
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
                })}
              </div>
            ) : (
              <div className="bk-prod-empty">
                <LuPackage className="bk-prod-empty-ico" />
                <h3>No products found</h3>
                <p>Try searching for another keyword or clear active filters.</p>
                <button
                  type="button"
                  className="bk-prod-clear-all-btn"
                  onClick={() => {
                    setSearchInput('')
                    setParams(new URLSearchParams())
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 4. SHOP BY BRANDS STRIP (Screenshot 3 style)                              */}
          {/* ========================================================================= */}
          <div className="bk-prod-brands-strip">
            <h3 className="bk-prod-brands-title">Shop by Top Brands</h3>
            <div className="bk-prod-brands-scroll">
              {BRANDS.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  className="bk-prod-brand-pill"
                  onClick={() => {
                    setSearchInput(b.name)
                    updateParams({ search: b.name })
                  }}
                >
                  <strong>{b.name}</strong>
                  <span>{b.tag}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. FLOATING BOTTOM RED CART PILL                                         */}
      {/* ========================================================================= */}
      {cartSummary.count > 0 && (
        <div className="bk-prod-floating-cart-anchor">
          <Link to="/cart" className="bk-prod-floating-cart-bar" aria-label="Open Cart">
            <div className="bk-prod-cart-left">
              <div className="bk-prod-cart-bag">
                <FaShoppingCart />
              </div>
              <div className="bk-prod-cart-info">
                <span className="bk-prod-cart-count">
                  {cartSummary.count} {cartSummary.count === 1 ? 'ITEM' : 'ITEMS'}
                </span>
                <span className="bk-prod-cart-total">₹{formatPrice(cartSummary.total)}</span>
              </div>
            </div>

            <div className="bk-prod-cart-right">
              <span>View Cart</span>
              <LuArrowRight />
            </div>
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODERN SORT BOTTOM SHEET MODAL                                        */}
      {/* ========================================================================= */}
      {sortModalOpen && (
        <div className="bk-sort-modal-overlay" onClick={() => setSortModalOpen(false)}>
          <div
            className="bk-sort-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sort Options"
          >
            <div className="bk-sort-modal-handle" />
            <div className="bk-sort-modal-header">
              <div className="bk-sort-modal-header-title">
                <LuArrowUpDown className="bk-sort-modal-title-icon" />
                <h3>Sort Products By</h3>
              </div>
              <button
                type="button"
                className="bk-sort-modal-close"
                onClick={() => setSortModalOpen(false)}
                aria-label="Close sorting options"
              >
                <LuX />
              </button>
            </div>

            <div className="bk-sort-options-list">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = (sort || '') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`bk-sort-option-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      updateParams({ sort: opt.value })
                      setSortModalOpen(false)
                    }}
                  >
                    <div className="bk-sort-option-info">
                      <span className="bk-sort-option-title">{opt.label}</span>
                      <span className="bk-sort-option-desc">{opt.desc}</span>
                    </div>
                    <div className={`bk-sort-radio ${isSelected ? 'is-checked' : ''}`}>
                      {isSelected && <span className="bk-sort-radio-dot" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
