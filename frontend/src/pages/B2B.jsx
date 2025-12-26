import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'
import { useAuth } from '../hooks/useAuth.js'
import ShopContext from '../context/ShopContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import './B2B.css'

function RetailerProductCard({ product, onAddToCart }) {
  const [qty, setQty] = useState(product.min_bulk_qty || 1)
  const [adding, setAdding] = useState(false)
  const minQty = product.min_bulk_qty || 1

  const effectivePrice = qty >= minQty && product.price_bulk 
    ? product.price_bulk 
    : product.retailer_price || product.price

  const isBulkPrice = qty >= minQty && product.price_bulk

  function handleQtyChange(newQty) {
    const numQty = Math.max(minQty, Number(newQty) || minQty)
    setQty(Math.min(numQty, product.stock || 999))
  }

  async function handleAddToCart() {
    if (qty < minQty) {
      alert(`Minimum quantity of ${minQty} required for bulk pricing`)
      return
    }
    setAdding(true)
    try {
      await onAddToCart(product, qty)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="retailer-card">
      <div className="retailer-card-img">
        {product.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.name} />
        ) : (
          <div className="placeholder-icon">📦</div>
        )}
      </div>
      
      <div className="retailer-card-body">
        <h3>{product.name}</h3>
        {product.description && (
          <p className="desc">
            {product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}
          </p>
        )}

        <div className="pricing-box">
          <div className="price-row">
            <span className="label">Retail Price:</span>
            <span className="val strike">₹{product.price?.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="price-row highlight">
            <span className="label">Retailer Price:</span>
            <span className="val primary">
              ₹{product.retailer_price?.toLocaleString('en-IN') || product.price?.toLocaleString('en-IN')}
            </span>
          </div>

          {product.price_bulk && (
            <>
              <div className="divider" />
              <div className="price-row bulk">
                <span className="label bulk-label">Bulk Price:</span>
                <span className={`val bulk-val ${isBulkPrice ? 'active' : ''}`}>
                  ₹{product.price_bulk?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="min-qty-hint">Min Qty: {minQty} units</div>
            </>
          )}
        </div>

        <div className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
          {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
        </div>

        <div className="qty-section">
          <label>Quantity:</label>
          <QuantitySelector
            value={qty}
            onChange={handleQtyChange}
            min={minQty}
            max={product.stock || 999}
          />
          {qty >= minQty && product.price_bulk && (
            <div className="bulk-applied">✓ Bulk pricing applied</div>
          )}
        </div>

        <div className="subtotal-box">
          <div className="sub-label">Subtotal:</div>
          <div className="sub-val">₹{(effectivePrice * qty).toLocaleString('en-IN')}</div>
        </div>

        <button
          className="btn-add-retail"
          onClick={handleAddToCart}
          disabled={adding || product.stock <= 0 || qty < minQty}
        >
          {adding ? 'Adding...' : qty < minQty ? `Min ${minQty} required` : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export default function B2B() {
  const { token, user, role } = useAuth()
  const { addToCart } = useContext(ShopContext)
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (role !== 'retailer') { navigate('/'); return }
    loadProducts()
  }, [token, role, navigate])

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/retailer/products', { token })
      const data = res?.data?.data || []
      setItems(data)
    } catch (err) {
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart(product, qty) {
    try {
      await addToCart(product, qty)
      alert(`Added ${qty} ${product.name} to cart`)
    } catch (err) {
      alert(err.message || 'Failed to add to cart')
    }
  }

  if (role !== 'retailer') return null 

  return (
    <div className="b2b-page">
      <Navbar />
      
      <main className="b2b-main">
        {/* Hero Section */}
        <section className="b2b-hero">
          <div className="b2b-hero-content">
            <h1>Wholesale Portal</h1>
            <p>Welcome, {user?.name}! Access exclusive bulk pricing and special rates.</p>
            <button onClick={() => navigate('/cart')} className="btn-hero-red">
              View Cart →
            </button>
          </div>
        </section>

        {error && <div className="b2b-error">{error}</div>}

        {loading ? (
          <div className="b2b-loading">
            <div className="spinner">⏳</div>
            <p>Loading catalog...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="b2b-empty">
            <div className="icon">📦</div>
            <h2>No products available</h2>
            <p>Check back later for wholesale opportunities.</p>
          </div>
        ) : (
          <section className="b2b-content">
            <div className="b2b-toolbar">
              <div className="count-badge">
                {items.length} Product{items.length !== 1 ? 's' : ''} Available
              </div>
            </div>
            
            <div className="b2b-grid">
              {items.map(product => (
                <RetailerProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
