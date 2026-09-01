import React, { useContext, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiShoppingBag,
  FiArrowRight,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiShield,
  FiTruck,
  FiCheck,
  FiAlertTriangle,
  FiTag
} from 'react-icons/fi'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import toast from 'react-hot-toast'
import './CartPage.css'

const FREE_SHIPPING_THRESHOLD = 999

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useContext(ShopContext)
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  const navigate = useNavigate()
  
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const isRetailer = role === 'retailer'
  const retailerBulk = isRetailer && mode === 'retailer'

  const blockers = useMemo(() => {
    const issues = []

    for (const item of cart) {
      const minQty = retailerBulk ? (item.minBulkQty || 1) : 1
      const stockKnown = typeof item.stock === 'number'
      const stock = stockKnown ? item.stock : null

      if (item.qty < minQty) {
        issues.push(`Minimum order quantity for "${item.name}" is ${minQty} units.`)
      }

      if (stockKnown && stock <= 0) {
        issues.push(`"${item.name}" is currently out of stock.`)
      } else if (stockKnown && item.qty > stock) {
        issues.push(`"${item.name}" exceeds available stock (${stock} units max).`)
      }
    }

    return issues
  }, [cart, retailerBulk])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0)
    const discount = appliedCoupon ? Math.round(subtotal * 0.1) : 0 // 10% coupon discount
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 || retailerBulk
    const shipping = isFreeShipping ? 0 : 99
    const total = Math.max(0, subtotal - discount + (isFreeShipping ? 0 : shipping))
    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
    const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

    return {
      subtotal,
      discount,
      shipping,
      total,
      isFreeShipping,
      freeShippingRemaining,
      freeShippingProgress
    }
  }, [cart, appliedCoupon, retailerBulk])

  const handleApplyCoupon = (e) => {
    e.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (!code) return

    if (code === 'WELCOME10' || code === 'SAVE10' || code === 'KRIPA10') {
      setAppliedCoupon(code)
      toast.success(`Coupon "${code}" applied! 10% discount added.`)
      setCouponCode('')
    } else {
      toast.error('Invalid or expired promo code')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    toast.success('Promo coupon removed')
  }

  return (
    <div className="cart-page">
      <SEO
        title="Your Shopping Cart | KripaConnect"
        description="Review your selected electronics and appliances, manage quantities, and proceed to secure checkout on KripaConnect."
        canonical="/cart"
        robots="noindex, nofollow"
      />
      <Navbar />

      <main className="cart-container">
        {/* Header */}
        <header className="cart-header">
          <div>
            <span className="cart-eyebrow">Shopping & Order Review</span>
            <h1 className="cart-title">Your Shopping Cart</h1>
            <p className="cart-subtitle">Review items, apply discount vouchers, and proceed to checkout.</p>
          </div>
          <span className="cart-count-badge">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </header>

        {cart.length === 0 ? (
          <div className="cart-empty-card">
            <div className="cart-empty-icon-wrap">
              <FiShoppingBag />
            </div>
            <h2>Your cart is currently empty</h2>
            <p>Explore our premium catalog of electronics and home appliances to add items to your cart.</p>
            <Link to="/products" className="cart-empty-cta">
              Explore Products <FiArrowRight />
            </Link>
          </div>
        ) : (
          <div className="cart-layout-grid">
            {/* Left: Cart Items List */}
            <section className="cart-items-section" aria-label="Cart Items">
              {/* Free Shipping Progress Bar */}
              {!retailerBulk && (
                <div className="cart-free-shipping-card">
                  <div className="cart-free-shipping-text">
                    <FiTruck className="cart-free-shipping-icon" />
                    {totals.isFreeShipping ? (
                      <span>🎉 Congratulations! You have unlocked <strong>FREE Express Delivery</strong>!</span>
                    ) : (
                      <span>
                        Add <strong>₹{totals.freeShippingRemaining.toLocaleString('en-IN')}</strong> more to qualify for <strong>FREE Express Delivery</strong>!
                      </span>
                    )}
                  </div>
                  <div className="cart-progress-bar">
                    <div
                      className="cart-progress-bar-fill"
                      style={{ width: `${totals.freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Blocker Alerts */}
              {blockers.length > 0 && (
                <div className="cart-blocker-alert">
                  <FiAlertTriangle className="cart-blocker-icon" />
                  <div>
                    <div style={{ fontWeight: 800 }}>Please resolve the following before checkout:</div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                      {blockers.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Items Card List */}
              <div className="cart-items-list">
                {cart.map((item) => {
                  const minQty = retailerBulk ? (item.minBulkQty || 1) : 1
                  const stockKnown = typeof item.stock === 'number'
                  const isOut = stockKnown && item.stock <= 0
                  const isLow = stockKnown && item.stock > 0 && item.stock < 10
                  const itemTotalPrice = (Number(item.price) || 0) * (Number(item.qty) || 1)

                  return (
                    <article key={item.productId} className="cart-item-card">
                      <Link to={`/product/${item.productId}`} className="cart-item-image-wrap">
                        <img src={item.image || 'https://via.placeholder.com/120'} alt={item.name} />
                      </Link>

                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          <Link to={`/product/${item.productId}`} className="cart-item-title">
                            <h3>{item.name}</h3>
                          </Link>
                          <button
                            type="button"
                            className="cart-item-remove-btn"
                            onClick={() => removeFromCart(item.productId)}
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        <div className="cart-item-meta-row">
                          <div className="cart-item-unit-price">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')} each
                          </div>

                          {isOut ? (
                            <span className="cart-stock-badge is-out">Out of stock</span>
                          ) : isLow ? (
                            <span className="cart-stock-badge is-low">Only {item.stock} left</span>
                          ) : (
                            <span className="cart-stock-badge is-in">In Stock</span>
                          )}
                        </div>

                        {retailerBulk && minQty > 1 && (
                          <div className="cart-min-qty-hint">Min order: {minQty} units</div>
                        )}

                        <div className="cart-item-footer">
                          {/* Quantity Stepper */}
                          <div className="cart-qty-stepper">
                            <button
                              type="button"
                              onClick={() => updateQty(item.productId, Math.max(minQty, item.qty - 1))}
                              disabled={item.qty <= minQty}
                              aria-label="Decrease quantity"
                            >
                              <FiMinus />
                            </button>
                            <span className="cart-qty-val">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.productId, item.qty + 1)}
                              disabled={stockKnown && item.qty >= item.stock}
                              aria-label="Increase quantity"
                            >
                              <FiPlus />
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="cart-item-total">
                            ₹{itemTotalPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Right: Order Summary Card */}
            <aside className="cart-summary-sidebar" aria-label="Order Summary">
              <div className="cart-summary-card">
                <h2 className="cart-summary-title">Order Summary</h2>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyCoupon} className="cart-coupon-form">
                  <div className="cart-coupon-input-wrap">
                    <FiTag className="cart-coupon-icon" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. SAVE10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="cart-coupon-input"
                    />
                  </div>
                  <button type="submit" className="cart-coupon-btn">
                    Apply
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="cart-applied-coupon">
                    <span>Code <strong>{appliedCoupon}</strong> applied (-10%)</span>
                    <button type="button" onClick={handleRemoveCoupon} className="cart-remove-coupon">✕</button>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="cart-breakdown">
                  <div className="cart-breakdown-row">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {totals.discount > 0 && (
                    <div className="cart-breakdown-row cart-breakdown-row--discount">
                      <span>Promo Discount</span>
                      <span>-₹{totals.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="cart-breakdown-row">
                    <span>Estimated Shipping</span>
                    <span>{totals.isFreeShipping ? <strong style={{ color: '#059669' }}>FREE</strong> : `₹${totals.shipping}`}</span>
                  </div>

                  <div className="cart-breakdown-row cart-breakdown-row--total">
                    <span>Estimated Total</span>
                    <span>₹{totals.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  className="cart-btn-checkout"
                  disabled={blockers.length > 0}
                  onClick={() => navigate('/checkout')}
                >
                  <span>Proceed to Secure Checkout</span>
                  <FiArrowRight />
                </button>

                {/* Trust Badges */}
                <div className="cart-trust-badges">
                  <div className="cart-trust-badge">
                    <FiShield /> 256-Bit SSL Encryption
                  </div>
                  <div className="cart-trust-badge">
                    <FiTruck /> Insured Doorstep Delivery
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
