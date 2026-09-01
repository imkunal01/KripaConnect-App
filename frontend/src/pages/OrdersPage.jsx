import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { getMyOrders, cancelOrder, downloadInvoicePdf } from '../services/orders'
import { subscribeToUserOrders } from '../services/socket'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import { OrdersListSkeleton } from '../components/SkeletonLoader'
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiArrowRight,
  FiDownload,
  FiShoppingBag,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi'
import './OrdersPage.css'

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatShortId(id) {
  if (!id) return '—'
  const s = String(id)
  return s.length > 8 ? s.slice(-8).toUpperCase() : s.toUpperCase()
}

export default function OrdersPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getMyOrders(token)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load your orders')
      if (err?.response?.status === 401) navigate('/login')
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) return navigate('/login')
    loadOrders()

    const uId = user?._id || user?.id
    if (uId) {
      const unsubscribe = subscribeToUserOrders(uId, (updatedOrder) => {
        setOrders(prev => prev.map(o => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o)))
        toast.success(`Order #${formatShortId(updatedOrder._id)} status updated to ${updatedOrder.deliveryStatus || updatedOrder.status}`, {
          id: `order-status-${updatedOrder._id}`
        })
      })
      return () => unsubscribe()
    }
  }, [token, user, navigate, loadOrders])

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    try {
      await cancelOrder(id, token)
      toast.success('Order cancelled successfully')
      loadOrders()
    } catch (e) {
      toast.error(e?.message || 'Failed to cancel order')
    }
  }

  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'all') return true
    const st = (o.deliveryStatus || o.status || '').toLowerCase()
    if (activeFilter === 'active') return ['placed', 'processing', 'shipped'].includes(st)
    if (activeFilter === 'delivered') return st === 'delivered'
    if (activeFilter === 'cancelled') return st === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <div className="orders-page">
        <Navbar />
        <main className="orders-container">
          <header className="orders-header">
            <span className="orders-eyebrow">My Account</span>
            <h1 className="orders-title">Order History & Tracking</h1>
          </header>
          <OrdersListSkeleton count={3} />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="orders-page">
      <SEO
        title="My Orders & Shipments | KripaConnect"
        description="Track active shipments and view your complete order history on KripaConnect."
        canonical="/orders"
        robots="noindex, nofollow"
      />
      <Navbar />

      <main className="orders-container">
        {/* Header */}
        <header className="orders-header">
          <div>
            <span className="orders-eyebrow">Customer Dashboard</span>
            <h1 className="orders-title">My Orders & Tracking</h1>
            <p className="orders-subtitle">Track live status of your deliveries, download tax invoices, and reorder items.</p>
          </div>

          {/* Filter Pills */}
          <div className="orders-filter-pills">
            <button
              type="button"
              className={`orders-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              className={`orders-filter-btn ${activeFilter === 'active' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              In Transit
            </button>
            <button
              type="button"
              className={`orders-filter-btn ${activeFilter === 'delivered' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('delivered')}
            >
              Delivered
            </button>
          </div>
        </header>

        {error && (
          <div className="orders-error-alert">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="orders-empty-card">
            <div className="orders-empty-icon-wrap">
              <FiPackage />
            </div>
            <h2>No orders found</h2>
            <p>You have not placed any orders matching this filter yet.</p>
            <Link to="/products" className="orders-empty-cta">
              <FiShoppingBag /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const status = (order.deliveryStatus || order.status || 'placed').toLowerCase()
              const canCancel = ['placed', 'processing'].includes(status)
              const totalUnits = Array.isArray(order.items)
                ? order.items.reduce((s, it) => s + (Number(it.qty) || 0), 0)
                : 0

              return (
                <article key={order._id} className="order-card">
                  {/* Card Header */}
                  <div className="order-card-header">
                    <div className="order-card-meta">
                      <div className="order-id-row">
                        <span className="order-id">Order #{formatShortId(order._id)}</span>
                        <span className={`order-status-badge is-${status}`}>
                          {status === 'delivered' ? <FiCheckCircle /> : status === 'shipped' ? <FiTruck /> : <FiClock />}
                          <span>{status.toUpperCase()}</span>
                        </span>
                      </div>
                      <div className="order-date-text">
                        Placed on {formatDate(order.createdAt)}
                      </div>
                    </div>

                    <div className="order-card-actions">
                      <button
                        type="button"
                        className="order-btn-invoice"
                        onClick={() => downloadInvoicePdf(order._id, token)}
                      >
                        <FiDownload /> Invoice
                      </button>
                      <button
                        type="button"
                        className="order-btn-track"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        Track Details <FiArrowRight />
                      </button>
                    </div>
                  </div>

                  {/* Order Items Rail */}
                  <div className="order-items-rail">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="order-item-chip">
                        <img
                          src={it.product?.images?.[0]?.url || it.image || 'https://via.placeholder.com/50'}
                          alt={it.name || it.product?.name || 'Product'}
                          className="order-item-thumb"
                        />
                        <div className="order-item-info">
                          <span className="order-item-name">{it.name || it.product?.name}</span>
                          <span className="order-item-qty">Qty: {it.qty} × ₹{Number(it.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="order-card-footer">
                    <div className="order-footer-details">
                      <div>
                        <span className="order-footer-label">Payment</span>
                        <strong className="order-footer-val">
                          {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Razorpay)'}
                        </strong>
                      </div>
                      <div>
                        <span className="order-footer-label">Delivery Destination</span>
                        <strong className="order-footer-val">
                          {order.shippingAddress?.city || 'Local Delivery'}
                        </strong>
                      </div>
                    </div>

                    <div className="order-footer-right">
                      <div className="order-total-block">
                        <span className="order-footer-label">Total Amount</span>
                        <span className="order-total-price">
                          ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {canCancel && (
                        <button
                          type="button"
                          className="order-btn-cancel"
                          onClick={() => handleCancel(order._id)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
