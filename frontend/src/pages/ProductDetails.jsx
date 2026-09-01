import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct, listProducts } from '../services/products'
import { listProductReviews, createProductReview } from '../services/reviews'
import ShopContext from '../context/ShopContext.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import FavoritesButton from '../components/FavoritesButton.jsx'
import ReviewList from '../components/ReviewList.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { ProductDetailsSkeleton } from '../components/SkeletonLoader.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import {
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiStar,
  FiCheck,
  FiShoppingCart,
  FiZap,
  FiLayers,
  FiShare2,
  FiInfo,
  FiFileText,
  FiMessageSquare
} from 'react-icons/fi'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import toast from 'react-hot-toast'
import './ProductDetails.css'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, favorites } = useContext(ShopContext)
  const { token, role, openAuthModal } = useAuth()
  const { mode } = usePurchaseMode()
  
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [relatedItems, setRelatedItems] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('description') // 'description' | 'specs' | 'warranty' | 'reviews'
  const [addingToCart, setAddingToCart] = useState(false)

  const isRetailer = role === 'retailer'
  const retailerBulk = isRetailer && mode === 'retailer'
  const minBulkQty = product?.min_bulk_qty > 0 ? product.min_bulk_qty : 1

  useEffect(() => {
    if (!product) return
    if (retailerBulk) {
      setQty(prev => Math.max(minBulkQty, prev || 1))
    } else {
      setQty(prev => Math.max(1, prev || 1))
    }
  }, [product, retailerBulk, minBulkQty])

  // Fetch Data
  useEffect(() => {
    let active = true
    window.scrollTo(0, 0)
    
    const fetchData = async () => {
      setLoading(true)
      try {
        const [p, r] = await Promise.all([
          getProduct(id),
          listProductReviews(id).catch(() => [])
        ])
        if (active) {
          setProduct(p)
          setReviews(Array.isArray(r) ? r : [])
          if (p?.images?.length) setSelectedImage(p.images[0].url)
        }
      } catch (e) {
        console.error("Failed to load product", e)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchData()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!product?._id) return
    const subId = product.subcategory_id?._id || product.subcategory_id
    const catId = product.Category?._id || product.category_id

    const loadRelated = async () => {
      setRelatedLoading(true)
      try {
        const data = await listProducts({
          ...(subId ? { subcategory: subId } : catId ? { category: catId } : {}),
          limit: 8,
        })
        const items = (data.items || []).filter(p => p._id !== product._id)
        setRelatedItems(items)
      } catch {
        setRelatedItems([])
      } finally {
        setRelatedLoading(false)
      }
    }

    loadRelated()
  }, [product])

  // Handlers
  const handleReviewSubmit = async (payload) => {
    try {
      await createProductReview(id, payload, token)
      toast.success('Thank you for your review!')
      const r = await listProductReviews(id)
      setReviews(Array.isArray(r) ? r : [])
    } catch (err) {
      toast.error(err.message || 'Failed to submit review')
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart(product, qty)
    } catch (err) {
      // error is handled in ShopContext
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    await addToCart(product, qty)
    navigate('/checkout')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Check out ${product?.name} on KripaConnect!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard!')
    }
  }

  // Calculated Ratings
  const avgRating = useMemo(() => {
    if (!reviews.length) return 5.0
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  if (loading) {
    return (
      <div className="pdp-page">
        <Navbar />
        <ProductDetailsSkeleton />
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pdp-page">
        <Navbar />
        <div className="pdp-empty-screen">
          <h2>Product Not Found</h2>
          <p>The product you are looking for might have been moved or is currently unavailable.</p>
          <Link to="/products" className="pdp-btn-primary">Browse All Products</Link>
        </div>
        <Footer />
      </div>
    )
  }

  const inStock = (product.stock || 0) > 0
  const stockNum = Number(product.stock) || 0
  const bulkUnitPrice = product?.price_bulk || product?.retailer_price || product?.price
  const catName = product.Category?.name || (typeof product.category_id === 'object' ? product.category_id?.name : 'Electronics')
  const subName = product.subcategory_id?.name || (typeof product.subcategory_id === 'object' ? product.subcategory_id?.name : null)

  const numPrice = Number(product.price) || 0
  const numRetailerPrice = Number(product.retailer_price) || 0
  const retailerMargin = numPrice > 0 && numRetailerPrice > 0 ? numPrice - numRetailerPrice : 0
  const retailerMarginPercent = numPrice > 0 ? Math.round((retailerMargin / numPrice) * 100) : 0

  return (
    <div className="pdp-page">
      <SEO
        title={`${product.name} | Buy Online | KripaConnect`}
        description={product.description?.slice(0, 160) || `Buy genuine ${product.name} with fast delivery on KripaConnect.`}
        canonical={`/product/${product._id}`}
        image={selectedImage || product.images?.[0]?.url}
        type="product"
      />
      <Navbar />

      <main className="pdp-container">
        {/* Breadcrumb Navigation */}
        <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="pdp-bread-sep">/</span>
          <Link to="/products">Products</Link>
          {catName && (
            <>
              <span className="pdp-bread-sep">/</span>
              <Link to={`/products?category=${product.Category?._id || product.category_id}`}>{catName}</Link>
            </>
          )}
          <span className="pdp-bread-sep">/</span>
          <span className="pdp-bread-current">{product.name}</span>
        </nav>

        {/* Top Hero: Gallery + Purchasing Details */}
        <div className="pdp-hero-grid">
          {/* Left Column: Image Gallery */}
          <section className="pdp-gallery">
            <div className="pdp-main-image-wrap">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="pdp-main-image"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="pdp-media-placeholder">No Image Available</div>
              )}

              {/* Status Badges */}
              <div className="pdp-image-badges">
                {!inStock ? (
                  <span className="pdp-img-badge pdp-img-badge--danger">Out of Stock</span>
                ) : stockNum < 10 ? (
                  <span className="pdp-img-badge pdp-img-badge--warning">Only {stockNum} Left!</span>
                ) : (
                  <span className="pdp-img-badge pdp-img-badge--success">In Stock</span>
                )}

                {product.tags && product.tags[0] && (
                  <span className="pdp-img-badge pdp-img-badge--dark">{product.tags[0]}</span>
                )}
              </div>
            </div>

            {/* Thumbnail Row */}
            {product.images && product.images.length > 1 && (
              <div className="pdp-thumbnails">
                {product.images.map((img, idx) => (
                  <button
                    key={img.public_id || idx}
                    type="button"
                    className={`pdp-thumb-btn ${selectedImage === img.url ? 'is-active' : ''}`}
                    onClick={() => setSelectedImage(img.url)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img.url} alt={`${product.name} thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Buying Information Card */}
          <section className="pdp-details-card">
            {/* Category & Action Bar */}
            <div className="pdp-cat-row">
              <span className="pdp-cat-pill">{catName}</span>
              <div className="pdp-quick-actions">
                <button
                  type="button"
                  className="pdp-share-btn"
                  onClick={handleShare}
                  aria-label="Share product"
                  title="Share product link"
                >
                  <FiShare2 />
                </button>
                <FavoritesButton productId={product._id} active={favorites.includes(product._id)} />
              </div>
            </div>

            {/* Product Title */}
            <h1 className="pdp-title">{product.name}</h1>

            {/* Ratings Summary */}
            <div className="pdp-rating-summary">
              <div className="pdp-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar key={star} className={star <= Math.round(avgRating) ? 'star-filled' : 'star-empty'} />
                ))}
              </div>
              <span className="pdp-rating-number">{avgRating}</span>
              <span className="pdp-review-count">
                ({reviews.length} {reviews.length === 1 ? 'verified review' : 'verified reviews'})
              </span>
            </div>

            {/* Pricing Section */}
            <div className="pdp-price-section">
              {retailerBulk ? (
                <div className="pdp-wholesale-price-box">
                  <div className="pdp-price-label">Wholesale B2B Rate</div>
                  <div className="pdp-price-flex">
                    <span className="pdp-price-current">₹{Number(bulkUnitPrice || 0).toLocaleString('en-IN')}</span>
                    <span className="pdp-price-retail-strike">Retail: ₹{numPrice.toLocaleString('en-IN')}</span>
                  </div>
                  {retailerMargin > 0 && (
                    <div className="pdp-margin-badge">
                      <span>Retailer Profit Margin: <strong>₹{retailerMargin.toLocaleString('en-IN')}</strong> ({retailerMarginPercent}%)</span>
                    </div>
                  )}
                  {minBulkQty > 1 && (
                    <div className="pdp-min-bulk-pill">Minimum wholesale quantity: {minBulkQty} units</div>
                  )}
                </div>
              ) : (
                <div className="pdp-consumer-price-box">
                  <div className="pdp-price-flex">
                    <span className="pdp-price-current">₹{numPrice.toLocaleString('en-IN')}</span>
                    <span className="pdp-tax-inclusive">Inclusive of all taxes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stock Health */}
            <div className="pdp-stock-health-bar">
              {inStock ? (
                <div className="pdp-stock-status is-in">
                  <span className="pdp-stock-indicator" />
                  <span>In Stock & Ready to Ship</span>
                </div>
              ) : (
                <div className="pdp-stock-status is-out">
                  <span className="pdp-stock-indicator" />
                  <span>Currently Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity Selector & Purchase Buttons */}
            <div className="pdp-purchase-block">
              <div className="pdp-qty-row">
                <label className="pdp-qty-label">Quantity:</label>
                <QuantitySelector
                  value={qty}
                  min={retailerBulk ? minBulkQty : 1}
                  max={stockNum || 99}
                  onChange={setQty}
                />
              </div>

              <div className="pdp-action-buttons">
                <button
                  type="button"
                  className="pdp-btn-cart"
                  onClick={handleAddToCart}
                  disabled={!inStock || addingToCart || (retailerBulk && qty < minBulkQty)}
                >
                  <FiShoppingCart />
                  <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  type="button"
                  className="pdp-btn-buy"
                  onClick={handleBuyNow}
                  disabled={!inStock || (retailerBulk && qty < minBulkQty)}
                >
                  <FiZap />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="pdp-trust-grid">
              <div className="pdp-trust-pill">
                <FiTruck className="pdp-trust-icon" />
                <span>Fast Express Shipping</span>
              </div>
              <div className="pdp-trust-pill">
                <FiShield className="pdp-trust-icon" />
                <span>100% Genuine Warranty</span>
              </div>
              <div className="pdp-trust-pill">
                <FiRefreshCw className="pdp-trust-icon" />
                <span>7-Day Replacement</span>
              </div>
            </div>
          </section>
        </div>

        {/* Tabbed In-Depth Information */}
        <div className="pdp-tabs-container">
          <div className="pdp-tab-nav" role="tablist">
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'description' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('description')}
              role="tab"
            >
              <FiInfo /> Description & Overview
            </button>
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'specs' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('specs')}
              role="tab"
            >
              <FiFileText /> Technical Specs
            </button>
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'warranty' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('warranty')}
              role="tab"
            >
              <FiShield /> Warranty & Shipping
            </button>
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'reviews' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reviews')}
              role="tab"
            >
              <FiMessageSquare /> Customer Reviews ({reviews.length})
            </button>
          </div>

          <div className="pdp-tab-content">
            {activeTab === 'description' && (
              <div className="pdp-tab-panel">
                <h3 className="pdp-panel-heading">Product Overview</h3>
                <p className="pdp-desc-text">
                  {product.description || "High-performance device engineered for superior reliability, energy efficiency, and modern aesthetic elegance."}
                </p>
                {product.tags && product.tags.length > 0 && (
                  <div className="pdp-tags-row">
                    <span className="pdp-tag-label">Tags:</span>
                    {product.tags.map(t => (
                      <span key={t} className="pdp-tag-pill">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="pdp-tab-panel">
                <h3 className="pdp-panel-heading">Technical Specifications</h3>
                <table className="pdp-specs-table">
                  <tbody>
                    <tr>
                      <th>Product SKU</th>
                      <td>{product._id.slice(-8).toUpperCase()}</td>
                    </tr>
                    <tr>
                      <th>Category</th>
                      <td>{catName}</td>
                    </tr>
                    {subName && (
                      <tr>
                        <th>Subcategory</th>
                        <td>{subName}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Inventory Availability</th>
                      <td>{inStock ? `${stockNum} units available` : 'Out of stock'}</td>
                    </tr>
                    <tr>
                      <th>Quality Assurance</th>
                      <td>100% Tested & Verified Manufacturer Quality</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'warranty' && (
              <div className="pdp-tab-panel">
                <h3 className="pdp-panel-heading">Warranty & Delivery Information</h3>
                <div className="pdp-delivery-grid">
                  <div className="pdp-delivery-card">
                    <FiShield className="pdp-delivery-icon" />
                    <h4>1-Year Manufacturer Warranty</h4>
                    <p>Covers technical faults, manufacturing defects, and component replacement.</p>
                  </div>
                  <div className="pdp-delivery-card">
                    <FiTruck className="pdp-delivery-icon" />
                    <h4>Insured Express Delivery</h4>
                    <p>Tracked doorstep shipping with multi-layer tamper-evident packaging.</p>
                  </div>
                  <div className="pdp-delivery-card">
                    <FiRefreshCw className="pdp-delivery-icon" />
                    <h4>7-Day Easy Return Policy</h4>
                    <p>Eligible for prompt exchange or refund in case of transit damage or defects.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="pdp-tab-panel">
                <div className="pdp-reviews-layout">
                  <div className="pdp-reviews-list-col">
                    <h3 className="pdp-panel-heading">Verified Customer Feedback</h3>
                    {reviews.length === 0 ? (
                      <div className="pdp-no-reviews">
                        <FiMessageSquare className="pdp-no-reviews-icon" />
                        <p>No customer reviews yet. Be the first to share your experience!</p>
                      </div>
                    ) : (
                      <ReviewList items={reviews} />
                    )}
                  </div>

                  <div className="pdp-add-review-col">
                    <div className="pdp-review-form-card">
                      <h4 className="pdp-review-form-title">Write a Review</h4>
                      {token ? (
                        <ReviewForm onSubmit={handleReviewSubmit} />
                      ) : (
                        <div className="pdp-review-login-prompt">
                          <p>Sign in to your KripaConnect account to leave a verified rating and review.</p>
                          <button
                            type="button"
                            className="pdp-btn-secondary"
                            onClick={() => openAuthModal({ mode: 'login', title: 'Sign in to review' })}
                          >
                            Sign In to Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Recommendation */}
        {relatedItems.length > 0 && (
          <section className="pdp-related-section">
            <div className="pdp-related-header">
              <h2>You May Also Like</h2>
              <p>Hand-picked recommendations based on this category</p>
            </div>
            <ProductGrid items={relatedItems} />
          </section>
        )}
      </main>

      {/* Sticky Mobile Purchase Dock */}
      <div className="pdp-mobile-dock">
        <div className="pdp-mobile-dock-info">
          <span className="pdp-mobile-dock-price">
            ₹{(retailerBulk ? bulkUnitPrice : numPrice).toLocaleString('en-IN')}
          </span>
          <span className="pdp-mobile-dock-stock">
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        <div className="pdp-mobile-dock-actions">
          <button
            type="button"
            className="pdp-mobile-dock-btn-cart"
            onClick={handleAddToCart}
            disabled={!inStock || (retailerBulk && qty < minBulkQty)}
          >
            Add to Cart
          </button>
          <button
            type="button"
            className="pdp-mobile-dock-btn-buy"
            onClick={handleBuyNow}
            disabled={!inStock || (retailerBulk && qty < minBulkQty)}
          >
            Buy Now
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}