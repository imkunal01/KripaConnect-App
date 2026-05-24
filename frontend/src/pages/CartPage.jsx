import { useContext, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaMinus, FaPlus, FaShoppingBag, FaTrashAlt } from 'react-icons/fa'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './CartPage.css'

function formatPrice(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`
}

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useContext(ShopContext)
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  const navigate = useNavigate()
  const isRetailer = role === 'retailer'
  const retailerBulk = isRetailer && mode === 'retailer'

  const blockers = useMemo(() => {
    const issues = []

    for (const item of cart) {
      const minQty = retailerBulk ? (item.minBulkQty || 1) : 1
      const stockKnown = typeof item.stock === 'number'
      const stock = stockKnown ? item.stock : null

      if (item.qty < minQty) {
        issues.push(`Minimum quantity is ${minQty} for ${item.name}`)
      }

      if (stockKnown && stock <= 0) {
        issues.push(`${item.name} is out of stock`)
      } else if (stockKnown && item.qty > stock) {
        issues.push(`${item.name} exceeds available stock (${stock})`)
      }
    }

    return issues
  }, [cart, retailerBulk])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    return { subtotal, total: subtotal }
  }, [cart])

  return (
    <div className="cart-page-x">
      <Navbar />

      <main className="cart-wrapper">
        <header className="cart-top">
          <div>
            <p className="cart-eyebrow">Secure checkout</p>
            <h1>Shopping Cart</h1>
            <p className="cart-subtitle">Review your products before moving to checkout.</p>
          </div>
          <span className="cart-count-pill">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
        </header>

        {cart.length === 0 ? (
          <div className="cart-empty-x">
            <div className="empty-icon-wrap">
              <FaShoppingBag aria-hidden="true" />
            </div>
            <h2>Your cart is empty</h2>
            <p>Browse products and add the essentials you want to buy.</p>
            <Link to="/products" className="empty-cta">
              Browse Products <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            <section className="cart-items-x" aria-label="Cart items">
              {cart.map(item => {
                const minQty = retailerBulk ? (item.minBulkQty || 1) : 1
                const stockKnown = typeof item.stock === 'number'
                const maxQty = stockKnown && item.stock > 0 ? item.stock : null
                const atMin = item.qty <= minQty
                const atMax = maxQty != null && item.qty >= maxQty
                const stockText = stockKnown
                  ? item.stock > 0
                    ? `${item.stock} in stock`
                    : 'Out of stock'
                  : 'In stock'

                return (
                  <article key={item.productId} className="cart-item-x">
                    <Link to={`/product/${item.productId}`} className="cart-image-link" aria-label={`View ${item.name}`}>
                      <img src={item.image || 'https://via.placeholder.com/160'} alt={item.name} />
                    </Link>

                    <div className="cart-mid">
                      <div className="cart-item-heading">
                        <Link to={`/product/${item.productId}`}>
                          <h3>{item.name}</h3>
                        </Link>
                        <span className={`stock-chip ${stockKnown && item.stock <= 0 ? 'is-out' : ''}`}>
                          {stockText}
                        </span>
                      </div>

                      <div className="price-row-x">
                        <span className="price-main">{formatPrice(item.price)}</span>
                        {retailerBulk && <span className="bulk-pill">Bulk price</span>}
                      </div>

                      {retailerBulk && item.minBulkQty > 1 && (
                        <div className="small-muted">Minimum bulk quantity: {item.minBulkQty}</div>
                      )}

                      <div className="cart-item-actions">
                        <div className="qty-control-x" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            disabled={atMin}
                            title={atMin ? `Minimum quantity is ${minQty}` : undefined}
                            onClick={() => updateQty(item.productId, Math.max(minQty, item.qty - 1))}
                            aria-label="Decrease quantity"
                          >
                            <FaMinus aria-hidden="true" />
                          </button>

                          <span>{item.qty}</span>

                          <button
                            type="button"
                            disabled={atMax || (stockKnown && item.stock <= 0)}
                            title={
                              stockKnown && item.stock <= 0
                                ? 'Out of stock'
                                : atMax
                                  ? `Only ${maxQty} available`
                                  : undefined
                            }
                            onClick={() => {
                              const nextQty = maxQty != null ? Math.min(maxQty, item.qty + 1) : (item.qty + 1)
                              updateQty(item.productId, nextQty)
                            }}
                            aria-label="Increase quantity"
                          >
                            <FaPlus aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="remove-x remove-x--mobile"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <FaTrashAlt aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="cart-right">
                      <div className="line-total-label">Item total</div>
                      <div className="line-total-x">{formatPrice(item.price * item.qty)}</div>

                      <button
                        type="button"
                        className="remove-x remove-x--desktop"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <FaTrashAlt aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>

            <aside className="summary-x" aria-label="Order summary">
              <div className="summary-card-top">
                <p className="cart-eyebrow">Summary</p>
                <h2>Order Summary</h2>
              </div>

              <div className="sum-row">
                <span>Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>

              <div className="sum-row">
                <span>Delivery</span>
                <span>Calculated next</span>
              </div>

              <div className="sum-row total">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>

              {blockers.length > 0 && (
                <div className="checkout-warning">
                  <strong>Before checkout</strong>
                  {blockers.slice(0, 3).map(issue => (
                    <span key={issue}>{issue}</span>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="checkout-x"
                onClick={() => navigate('/checkout')}
                disabled={blockers.length > 0}
                title={blockers.length > 0 ? blockers[0] : undefined}
              >
                Checkout <FaArrowRight aria-hidden="true" />
              </button>

              <Link to="/products" className="continue-link">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
