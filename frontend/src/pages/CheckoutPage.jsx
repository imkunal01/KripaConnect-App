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
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const { cart, clearCart } = useContext(ShopContext)
  const { token, user } = useContext(AuthContext)
  const { mode } = usePurchaseMode()
  const navigate = useNavigate()

  const LARGE_BULK_QTY_THRESHOLD = 50

  const [step, setStep] = useState(1)
  const [address, setAddress] = useState({})
  const [method, setMethod] = useState('COD')
  const [placing, setPlacing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

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

  const totals = useMemo(() => {
    const totalQty = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0)
    const totalAmount = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0)
    return { totalQty, totalAmount }
  }, [cart])

  const checkoutTitle = mode === 'retailer' ? 'Retailer Bulk Checkout' : 'Customer Checkout'
  const showLargeBulkConfirm = mode === 'retailer' && totals.totalQty >= LARGE_BULK_QTY_THRESHOLD

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
        { items: itemsPayload, shippingAddress: address, paymentMethod: method, purchaseMode: mode },
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

  async function handlePlaceOrderClick() {
    if (placing) return
    if (showLargeBulkConfirm) {
      setBulkConfirmOpen(true)
      return
    }
    await placeOrder()
  }

  return (
    <div className="checkout-clean">
      <Navbar />

      <main className="checkout-wrap">
        {/* LEFT */}
        <section className="checkout-flow">
          <div className="flow-header">
            <span className="flow-step">Step {step} of 3</span>
            <h1>{checkoutTitle}</h1>
            <div className="checkout-mode-badge" role="note">
              {mode === 'retailer'
                ? `You are placing a Retailer Bulk order (min quantities apply).`
                : `You are placing a Customer order (standard pricing).`}
            </div>
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
                <p><strong>Order type</strong></p>
                <p>{mode === 'retailer' ? 'Retailer Bulk Checkout' : 'Customer Checkout'}</p>
              </div>

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
                onClick={handlePlaceOrderClick}
              >
                {placing ? 'Placing order…' : 'Place order'}
              </button>
            )}
          </div>
        </section>

        {/* RIGHT */}
        <aside className="checkout-summary">
          <OrderSummary items={cart} purchaseMode={mode} />
        </aside>
      </main>

      {bulkConfirmOpen && (
        <div className="checkout-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm bulk order">
          <div className="checkout-confirm-modal">
            <h3 className="checkout-confirm-title">Confirm Retailer Bulk Order</h3>
            <p className="checkout-confirm-text">
              This looks like a large bulk order ({totals.totalQty} units). Please confirm you intend to place a{' '}
              <strong>Retailer Bulk</strong> order.
            </p>

            <div className="checkout-confirm-metrics">
              <div><span>Units</span><strong>{totals.totalQty}</strong></div>
              <div><span>Total</span><strong>₹{totals.totalAmount.toLocaleString('en-IN')}</strong></div>
            </div>

            <div className="checkout-confirm-actions">
              <button
                className="checkout-confirm-cancel"
                onClick={() => setBulkConfirmOpen(false)}
                disabled={placing}
              >
                Cancel
              </button>
              <button
                className="checkout-confirm-confirm"
                onClick={async () => {
                  setBulkConfirmOpen(false)
                  await placeOrder()
                }}
                disabled={placing}
              >
                Confirm & Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
