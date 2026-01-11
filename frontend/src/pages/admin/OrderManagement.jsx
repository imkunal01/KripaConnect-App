import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAllOrdersAdmin, updateOrderStatus, getOrderByIdAdmin, deleteOrderAdmin } from '../../services/admin'
import OrderTimeline from '../../components/OrderTimeline'

const statusOptions = ['pending', 'shipped', 'delivered', 'cancelled']

function getMongoObjectIdTimeMs(id) {
  if (typeof id !== 'string' || id.length < 8) return 0
  const tsHex = id.slice(0, 8)
  const seconds = Number.parseInt(tsHex, 16)
  return Number.isFinite(seconds) ? seconds * 1000 : 0
}

function getDocCreatedTimeMs(doc) {
  const createdAt = doc?.createdAt || doc?.created_at || doc?.orderDate || doc?.createdOn
  const t = createdAt ? Date.parse(createdAt) : NaN
  if (Number.isFinite(t)) return t
  return getMongoObjectIdTimeMs(doc?._id)
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return { bg: '#fff7ed', color: '#c2410c', label: 'Pending' }
    case 'shipped': return { bg: '#e9d5ff', color: '#7c3aed', label: 'Shipped' }
    case 'delivered': return { bg: '#d1fae5', color: '#166534', label: 'Delivered' }
    case 'cancelled': return { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' }
    default: return { bg: '#f3f4f6', color: '#374151', label: status }
  }
}

function getOrderModeTag(order) {
  const isRetailer = order?.user?.role === 'retailer'
  if (!isRetailer) return null

  const isBulk = order?.purchaseMode === 'retailer' || !!order?.isBulkOrder
  if (isBulk) {
    return {
      text: 'Retailer – Bulk Mode',
      bg: 'rgba(var(--kc-primary-rgb), 0.10)',
      color: 'var(--primary)',
      border: '1px solid rgba(var(--kc-primary-rgb), 0.25)'
    }
  }

  return {
    text: 'Retailer – Customer Mode',
    bg: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb'
  }
}

