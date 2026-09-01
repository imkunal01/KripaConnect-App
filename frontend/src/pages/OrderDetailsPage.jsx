import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { getOrderById, cancelOrder, downloadInvoicePdf } from '../services/orders'
import { subscribeToOrder } from '../services/socket'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import { OrderDetailsSkeleton } from '../components/SkeletonLoader'
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiDownload,
  FiMapPin,
  FiCreditCard,
  FiShield,
  FiPhone,
  FiHelpCircle,
  FiShoppingBag,
  FiAlertTriangle
} from 'react-icons/fi'
import './OrderDetailsPage.css'

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatShortId(id) {
  if (!id) return '—'
  const s = String(id)
  return s.length > 8 ? s.slice(-8).toUpperCase() : s.toUpperCase()
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (id) {
      loadOrder()

      // Real-time live status update listener
      const unsubscribe = subscribeToOrder(id, (updatedOrder) => {
        setOrder(prev => ({
          ...prev,
          ...updatedOrder,
          items: updatedOrder.items || prev?.items || []
        }))
        toast.success(`Order status updated: ${String(updatedOrder.deliveryStatus || '').toUpperCase()} 🚚`, {
          id: `order-update-${id}`,
          duration: 4000
        })
      })

      return () => unsubscribe()
    }
  }, [id, token, navigate])

  async function loadOrder() {
    try {
      setLoading(true)
      setError('')
      const data = await getOrderById(id, token)
      setOrder(data)
    } catch (err) {
      setError(err.message || 'Failed to load order details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    try {
      setCancelling(true)
      await cancelOrder(order._id, token)
      toast.success('Order cancelled successfully')
      loadOrder()
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadInvoice = () => {
    downloadInvoicePdf(order._id, token)
  }

  if (loading) {
    return (
      <div className="order-details-page">
        <Navbar />
        <main className="order-details-container">
          <OrderDetailsSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <Navbar />
        <main className="order-details-container">
          <div className="order-details-error-card">
            <FiAlertTriangle className="order-error-icon" />
            <h2>Order Not Found</h2>
            <p>{error || 'We could not find details for this order. It may have been removed or the ID is invalid.'}</p>
            <Link to="/orders" className="order-btn-back-link">
              <FiArrowLeft /> Back to My Orders
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const status = (order.deliveryStatus || order.status || 'placed').toLowerCase()
  const isCancelled = status === 'cancelled'
  const canCancel = ['placed', 'processing'].includes(status)

  // Timeline steps
  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received & Verified' },
    { key: 'processing', label: 'Processing', desc: 'Quality Check & Packed' },
    { key: 'shipped', label: 'Dispatched', desc: 'In-Transit to Destination' },
    { key: 'delivered', label: 'Delivered', desc: 'Handed to Recipient' },
  ]

  const statusOrder = { placed: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 }
  const currentStepIdx = statusOrder[status] ?? 0

  return (
    <div className="order-details-page">
      <SEO
        title={`Order #${formatShortId(order._id)} Details | KripaConnect`}
        description={`Track shipment status, view invoice, and delivery destination for order #${formatShortId(order._id)}.`}
        canonical={`/orders/${order._id}`}
        robots="noindex, nofollow"
      />
      <Navbar />

      <main className="order-details-container">
        {/* Navigation Breadcrumb / Back button */}
        <div className="order-details-top-bar">
          <button
            type="button"
            className="order-details-back-btn"
            onClick={() => navigate('/orders')}
          >
            <FiArrowLeft /> Back to All Orders
          </button>

          <div className="order-details-live-beacon">
            <span className="live-dot" />
            <span>Live Order Tracking</span>
          </div>
        </div>

        {/* Hero Order Header */}
        <header className="order-details-hero">
          <div className="order-hero-left">
            <div className="order-hero-id-row">
              <h1 className="order-hero-title">Order #{formatShortId(order._id)}</h1>
              <span className={`order-status-pill is-${status}`}>
                {status === 'placed' && <FiClock />}
                {status === 'processing' && <FiPackage />}
                {status === 'shipped' && <FiTruck />}
                {status === 'delivered' && <FiCheckCircle />}
                {status === 'cancelled' && <FiXCircle />}
                <span>{status.toUpperCase()}</span>
              </span>
            </div>
            <p className="order-hero-date">
              Placed on {formatDate(order.createdAt)} • {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="order-hero-actions">
            <button
              type="button"
              className="order-action-btn order-action-btn--invoice"
              onClick={handleDownloadInvoice}
            >
              <FiDownload /> Download GST Invoice
            </button>

            {canCancel && (
              <button
                type="button"
                className="order-action-btn order-action-btn--cancel"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                <FiXCircle /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
          </div>
        </header>

        {/* Live Tracking Progress Stepper Card */}
        <section className="order-tracking-card">
          <div className="order-tracking-header">
            <h3>Shipment Progress</h3>
            <span className="order-tracking-status-text">
              {isCancelled ? 'Order Cancelled' : `Currently: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
            </span>
          </div>

          {!isCancelled ? (
            <div className="order-stepper-track">
              {steps.map((st, i) => {
                const isComplete = i <= currentStepIdx
                const isCurrent = i === currentStepIdx
                return (
                  <div
                    key={st.key}
                    className={`order-stepper-node ${isComplete ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''}`}
                  >
                    <div className="order-node-circle">
                      {isComplete ? <FiCheckCircle /> : i + 1}
                    </div>
                    <div className="order-node-labels">
                      <strong className="order-node-title">{st.label}</strong>
                      <span className="order-node-desc">{st.desc}</span>
                    </div>
                    {i < steps.length - 1 && <div className="order-node-connector" />}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="order-cancelled-notice">
              <FiXCircle className="order-cancelled-icon" />
              <div>
                <strong>Order Cancelled</strong>
                <p>This order was cancelled. Any online payment initiated will be refunded to your original payment method within 3-5 business days.</p>
              </div>
            </div>
          )}
        </section>

        {/* Main 2-Column Responsive Body */}
        <div className="order-details-grid">
          {/* Left Column: Items Manifest */}
          <section className="order-items-manifest-card">
            <div className="order-card-header">
              <FiPackage className="order-card-header-icon" />
              <div>
                <h2>Ordered Items ({order.items?.length || 0})</h2>
                <p>Detailed breakdown of products in this shipment.</p>
              </div>
            </div>

            <div className="order-manifest-list">
              {order.items?.map((item, idx) => {
                const img = item.product?.images?.[0]?.url || item.image || item.product?.images?.[0] || 'https://via.placeholder.com/100'
                const name = item.name || item.product?.name || 'Electronic Product'
                const qty = item.qty || 1
                const unitPrice = Number(item.price || 0)
                const itemTotal = unitPrice * qty
                const cat = item.product?.category_id?.name || item.product?.Category?.name || 'Consumer Appliance'

                return (
                  <div key={item._id || idx} className="order-manifest-row">
                    <div className="order-manifest-thumb-wrap">
                      <img src={img} alt={name} loading="lazy" />
                    </div>

                    <div className="order-manifest-info">
                      <span className="order-manifest-cat">{cat}</span>
                      <h3 className="order-manifest-name">{name}</h3>
                      <div className="order-manifest-meta">
                        <span>Unit Rate: <strong>₹{unitPrice.toLocaleString('en-IN')}</strong></span>
                        <span>Quantity: <strong>{qty}</strong></span>
                      </div>
                    </div>

                    <div className="order-manifest-price-block">
                      <span className="order-manifest-total">₹{itemTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Right Column: Destination, Billing & Guarantee */}
          <aside className="order-details-sidebar">
            {/* Delivery Destination */}
            <div className="order-sidebar-card">
              <div className="order-sidebar-header">
                <FiMapPin className="order-sidebar-icon" />
                <h3>Delivery Destination</h3>
              </div>
              <div className="order-address-box">
                <strong className="order-address-name">{order.shippingAddress?.name || user?.name || 'Customer'}</strong>
                <p className="order-address-line">{order.shippingAddress?.addressLine || 'Indore Delivery Depot'}</p>
                <p className="order-address-city">
                  {order.shippingAddress?.city || 'Indore'}, {order.shippingAddress?.state || 'Madhya Pradesh'} - <strong>{order.shippingAddress?.pincode || '452001'}</strong>
                </p>
                <div className="order-address-phone">
                  <FiPhone /> {order.shippingAddress?.phone || user?.phone || 'Contact on file'}
                </div>
              </div>
            </div>

            {/* Billing & Payment Details */}
            <div className="order-sidebar-card">
              <div className="order-sidebar-header">
                <FiCreditCard className="order-sidebar-icon" />
                <h3>Payment & Billing</h3>
              </div>

              <div className="order-billing-breakdown">
                <div className="order-billing-row">
                  <span>Payment Method</span>
                  <strong className="order-payment-method">
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
                  </strong>
                </div>

                <div className="order-billing-row">
                  <span>Payment Status</span>
                  <span className={`order-pay-status-pill is-${(order.paymentStatus || 'pending').toLowerCase()}`}>
                    {order.paymentStatus === 'paid' ? 'PAID' : order.paymentStatus === 'failed' ? 'FAILED' : 'PENDING'}
                  </span>
                </div>

                <div className="order-billing-row">
                  <span>Shipping & Handling</span>
                  <span className="order-free-badge">FREE Express Delivery</span>
                </div>

                <div className="order-billing-row">
                  <span>GST & Applicable Taxes</span>
                  <span className="order-tax-incl">Included (18% GST)</span>
                </div>

                <div className="order-billing-divider" />

                <div className="order-billing-total-row">
                  <span>Total Amount</span>
                  <span className="order-grand-total">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Official Warranty & Guarantee */}
            <div className="order-sidebar-card order-guarantee-box">
              <FiShield className="order-guarantee-icon" />
              <div>
                <strong>Official Brand Warranty Included</strong>
                <p>All items in this order are 100% genuine and eligible for manufacturer warranty and 7-day hassle-free replacements.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
