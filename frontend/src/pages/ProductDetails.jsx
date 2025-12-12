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

  return (
    <div>
      <Navbar />
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ height: 360, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {images[0]?.url ? <img src={images[0].url} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : null}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {images.slice(0,4).map((img, idx) => (
              <img key={idx} src={img.url} alt={String(idx)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
            ))}
          </div>
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{product.name}</h2>
          <div style={{ marginTop: 6 }}>₹{product.price}</div>
          <div style={{ marginTop: 6, fontSize: 12 }}>{inStock ? 'In Stock' : 'Out of Stock'}</div>
          <div style={{ marginTop: 12 }}>{product.description}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
            <QuantitySelector value={qty} max={product.stock || 1} onChange={setQty} />
            <button className="nav-btn signup-btn" disabled={!inStock} onClick={() => addToCart(product, qty)}>Add to Cart</button>
            <button className="nav-btn" disabled={!inStock} onClick={async () => { await addToCart(product, qty); navigate('/checkout') }}>Buy Now</button>
            <FavoritesButton productId={product._id} active={favorites.includes(product._id)} />
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 8 }}>Reviews</h3>
            <ReviewList items={reviews} />
            <div style={{ marginTop: 12 }}>
              <ReviewForm onSubmit={submitReview} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
