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

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const { cart, removeFromCart } = useContext(ShopContext)
  const { token, user, role } = useContext(AuthContext)
  const [address, setAddress] = useState({})
  const [method, setMethod] = useState('COD')
  const [placing, setPlacing] = useState(false)
  const navigate = useNavigate()
  const isRetailer = role === 'retailer'

  const itemsPayload = useMemo(() => cart.map(i => ({ product: i.productId, qty: i.qty })), [cart])
  const empty = cart.length === 0

  useEffect(() => {
    if (empty) navigate('/cart')
  }, [empty, navigate])

  async function onPlaceOrder() {
    if (!address.name || !address.phone || !address.addressLine || !address.city || !address.state || !address.pincode) {
      alert('Please fill delivery address')
      return
    }
    if (!method) {
      alert('Please select a payment method')
      return
    }
    setPlacing(true)
    try {
      const orderRes = await createOrder({ items: itemsPayload, shippingAddress: address, paymentMethod: method }, token)
      const order = orderRes?.data
      if (method === 'COD') {
        // Clear local cart UI
        cart.forEach(i => removeFromCart(i.productId))
        navigate(`/success/${order._id}`)
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error('Failed to load Razorpay')
      const paymentInit = await createRazorpayOrder(order._id, token)
      const { keyId, razorpayOrder } = paymentInit?.data || {}
      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Kripa Connect',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        prefill: { name: user?.name, email: user?.email },
        notes: { orderId: order._id },
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, token)
          } catch (e) {
            console.warn('verifyPayment error', e?.message)
          }
          // Clear local cart UI
          cart.forEach(i => removeFromCart(i.productId))
          navigate(`/success/${order._id}`)
        },
        theme: { color: '#0ea5e9' }
      }
      const rp = new window.Razorpay(options)
      rp.open()
    } catch (err) {
      alert(err.message || 'Order failed')
    } finally {
      setPlacing(false)
    }
  }

  const [currentStep, setCurrentStep] = useState(1)
  const steps = [
    { number: 1, label: 'Shipping Address' },
    { number: 2, label: 'Payment Method' },
    { number: 3, label: 'Review & Confirm' }
  ]

  const isAddressComplete = address.name && address.phone && address.addressLine && address.city && address.state && address.pincode

  function handleNext() {
    if (currentStep === 1 && isAddressComplete) {
      setCurrentStep(2)
    } else if (currentStep === 2 && method) {
      setCurrentStep(3)
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
          {isRetailer && (
            <span className="checkout-badge">B2B Bulk Order</span>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="checkout-progress">
          {steps.map((step, idx) => (
            <div key={step.number} className="checkout-step">
              <div className="checkout-step-content">
                <div className={`checkout-step-circle ${currentStep >= step.number ? 'active' : 'inactive'}`}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <div className={`checkout-step-label ${currentStep >= step.number ? 'active' : 'inactive'}`}>
                  {step.label}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`checkout-step-line ${currentStep > step.number ? 'active' : 'inactive'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          {/* Main Content */}
          <div className="checkout-main">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div className="checkout-step-card">
                <h2 className="checkout-step-card-title">Delivery Address</h2>
                <AddressForm value={address} onChange={setAddress} disabled={placing} />
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="checkout-step-card">
                <h2 className="checkout-step-card-title">Payment Method</h2>
                <PaymentSelector method={method} onChange={setMethod} />
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="checkout-step-card">
                <h2 className="checkout-step-card-title">Review Your Order</h2>
                <div className="checkout-review-section">
                  <h3 className="checkout-review-title">Delivery Address</h3>
                  <p className="checkout-review-content">
                    {address.name}<br />
                    {address.addressLine}<br />
                    {address.city}, {address.state} {address.pincode}<br />
                    Phone: {address.phone}
                  </p>
                </div>
                <div className="checkout-review-section">
                  <h3 className="checkout-review-title">Payment Method</h3>
                  <p className="checkout-review-content">
                    {method === 'COD' ? 'Cash on Delivery' : 'UPI / Online Payment'}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="checkout-navigation">
              {currentStep > 1 && (
                <button onClick={handleBack} className="checkout-nav-button back">
                  ← Back
                </button>
              )}
              <div className="checkout-nav-spacer" />
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={(currentStep === 1 && !isAddressComplete) || (currentStep === 2 && !method)}
                  className={`checkout-nav-button continue ${((currentStep === 1 && !isAddressComplete) || (currentStep === 2 && !method)) ? 'disabled' : ''}`}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={onPlaceOrder}
                  disabled={placing || empty}
                  className={`checkout-nav-button place-order ${(placing || empty) ? 'disabled' : ''}`}
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary-sticky">
            <OrderSummary items={cart} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
