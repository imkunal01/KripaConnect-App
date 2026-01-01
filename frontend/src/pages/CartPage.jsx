import { useContext, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './CartPage.css'

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
          <h1>Shopping Cart</h1>
          <span>{cart.length} items</span>
        </header>

        {cart.length === 0 ? (
          <div className="cart-empty-x">
            <div className="empty-emoji">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add something beautiful to it</p>
            <Link to="/products" className="empty-cta">
              Browse Products →
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            {/* LEFT – ITEMS */}
            <section className="cart-items-x">
              {cart.map(item => {
                const minQty = retailerBulk ? (item.minBulkQty || 1) : 1
                const stockKnown = typeof item.stock === 'number'
                const maxQty = stockKnown && item.stock > 0 ? item.stock : null
                const atMin = item.qty <= minQty
                const atMax = maxQty != null && item.qty >= maxQty
                return (
                <div key={item.productId} className="cart-item-x">
                  <img src={item.image} alt={item.name} />

                  <div className="cart-mid">
                    <h3>{item.name}</h3>

                    <div className="price-row-x">
                      <span className="price-main">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>

                      {retailerBulk && (
                        <span className="bulk-pill">Bulk</span>
                      )}
                    </div>

                    {retailerBulk && item.minBulkQty > 1 && (
                      <div className="small-muted">Min bulk qty: {item.minBulkQty}</div>
                    )}

                    {/* 🔥 NEW QUANTITY COUNTER */}
                    <div className="qty-control-x">
                      <button
                        disabled={atMin}
                        title={atMin ? `Minimum quantity is ${minQty}` : undefined}
                        onClick={() =>
                          updateQty(item.productId, Math.max(minQty, item.qty - 1))
                        }
                      >
                        –
                      </button>

                      <span>{item.qty}</span>

                      <button
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
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-right">
                    <div className="line-total-x">
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </div>

                    <button
                      className="remove-x"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )})}
            </section>

            {/* RIGHT – SUMMARY */}
            <aside className="summary-x">
              <h2>Order Summary</h2>

              <div className="sum-row">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="sum-row total">
                <span>Total</span>
                <span>₹{totals.total.toLocaleString('en-IN')}</span>
              </div>

              <button
                className="checkout-x"
                onClick={() => navigate('/checkout')}
                disabled={blockers.length > 0}
                title={blockers.length > 0 ? blockers[0] : undefined}
              >
                Checkout →
              </button>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
