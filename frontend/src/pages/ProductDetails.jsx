import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct, listProducts } from '../services/products'
import { listProductReviews, createProductReview } from '../services/reviews'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import FavoritesButton from '../components/FavoritesButton.jsx'
import ReviewList from '../components/ReviewList.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import './ProductDetails.css'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, favorites } = useContext(ShopContext)
  const { token } = useContext(AuthContext)
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [relatedItems, setRelatedItems] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)

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
          setReviews(r)
          if (p.images?.length) setSelectedImage(p.images[0].url)
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
    await createProductReview(id, payload, token)
    const r = await listProductReviews(id)
    setReviews(r)
  }

  const handleBuyNow = async () => {
    await addToCart(product, qty)
    navigate('/checkout')
  }

  if (loading) return <div className="loader-screen"><div className="spinner"></div></div>
  if (!product) return <div className="error-screen">Product not found. <Link to="/">Go Home</Link></div>

  const inStock = (product.stock || 0) > 0
  const bulkUnitPrice = product?.price_bulk || product?.retailer_price || product?.price
  const displayUnitPrice = retailerBulk ? bulkUnitPrice : product.price

  return (
    <div className="pdp-page">
      <Navbar />

      <main className="pdp-layout">
        <div className="pdp-shell">
          <nav className="pdp-breadcrumbs">
            <Link to="/">Home</Link>
            <span> / </span>
            <Link to="/products">Products</Link>
            <span> / </span>
            <span>{product.name}</span>
          </nav>

          <div className="pdp-hero">
            {/* Media */}
            <section className="pdp-media">
              <div className="pdp-media-main">
                {selectedImage ? (
                  <img src={selectedImage} alt={product.name} />
                ) : (
                  <div className="pdp-media-placeholder">No Image</div>
                )}
                {!inStock && <span className="pdp-badge pdp-badge--danger">Sold Out</span>}
                {inStock && <span className="pdp-badge">In Stock</span>}
              </div>

              {product.images?.length > 1 && (
                <div className="pdp-media-thumbs">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(img.url)}
                      className={`pdp-thumb ${selectedImage === img.url ? 'isActive' : ''}`}
                    >
                      <img src={img.url} alt={`thumbnail ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Info */}
            <section className="pdp-info">
              <div className="pdp-info-card">
                <div className="pdp-title-row">
                  <h1 className="pdp-title">{product.name}</h1>
                  <FavoritesButton productId={product._id} active={favorites.includes(product._id)} />
                </div>

                <div className="pdp-price-row">
                  {retailerBulk ? (
                    <div className="pdp-price">
                      <span className="pdp-price-old">₹{product.price?.toLocaleString('en-IN')}</span>
                      ₹{bulkUnitPrice?.toLocaleString('en-IN')}
                    </div>
                  ) : (
                    <div className="pdp-price">₹{product.price?.toLocaleString('en-IN')}</div>
                  )}
                  <div className={`pdp-stock ${inStock ? 'isIn' : 'isOut'}`}>
                    {inStock ? 'Available' : 'Out of stock'}
                  </div>
                </div>

                {retailerBulk && minBulkQty > 1 && (
                  <div className="pdp-subtext">Minimum bulk quantity: {minBulkQty}</div>
                )}

                <div className="pdp-actions">
                  <div className="pdp-qty">
                    <span className="label-subtle">Quantity</span>
                    <QuantitySelector value={qty} min={retailerBulk ? minBulkQty : 1} max={product.stock} onChange={setQty} />
                  </div>

                  <div className="pdp-actions-row">
                    <button
                      className="btn-add-cart"
                      onClick={() => addToCart(product, qty)}
                      disabled={!inStock || (retailerBulk && qty < minBulkQty)}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="btn-buy-now"
                      onClick={handleBuyNow}
                      disabled={!inStock || (retailerBulk && qty < minBulkQty)}
                    >
                      Buy Now
                    </button>
                  </div>

                  <div className="pdp-trust">
                    <span>🔒 Secure Payment</span>
                    <span>⚡ Fast Shipping</span>
                    <span>✅ Authenticated</span>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </div>

        <section className="pdp-section">
          <div className="pdp-section-header">
            <h2>Product Details</h2>
            <span className="pdp-section-sub">Everything you need to know</span>
          </div>

          <div className="pdp-details-grid">
            <div className="pdp-card">
              <h3>Description</h3>
              <p className="description-text">{product.description || "No specific description available."}</p>
            </div>
            <div className="pdp-card">
              <h3>Specifications</h3>
              <ul className="specs-list">
                <li><strong>SKU:</strong> {product._id.slice(-6).toUpperCase()}</li>
                <li><strong>Category:</strong> {product.Category?.name || 'Uncategorized'}</li>
                <li><strong>Subcategory:</strong> {product.subcategory_id?.name || '—'}</li>
                <li><strong>Warranty:</strong> 1 Year Manufacturer</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="pdp-section">
          <div className="pdp-section-header">
            <h2>Customer Reviews</h2>
            <span className="pdp-section-sub">Ratings and verified feedback</span>
          </div>

          <div className="pdp-reviews-grid">
            <div className="pdp-card">
              {reviews.length === 0 && <p className="no-reviews">No reviews yet.</p>}
              <ReviewList items={reviews} />
            </div>
            <div className="pdp-card">
              {token ? (
                <>
                  <h3>Add your rating</h3>
                  <ReviewForm onSubmit={handleReviewSubmit} />
                </>
              ) : (
                <Link to="/login" className="login-link">Log in to review</Link>
              )}
            </div>
          </div>
        </section>

        <section className="pdp-section">
          <div className="pdp-section-header">
            <h2>Similar Products</h2>
            <span className="pdp-section-sub">More products you may like</span>
          </div>

          {relatedLoading ? (
            <div className="pdp-loading">Loading suggestions…</div>
          ) : relatedItems.length === 0 ? (
            <div className="pdp-empty">No similar products found.</div>
          ) : (
            <ProductGrid items={relatedItems} />
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}