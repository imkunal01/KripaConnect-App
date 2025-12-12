import { useContext, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useContext(ShopContext)
  const navigate = useNavigate()
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
    return { subtotal, total: subtotal }
  }, [cart])

  const empty = cart.length === 0

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <h2>Shopping Cart</h2>
        {empty ? (
          <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Your cart is empty</div>
            <Link className="nav-btn" to="/products">Shop Products</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div>
              {cart.map(item => (
                <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 12 }}>
                  <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: 'contain', background: '#f8fafc', borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: '#334155' }}>₹{item.price}</div>
                  </div>
                  <div>
                    <input type="number" min={1} value={item.qty} onChange={e => updateQty(item.productId, Math.max(1, Number(e.target.value) || 1))} style={{ width: 64, padding: 6 }} />
                  </div>
                  <div style={{ width: 96, textAlign: 'right', fontWeight: 600 }}>₹{(item.price * item.qty).toFixed(2)}</div>
                  <button className="nav-btn" onClick={() => removeFromCart(item.productId)}>Remove</button>
                </div>
              ))}
            </div>
            <div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <hr />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700 }}>
                  <span>Total</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
                <button className="nav-btn signup-btn" disabled={empty} onClick={() => navigate('/checkout')} style={{ width: '100%', marginTop: 12 }}>Proceed to Checkout</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

