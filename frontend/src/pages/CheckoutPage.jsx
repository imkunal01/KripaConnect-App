import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import AddressForm from '../components/AddressForm.jsx'
import PaymentSelector from '../components/PaymentSelector.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import { createOrder } from '../services/orders'
import { createRazorpayOrder, verifyPayment } from '../services/payments'
import { updateProfile } from '../services/auth'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import {
  FiMapPin,
  FiCreditCard,
  FiCheckCircle,
  FiShield,
  FiArrowRight,
  FiArrowLeft,
  FiAlertTriangle,
  FiCheck,
  FiTruck,
  FiPackage,
  FiPlus,
  FiEdit2
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import './CheckoutPage.css'

let razorpayScriptPromise

function loadRazorpayScript() {
  if (globalThis.Razorpay) return Promise.resolve(true)
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => reject(new Error('Payment gateway could not be loaded.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Payment gateway could not be loaded. Please disable ad blockers and try again.'))
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export default function CheckoutPage() {
  const { cart, clearCart } = useContext(ShopContext)
  const { token, user, refreshMe } = useContext(AuthContext)
  const { mode } = usePurchaseMode()
  const navigate = useNavigate()

  const LARGE_BULK_QTY_THRESHOLD = 50

  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [address, setAddress] = useState({})
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [savingNewAddress, setSavingNewAddress] = useState(false)

  const [method, setMethod] = useState('razorpay')
  const [placing, setPlacing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

  const empty = cart.length === 0

  useEffect(() => {
    if (empty && !orderPlaced) navigate('/cart')
  }, [empty, navigate, orderPlaced])

  const savedList = useMemo(() => {
    return Array.isArray(user?.savedAddresses) ? user.savedAddresses : []
  }, [user])

  // Auto-select default or first address if available
  useEffect(() => {
    if (savedList.length > 0 && !selectedAddressId && !isAddingNewAddress) {
      const def = savedList.find(a => a?.default) || savedList[0]
      if (def) {
        setSelectedAddressId(def._id || '0')
        setAddress(def)
      }
    } else if (savedList.length === 0) {
      setIsAddingNewAddress(true)
    }
  }, [savedList, selectedAddressId, isAddingNewAddress])

  const itemsPayload = useMemo(
    () => cart.map(i => ({ product: i.productId, qty: i.qty })),
    [cart]
  )

  const totals = useMemo(() => {
    const totalQty = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0)
    const totalAmount = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0)
    return { totalQty, totalAmount }
  }, [cart])

  const checkoutTitle = mode === 'retailer' ? 'Retailer Bulk Checkout' : 'Secure Checkout'
  const showLargeBulkConfirm = mode === 'retailer' && totals.totalQty >= LARGE_BULK_QTY_THRESHOLD

  const addressDone = useMemo(() => {
    const a = address || {}
    return !!(
      a.name?.trim() &&
      a.phone?.trim() &&
      a.addressLine?.trim()
    )
  }, [address])

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id || '0')
    setAddress(addr)
    setIsAddingNewAddress(false)
  }

  const handleSaveAndUseNewAddress = async () => {
    if (!addressDone) {
      toast.error('Please fill in name, phone, and delivery address')
      return false
    }

    setSavingNewAddress(true)
    try {
      const normalized = {
        name: (address.name || user?.name || '').trim(),
        phone: (address.phone || user?.phone || '').trim(),
        addressLine: (address.addressLine || '').trim(),
        city: (address.city || 'Indore').trim(),
        state: (address.state || 'Madhya Pradesh').trim(),
        pincode: (address.pincode || '452001').trim(),
        default: savedList.length === 0
      }

      if (token) {
        const res = await updateProfile({ savedAddress: normalized }, token)
        await refreshMe?.(token)
        const updatedList = res.data?.savedAddresses || []
        const latest = updatedList[updatedList.length - 1] || normalized
        setAddress(latest)
        setSelectedAddressId(latest._id || '0')
      } else {
        setAddress(normalized)
      }

      setIsAddingNewAddress(false)
      toast.success('Address saved for delivery!')
      return true
    } catch (err) {
      toast.error(err.message || 'Failed to save address')
      return false
    } finally {
      setSavingNewAddress(false)
    }
  }

  const handleStep1Continue = async () => {
    if (isAddingNewAddress) {
      const success = await handleSaveAndUseNewAddress()
      if (!success) return
    }
    setStep(2)
  }

  async function placeOrder() {
    setPlacing(true)
    try {
      const res = await createOrder(
        { items: itemsPayload, shippingAddress: address, paymentMethod: method, purchaseMode: mode },
        token
      )
      const order = res.data?.data || res.data || {}
      
      if (!order._id) {
        throw new Error('Invalid order response from server')
      }

      if (method === 'COD') {
        setOrderPlaced(true)
        await clearCart()
        toast.success('Order placed successfully via Cash on Delivery!')
        navigate(`/success/${order._id}`)
        return
      }

      const pay = await createRazorpayOrder(order._id, token)
      const { keyId, razorpayOrder } = pay.data

      await loadRazorpayScript()

      const options = {
        key: keyId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'KripaConnect®',
        description: `Order #${order._id.slice(-8).toUpperCase()}`,
        handler: async (response) => {
          try {
            await verifyPayment(response, token)
            setOrderPlaced(true)
            await clearCart()
            toast.success('Payment verified! Order placed.')
            navigate(`/success/${order._id}`)
          } catch (err) {
            console.error(err)
            toast.error('Payment verification failed: ' + (err.message || 'Unknown error'))
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false)
          }
        },
        theme: {
          color: '#FF3D3D'
        }
      }

      const rzp = new globalThis.Razorpay(options)
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        toast.error(`Payment failed: ${response.error.description || 'Please try again'}`)
        setPlacing(false)
      })

      rzp.open()
    } catch (err) {
      console.error(err)
      toast.error('Failed to place order: ' + (err.message || 'Unknown error'))
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
    <div className="checkout-page">
      <Navbar />

      <main className="checkout-container">
        {/* Main Flow (Left) */}
        <section className="checkout-main-flow">
          {/* Step Progress Header */}
          <div className="checkout-steps-bar">
            <div className={`checkout-step-item ${step >= 1 ? 'is-active' : ''} ${step > 1 ? 'is-complete' : ''}`}>
              <div className="checkout-step-number">
                {step > 1 ? <FiCheck /> : '1'}
              </div>
              <span className="checkout-step-name">Shipping Address</span>
            </div>

            <div className="checkout-step-divider" />

            <div className={`checkout-step-item ${step >= 2 ? 'is-active' : ''} ${step > 2 ? 'is-complete' : ''}`}>
              <div className="checkout-step-number">
                {step > 2 ? <FiCheck /> : '2'}
              </div>
              <span className="checkout-step-name">Payment Method</span>
            </div>

            <div className="checkout-step-divider" />

            <div className={`checkout-step-item ${step >= 3 ? 'is-active' : ''}`}>
              <div className="checkout-step-number">3</div>
              <span className="checkout-step-name">Review & Confirm</span>
            </div>
          </div>

          <div className="checkout-header-area">
            <h1 className="checkout-title">{checkoutTitle}</h1>
            <div className="checkout-mode-indicator">
              <span className="mode-dot" />
              <span>{mode === 'retailer' ? 'Wholesale B2B Order Tier Active' : 'Standard Customer Order'}</span>
            </div>
          </div>

          {/* STEP 1: Shipping Address Selection */}
          {step === 1 && (
            <div className="checkout-card checkout-card--step fade-in">
              <div className="checkout-card-header">
                <FiMapPin className="checkout-card-icon" />
                <div style={{ flex: 1 }}>
                  <h2 className="checkout-section-heading">Select Delivery Address</h2>
                  <p className="checkout-section-sub">Choose where you want your order delivered or add a new address.</p>
                </div>

                {savedList.length > 0 && !isAddingNewAddress && (
                  <button
                    type="button"
                    className="checkout-btn-add-address"
                    onClick={() => {
                      setIsAddingNewAddress(true)
                      setAddress({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        addressLine: '',
                        city: 'Indore',
                        state: 'Madhya Pradesh',
                        pincode: '452001'
                      })
                    }}
                  >
                    <FiPlus /> Add New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses Grid */}
              {!isAddingNewAddress && savedList.length > 0 && (
                <div className="checkout-saved-addresses-grid">
                  {savedList.map((a, i) => {
                    const isSelected = selectedAddressId === (a._id || String(i))
                    return (
                      <div
                        key={a._id || i}
                        className={`checkout-saved-address-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectSavedAddress(a)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="checkout-address-radio">
                          <div className="checkout-address-radio-dot" />
                        </div>
                        <div className="checkout-address-body">
                          <div className="checkout-address-name-row">
                            <strong>{a.name}</strong>
                            {a.default && <span className="checkout-default-badge">Default</span>}
                          </div>
                          <div className="checkout-address-text">{a.addressLine}</div>
                          <div className="checkout-address-city">{a.city}, {a.state} - {a.pincode}</div>
                          <div className="checkout-address-phone">Phone: {a.phone}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add New Address Form */}
              {isAddingNewAddress && (
                <div className="checkout-new-address-form-wrap">
                  {savedList.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>Enter New Address Details:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewAddress(false)
                          if (savedList[0]) handleSelectSavedAddress(savedList[0])
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 750, cursor: 'pointer' }}
                      >
                        ← Choose from saved addresses
                      </button>
                    </div>
                  )}

                  <AddressForm value={address} onChange={setAddress} disabled={savingNewAddress} />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Payment Selector */}
          {step === 2 && (
            <div className="checkout-card checkout-card--step fade-in">
              <div className="checkout-card-header">
                <FiCreditCard className="checkout-card-icon" />
                <div>
                  <h2 className="checkout-section-heading">Choose Payment Method</h2>
                  <p className="checkout-section-sub">All transactions are encrypted with 256-bit SSL security.</p>
                </div>
              </div>

              <PaymentSelector method={method} onChange={setMethod} />
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="checkout-card checkout-card--step fade-in">
              <div className="checkout-card-header">
                <FiCheckCircle className="checkout-card-icon" />
                <div>
                  <h2 className="checkout-section-heading">Review Order Details</h2>
                  <p className="checkout-section-sub">Please verify delivery address and payment before confirming.</p>
                </div>
              </div>

              <div className="checkout-review-grid">
                <div className="checkout-review-box">
                  <div className="checkout-review-label">
                    <FiMapPin /> Delivery Address
                  </div>
                  <div className="checkout-review-content">
                    <strong>{address.name}</strong>
                    <div>{address.addressLine}</div>
                    <div>{address.city}, {address.state} - {address.pincode}</div>
                    <div>Phone: {address.phone}</div>
                  </div>
                  <button type="button" className="checkout-review-edit-btn" onClick={() => setStep(1)}>
                    Change Address
                  </button>
                </div>

                <div className="checkout-review-box">
                  <div className="checkout-review-label">
                    <FiCreditCard /> Payment Selected
                  </div>
                  <div className="checkout-review-content">
                    <strong>{method === 'COD' ? 'Cash on Delivery' : 'Online Payment (Razorpay UPI / Cards)'}</strong>
                    <div>{method === 'COD' ? 'Pay directly upon delivery' : 'Immediate secure digital transaction'}</div>
                  </div>
                  <button type="button" className="checkout-review-edit-btn" onClick={() => setStep(2)}>
                    Change Payment
                  </button>
                </div>
              </div>

              <div className="checkout-guarantee-banner">
                <FiShield className="checkout-guarantee-icon" />
                <div>
                  <strong>100% Purchase Protection</strong>
                  <div>Genuine products, official warranty, and easy 7-day replacements.</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="checkout-flow-actions">
            {step > 1 ? (
              <button
                type="button"
                className="checkout-btn-back"
                onClick={() => setStep(step - 1)}
                disabled={placing}
              >
                <FiArrowLeft /> Back
              </button>
            ) : (
              <Link to="/cart" className="checkout-btn-back">
                <FiArrowLeft /> Return to Cart
              </Link>
            )}

            {step === 1 ? (
              <button
                type="button"
                className="checkout-btn-primary"
                disabled={!addressDone || savingNewAddress}
                onClick={handleStep1Continue}
              >
                <span>{savingNewAddress ? 'Saving Address…' : 'Continue to Payment'}</span>
                <FiArrowRight />
              </button>
            ) : step === 2 ? (
              <button
                type="button"
                className="checkout-btn-primary"
                disabled={!method}
                onClick={() => setStep(3)}
              >
                <span>Continue to Review</span>
                <FiArrowRight />
              </button>
            ) : (
              <button
                type="button"
                className="checkout-btn-primary checkout-btn-primary--pay"
                disabled={placing}
                onClick={handlePlaceOrderClick}
              >
                {placing ? (
                  <>
                    <div className="checkout-spinner" />
                    <span>Processing Order…</span>
                  </>
                ) : (
                  <>
                    <FiCheck />
                    <span>{method === 'COD' ? 'Confirm & Place Order' : 'Pay & Complete Order'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Right: Order Summary Sidebar */}
        <aside className="checkout-sidebar">
          <OrderSummary items={cart} purchaseMode={mode} />
        </aside>
      </main>

      {/* Large Bulk Confirmation Modal */}
      {bulkConfirmOpen && (
        <div className="checkout-confirm-overlay" role="dialog" aria-modal="true">
          <div className="checkout-confirm-modal">
            <h3 className="checkout-confirm-title">Confirm Retailer Bulk Order</h3>
            <p className="checkout-confirm-text">
              You are placing a large wholesale order ({totals.totalQty} units). Please confirm you intend to proceed with <strong>Retailer B2B Terms</strong>.
            </p>

            <div className="checkout-confirm-metrics">
              <div>
                <span>Total Units</span>
                <strong>{totals.totalQty}</strong>
              </div>
              <div>
                <span>Order Total</span>
                <strong>₹{totals.totalAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="checkout-confirm-actions">
              <button
                type="button"
                className="checkout-confirm-cancel"
                onClick={() => setBulkConfirmOpen(false)}
                disabled={placing}
              >
                Cancel
              </button>
              <button
                type="button"
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
