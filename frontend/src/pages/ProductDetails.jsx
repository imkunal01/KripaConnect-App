import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct } from '../services/products'
import { listProductReviews, createProductReview } from '../services/reviews'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import FavoritesButton from '../components/FavoritesButton.jsx'
import ReviewList from '../components/ReviewList.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './ProductDetails.css'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, favorites } = useContext(ShopContext)
  const { token } = useContext(AuthContext)
  
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [activeTab, setActiveTab] = useState('details') // 'details' or 'reviews'

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

  return (
    <div className="pdp-page">
      <Navbar />

      <main className="pdp-layout">
        <div className="pdp-container">
          
          {/* LEFT: Immersive Gallery */}
          <section className="pdp-gallery-section">
            <div className="pdp-breadcrumb-mobile">
              <Link to="/products">&larr; Back</Link>
            </div>
            
            <div className="gallery-main-frame">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="gallery-img-active" />
              ) : (
                <div className="gallery-placeholder">No Image</div>
              )}
              <div className="gallery-badges">
                 {!inStock && <span className="badge-out">Sold Out</span>}
                 {inStock && <span className="badge-new">New Arrival</span>}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="gallery-grid">
                {product.images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(img.url)}
                    className={`gallery-thumb ${selectedImage === img.url ? 'active' : ''}`}
                  >
                    <img src={img.url} alt="thumbnail" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: Sticky Product Intelligence */}
          <section className="pdp-info-section">
            <div className="pdp-sticky-wrapper">
              
              {/* Header Group */}
              <div className="pdp-header">
                <nav className="pdp-breadcrumbs">
                  <Link to="/">Home</Link> / <Link to="/products">Electronics</Link>
                </nav>
                <h1 className="pdp-title">{product.name}</h1>
                <div className="pdp-price-row">
                  <span className="pdp-price">₹{product.price?.toLocaleString('en-IN')}</span>
                  <FavoritesButton productId={product._id} active={favorites.includes(product._id)} />
                </div>
              </div>

              <div className="pdp-divider" />

              {/* Action Zone */}
              <div className="pdp-actions-zone">
                <div className="quantity-row">
                  <span className="label-subtle">Quantity</span>
                  <QuantitySelector value={qty} max={product.stock} onChange={setQty} />
                </div>

                <div className="buttons-stack">
                  <button 
                    className="btn-add-cart" 
                    onClick={() => addToCart(product, qty)}
                    disabled={!inStock}
                  >
                    Add to Cart
                  </button>
                  <button 
                    className="btn-buy-now"
                    onClick={handleBuyNow}
                    disabled={!inStock}
                  >
                    Buy Now - Fast Checkout
                  </button>
                </div>
                
                <div className="trust-badges">
                  <span>🔒 Secure Payment</span>
                  <span>⚡ Fast Shipping</span>
                  <span>✅ Authenticated</span>
                </div>
              </div>

              {/* Modern Tabs for Content */}
              <div className="pdp-tabs-container">
                <div className="pdp-tab-headers">
                  <button 
                    className={`tab-link ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    Details
                  </button>
                  <button 
                    className={`tab-link ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    Reviews ({reviews.length})
                  </button>
                </div>

                <div className="pdp-tab-content">
                  {activeTab === 'details' && (
                    <div className="content-details fade-in">
                      <p className="description-text">{product.description || "No specific description available."}</p>
                      <ul className="specs-list">
                        <li><strong>SKU:</strong> {product._id.slice(-6).toUpperCase()}</li>
                        <li><strong>Category:</strong> Electronics</li>
                        <li><strong>Warranty:</strong> 1 Year Manufacturer</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="content-reviews fade-in">
                      {reviews.length === 0 && <p className="no-reviews">No reviews yet.</p>}
                      <ReviewList items={reviews} />
                      {token ? (
                        <div className="review-box-small">
                          <h4>Add your rating</h4>
                          <ReviewForm onSubmit={handleReviewSubmit} />
                        </div>
                      ) : (
                        <Link to="/login" className="login-link">Log in to review</Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        </div>
      </main>
      
      {/* Mobile Floating Action Bar */}
      <div className="mobile-fab-bar">
        <div className="fab-price">
           <small>Total</small>
           ₹{(product.price * qty).toLocaleString()}
        </div>
        <button 
          className="fab-btn" 
          onClick={() => addToCart(product, qty)}
          disabled={!inStock}
        >
          {inStock ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>

      <Footer />
    </div>
  )
}