export default function OrderManagement() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    orderType: '',
    search: ''
  })

  useEffect(() => {
    loadOrders()
  }, [token])

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await getAllOrdersAdmin(token)
      const sorted = Array.isArray(data)
        ? data.slice().sort((a, b) => getDocCreatedTimeMs(b) - getDocCreatedTimeMs(a))
        : []
      setOrders(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      await updateOrderStatus(orderId, newStatus, token)
      await loadOrders()
      if (selectedOrder && selectedOrder._id === orderId) {
        const updated = await getOrderByIdAdmin(orderId, token)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  async function handleDeleteOrder(orderId) {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await deleteOrderAdmin(orderId, token)
        await loadOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(null)
        }
      } catch (err) {
        alert(err.message || 'Failed to delete order')
      }
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filters.status && order.deliveryStatus !== filters.status) return false
    if (filters.paymentMethod && order.paymentMethod !== filters.paymentMethod) return false
    if (filters.orderType === 'bulk' && !order.isBulkOrder) return false
    if (filters.orderType === 'customer' && order.isBulkOrder) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchesId = order._id.toLowerCase().includes(search)
      const matchesUser = order.user?.name?.toLowerCase().includes(search) || order.user?.email?.toLowerCase().includes(search)
      if (!matchesId && !matchesUser) return false
    }
    return true
  })

  if (loading) return <div className="adminEmpty">Loading…</div>

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Order Management</h1>
          <p className="adminPageHeader__subtitle">View and manage all orders</p>
        </div>
      </div>

      <div className="adminCard" style={{ marginBottom: 16 }}>
        <div className="adminCard__section">
          <div className="adminFieldRow" style={{ gap: 16 }}>
            <div className="adminFieldRow adminFieldRow--2" style={{ gap: 16 }}>
              <div>
                <label className="adminLabel">Status</label>
                <select
                  className="adminSelect"
                  value={filters.status}
                  onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{getStatusColor(s).label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="adminLabel">Payment</label>
                <select
                  className="adminSelect"
                  value={filters.paymentMethod}
                  onChange={e => setFilters({ ...filters, paymentMethod: e.target.value })}
                >
                  <option value="">All Methods</option>
                  <option value="COD">COD</option>
                  <option value="razorpay">UPI</option>
                </select>
              </div>
            </div>

            <div className="adminFieldRow adminFieldRow--2" style={{ gap: 16 }}>
              <div>
                <label className="adminLabel">Order Type</label>
                <select
                  className="adminSelect"
                  value={filters.orderType}
                  onChange={e => setFilters({ ...filters, orderType: e.target.value })}
                >
                  <option value="">All Orders</option>
                  <option value="customer">Customer</option>
                  <option value="bulk">Bulk Orders</option>
                </select>
              </div>
              <div>
                <label className="adminLabel">Search</label>
                <input
                  className="adminInput"
                  type="text"
                  placeholder="Order ID, customer name/email…"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`adminGrid ${selectedOrder ? 'adminGrid--2' : ''}`}>
        <div className="adminCard">
          <div className="adminCard__header">
            <h3 className="adminCard__title">Orders ({filteredOrders.length})</h3>
          </div>

          <div style={{ maxHeight: 640, overflowY: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div className="adminEmpty">No orders found</div>
            ) : (
              <div className="adminList">
                {filteredOrders.map(order => {
                  const statusStyle = getStatusColor(order.deliveryStatus || 'pending')
                  const modeTag = getOrderModeTag(order)
                  return (
                    <button
                      key={order._id}
                      type="button"
                      className={`adminListItem ${selectedOrder?._id === order._id ? 'isSelected' : ''}`}
                      onClick={() => getOrderByIdAdmin(order._id, token).then(res => setSelectedOrder(res.data))}
                      style={{ cursor: 'pointer', border: 0, width: '100%', textAlign: 'left' }}
                    >
                      <div className="adminListItem__main">
                        <div className="adminListItem__title">Order #{order._id.slice(-8).toUpperCase()}</div>
                        <div className="adminListItem__meta">{order.user?.name} ({order.user?.email})</div>
                        {modeTag && (
                          <div style={{ marginTop: 6 }}>
                            <span
                              className="adminBadge"
                              style={{
                                backgroundColor: modeTag.bg,
                                color: modeTag.color,
                                border: modeTag.border
                              }}
                            >
                              {modeTag.text}
                            </span>
                          </div>
                        )}
                        <div className="adminListItem__meta" style={{ marginTop: 6 }}>
                          {formatDate(order.createdAt)} • {order.paymentMethod === 'razorpay' ? 'UPI' : 'COD'}
                        </div>
                      </div>

                      <div className="adminListItem__side">
                        <div className="adminListItem__amount">₹{order.totalAmount?.toLocaleString('en-IN')}</div>
                        <span
                          className="adminBadge"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, borderColor: 'transparent' }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {selectedOrder && (
          <>
            <button
              type="button"
              className="adminOrderDetailsBackdrop"
              onClick={() => setSelectedOrder(null)}
              aria-label="Close order details"
            />

            <div className="adminCard adminOrderDetailsPanel" style={{ maxHeight: 640, overflowY: 'auto' }} role="dialog" aria-modal="true">
            <div className="adminCard__header">
              <h3 className="adminCard__title">Order Details</h3>
              <button type="button" className="adminBtn adminBtnGhost adminBtn--sm" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="adminCard__section">
              <div style={{ marginBottom: 16 }}>
                <OrderTimeline status={selectedOrder.deliveryStatus} orderDate={selectedOrder.createdAt} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="adminLabel">Update Status</label>
                <select
                  className="adminSelect"
                  value={selectedOrder.deliveryStatus || 'pending'}
                  onChange={e => handleStatusUpdate(selectedOrder._id, e.target.value)}
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{getStatusColor(s).label}</option>
                  ))}
                </select>
              </div>

              <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                <div className="adminHelp">Order ID</div>
                <div style={{ fontWeight: 900 }}>#{selectedOrder._id.slice(-8).toUpperCase()}</div>
              </div>

              <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                <div className="adminHelp">Customer</div>
                <div style={{ fontWeight: 900 }}>{selectedOrder.user?.name}</div>
                <div className="adminHelp">{selectedOrder.user?.email}</div>
              </div>

              {selectedOrder.shippingAddress && (
                <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                  <div className="adminHelp">Delivery Address</div>
                  <div style={{ fontWeight: 800 }}>{selectedOrder.shippingAddress.name}</div>
                  <div className="adminHelp">{selectedOrder.shippingAddress.addressLine}</div>
                  <div className="adminHelp">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</div>
                </div>
              )}

              <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                <div className="adminHelp" style={{ marginBottom: 8 }}>Items</div>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="adminCard" style={{ marginBottom: 10, boxShadow: 'none' }}>
                    <div className="adminCard__section" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900, marginBottom: 4 }}>{item.name || item.product?.name}</div>
                      <div className="adminHelp">
                        Qty: {item.qty} × ₹{item.price?.toLocaleString('en-IN')} = ₹{(item.qty * item.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)', fontWeight: 900 }}>
                  <span>Total</span>
                  <span>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="adminBtn adminBtnDanger adminBtn--full"
                  onClick={() => handleDeleteOrder(selectedOrder._id)}
                >
                  Delete Order
                </button>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

