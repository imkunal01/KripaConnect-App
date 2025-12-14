import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const [qty, setQty] = useState(1)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const p = await getProduct(id)
        const r = await listProductReviews(id)
        if (active) {
          setProduct(p)
          setReviews(r)
        }
      } catch (e) {
        setError(String(e.message || 'Failed'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (error) return <div style={{ padding: 24 }}>Error: {error}</div>
  if (!product) return <div style={{ padding: 24 }}>Not found</div>

  const inStock = (product.stock || 0) > 0
  const images = Array.isArray(product.images) ? product.images : []

  async function submitReview(payload) {
    await createProductReview(id, payload, token)
    const r = await listProductReviews(id)
    setReviews(r)
  }

  const [selectedImage, setSelectedImage] = useState(images[0]?.url || null)

  return (
    <div className="product-details-page">
      <Navbar />
      <div className="product-details-container">
        <div className="product-details-grid">
          {/* Image Gallery */}
          <div className="product-image-section">
            <div className="product-image-main">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} />
              ) : (
                <span style={{ fontSize: '4rem', opacity: 0.3 }}>📦</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="product-image-thumbnails">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={`${product.name} ${idx + 1}`}
                    onClick={() => setSelectedImage(img.url)}
                    className={`product-image-thumbnail ${selectedImage === img.url ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            <div className="product-price-section">
              <div className="product-price">₹{product.price?.toLocaleString('en-IN')}</div>
              <div className={`product-stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                {inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
              </div>
            </div>

            {product.description && (
              <div className="product-description">
                {product.description}
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="product-actions-section">
              <div className="product-quantity-group">
                <label className="product-quantity-label">Quantity:</label>
                <QuantitySelector value={qty} max={product.stock || 1} onChange={setQty} />
              </div>

              <div className="product-action-buttons">
                <button
                  onClick={() => addToCart(product, qty)}
                  disabled={!inStock}
                  className={`product-action-btn primary ${!inStock ? 'disabled' : ''}`}
                >
                  Add to Cart
                </button>
                <button
                  onClick={async () => {
                    await addToCart(product, qty)
                    navigate('/checkout')
                  }}
                  disabled={!inStock}
                  className={`product-action-btn success ${!inStock ? 'disabled' : ''}`}
                >
                  Buy Now
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FavoritesButton productId={product._id} active={favorites.includes(product._id)} />
              </div>
            </div>

            {/* Key Features */}
            <div className="product-features">
              <h3 className="product-features-title">Key Features</h3>
              <ul className="product-features-list">
                <li className="product-features-item">✓ Fast & Secure Delivery</li>
                <li className="product-features-item">✓ Genuine Products Guaranteed</li>
                <li className="product-features-item">✓ Easy Returns & Exchanges</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="product-reviews-section">
          <h2 className="product-reviews-title">Customer Reviews</h2>
          <ReviewList items={reviews} />
          {token && (
            <div className="product-reviews-form-section">
              <ReviewForm onSubmit={submitReview} />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
