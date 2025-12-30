import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import AddressForm from '../components/AddressForm.jsx'
import PaymentSelector from '../components/PaymentSelector.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import { createOrder } from '../services/orders'
import { createRazorpayOrder, verifyPayment } from '../services/payments'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const { cart, clearCart } = useContext(ShopContext)
  const { token, user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [address, setAddress] = useState({})
  const [method, setMethod] = useState('COD')
  const [placing, setPlacing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const empty = cart.length === 0

  useEffect(() => {
    if (empty && !orderPlaced) navigate('/cart')
  }, [empty, navigate, orderPlaced])

  // If user hasn't completed onboarding (no saved address), send them to onboarding first.
  useEffect(() => {
    if (!token) return
    const list = Array.isArray(user?.savedAddresses) ? user.savedAddresses : []
    if (user && list.length === 0) {
      navigate('/onboarding?next=/checkout', { replace: true })
    }
  }, [token, user, navigate])

  // Auto-prefill address from savedAddresses (default/first) for logged-in users
  useEffect(() => {
    const list = Array.isArray(user?.savedAddresses) ? user.savedAddresses : []
    if (!list.length) return

    const def = list.find(a => a?.default) || list[0]
    const current = address || {}
    const isEmpty =
      !current.name &&
      !current.phone &&
      !current.addressLine &&
      !current.city &&
      !current.state &&
      !current.pincode

    if (isEmpty && def) setAddress(def)
  }, [user])

  const itemsPayload = useMemo(
    () => cart.map(i => ({ product: i.productId, qty: i.qty })),
    [cart]
  )

  const addressDone =
    address.name &&
    address.phone &&
    address.addressLine &&
    address.city &&
    address.state &&
    address.pincode

  async function placeOrder() {
    setPlacing(true)
    try {
      const res = await createOrder(
        { items: itemsPayload, shippingAddress: address, paymentMethod: method },
        token
      )
      // Robustly handle response structure
      const order = res.data?.data || res.data || {}
      
      if (!order._id) {
        throw new Error('Invalid order response from server')
      }

      if (method === 'COD') {
        setOrderPlaced(true)
        await clearCart()
        navigate(`/success/${order._id}`)
        return
      }

      const pay = await createRazorpayOrder(order._id, token)
      const { keyId, razorpayOrder } = pay.data

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        throw new Error('Payment gateway could not be loaded. Please disable ad blockers and try again.')
      }

      const options = {
        key: keyId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'BIZ LINK®',
        description: 'Order Payment',
        handler: async res => {
          try {
            await verifyPayment(res, token)
            setOrderPlaced(true)
            await clearCart()
            navigate(`/success/${order._id}`)
          } catch (err) {
            console.error(err)
            alert('Payment verification failed: ' + (err.message || 'Unknown error'))
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false)
          }
        },
        theme: {
          color: '#3399cc'
        }
      }

      const rzp = new window.Razorpay(options)
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        alert(`Payment failed: ${response.error.description || 'Please try again'}`)
        setPlacing(false)
      })

      rzp.open()
    } catch (err) {
      console.error(err)
      alert('Failed to place order: ' + (err.message || 'Unknown error'))
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="checkout-clean">
      <Navbar />

      <main className="checkout-wrap">
        {/* LEFT */}
        <section className="checkout-flow">
          <div className="flow-header">
            <span className="flow-step">Step {step} of 3</span>
            <h1>Checkout</h1>
          </div>

          {step === 1 && (
            <>
              <h2>Shipping address</h2>

              {user?.savedAddresses?.length > 0 && (
                <div className="saved-list">
                  {user.savedAddresses.map((a, i) => (
                    <button
                      key={i}
                      className={`saved-item ${
                        JSON.stringify(address) === JSON.stringify(a)
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => setAddress(a)}
                    >
                      <strong>{a.name}</strong>
                      <span>{a.city}, {a.state}</span>
                    </button>
                  ))}
                </div>
              )}

              <AddressForm value={address} onChange={setAddress} />
            </>
          )}

          {step === 2 && (
            <>
              <h2>Payment</h2>
              {method === 'razorpay' && (
                <div style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  💡 <strong>Note:</strong> If payment fails to load, please disable ad blockers or privacy extensions and try again.
                </div>
              )}
              <PaymentSelector method={method} onChange={setMethod} />
            </>
          )}

          {step === 3 && (
            <>
              <h2>Review</h2>
              <div className="review-block">
                <p><strong>Deliver to</strong></p>
                <p>
                  {address.name}<br />
                  {address.addressLine}<br />
                  {address.city}, {address.state}
                </p>
              </div>

              <div className="review-block">
                <p><strong>Payment</strong></p>
                <p>{method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
              </div>
            </>
          )}

          <div className="flow-actions">
            {step > 1 && (
              <button className="link-btn" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}

            {step < 3 ? (
              <button
                className="primary-btn"
                disabled={(step === 1 && !addressDone) || (step === 2 && !method)}
                onClick={() => setStep(step + 1)}
              >
                Continue →
              </button>
            ) : (
              <button
                className="primary-btn"
                disabled={placing}
                onClick={placeOrder}
              >
                {placing ? 'Placing order…' : 'Place order'}
              </button>
            )}
          </div>
        </section>

        {/* RIGHT */}
        <aside className="checkout-summary">
          <OrderSummary items={cart} />
        </aside>
      </main>

      <Footer />
    </div>
  )
}
