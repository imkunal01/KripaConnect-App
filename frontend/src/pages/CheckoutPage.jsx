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
  const { token, user } = useContext(AuthContext)
  const [address, setAddress] = useState({})
  const [method, setMethod] = useState('COD')
  const [placing, setPlacing] = useState(false)
  const navigate = useNavigate()

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

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <h2>Checkout</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Delivery Address</div>
              <AddressForm value={address} onChange={setAddress} disabled={placing} />
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Payment Method</div>
              <PaymentSelector method={method} onChange={setMethod} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <OrderSummary items={cart} />
            <button className="nav-btn signup-btn" disabled={placing || empty} onClick={onPlaceOrder}>Place Order</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
