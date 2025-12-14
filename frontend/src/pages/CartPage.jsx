import { useContext, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './CartPage.css'

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useContext(ShopContext)
  const { role } = useAuth()
  const navigate = useNavigate()
  const isRetailer = role === 'retailer'
  
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
    return { subtotal, total: subtotal }
  }, [cart])

  const empty = cart.length === 0

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-container">
        <div className="cart-header">
          <h1 className="cart-title">Shopping Cart</h1>
          {isRetailer && (
            <span className="cart-badge">B2B Wholesale Cart</span>
          )}
        </div>

        {empty ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon">🛒</div>
            <h2 className="cart-empty-title">Your cart is empty</h2>
            <p className="cart-empty-text">
              Start adding products to your cart to continue shopping
            </p>
            <Link to="/products" className="hero-cta-primary">
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items">
              {cart.map(item => {
                const isBulkPrice = isRetailer && item.isBulkPrice
                const minQty = item.minBulkQty
                return (
                  <div key={item.productId} className="cart-item">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-item-image"
                    />
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      {isRetailer && (
                        <div className="cart-item-price-info">
                          {item.regularPrice && item.regularPrice !== item.price && (
                            <span style={{ textDecoration: 'line-through', marginRight: '0.5rem', color: '#9ca3af' }}>
                              ₹{item.regularPrice?.toLocaleString('en-IN')}
                            </span>
                          )}
                          {isBulkPrice ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              Bulk Price: ₹{item.price?.toLocaleString('en-IN')} ✓
                            </span>
                          ) : (
                            <span>Retailer Price: ₹{item.price?.toLocaleString('en-IN')}</span>
                          )}
                          {minQty && item.qty < minQty && (
                            <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                              Min {minQty} for bulk pricing
                            </div>
                          )}
                        </div>
                      )}
                      {!isRetailer && (
                        <div className="cart-item-price">₹{item.price?.toLocaleString('en-IN')}</div>
                      )}
                      <div className="cart-item-actions">
                        <label className="cart-item-quantity-label">Qty:</label>
                        <input
                          type="number"
                          min={isRetailer && minQty ? minQty : 1}
                          value={item.qty}
                          onChange={e => updateQty(item.productId, Math.max(isRetailer && minQty ? minQty : 1, Number(e.target.value) || 1))}
                          className="cart-item-quantity-input"
                        />
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="cart-item-remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-total">
                      <div className="cart-item-total-price">
                        ₹{(item.price * item.qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      {isBulkPrice && (
                        <div className="cart-item-bulk-badge">Bulk pricing</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="order-summary-sticky">
              <div className="order-summary-card">
                <h2 className="order-summary-title">Order Summary</h2>
                <div className="order-summary-row">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="order-summary-divider" />
                <div className="order-summary-total">
                  <span>Total</span>
                  <span>₹{totals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  disabled={empty}
                  className="order-summary-button"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

