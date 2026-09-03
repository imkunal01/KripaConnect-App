import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  getAllOrdersAdmin,
  updateOrderStatus,
  deleteOrderAdmin
} from '../../services/admin'
import { subscribeToAdminOrders } from '../../services/socket'
import { AdminTableSkeleton } from '../../components/SkeletonLoader'
import {
  FiSearch,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMessageSquare,
  FiPhoneCall,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
  FiTrash2,
  FiMapPin,
  FiCreditCard,
  FiRefreshCw
} from 'react-icons/fi'
import toast from 'react-hot-toast'

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusStyle(status) {
  switch (status) {
    case 'pending':
      return { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', icon: <FiClock />, label: 'Pending' }
    case 'shipped':
      return { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed', icon: <FiTruck />, label: 'Shipped' }
    case 'delivered':
      return { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669', icon: <FiCheckCircle />, label: 'Delivered' }
    case 'cancelled':
      return { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: <FiXCircle />, label: 'Cancelled' }
    default:
      return { bg: '#f8fafc', border: '#e2e8f0', color: '#475569', icon: <FiPackage />, label: status || 'Unknown' }
  }
}

export default function OrderManagement() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedOrders, setExpandedOrders] = useState({})
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'bulk'
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
    const unsubscribe = subscribeToAdminOrders((updatedOrder) => {
      setOrders(prev => {
        const uId = updatedOrder._id || updatedOrder.id
        const idx = prev.findIndex(o => (o._id || o.id) === uId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...updatedOrder }
          return next
        }
        return [updatedOrder, ...prev]
      })
    })
    return () => unsubscribe()
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
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Instant 1-Tap Status Update (Zero Friction)
  async function handleQuickStatus(orderId, newStatus) {
    try {
      setUpdatingId(orderId)
      // Optimistic local state update
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, deliveryStatus: newStatus } : o)
      )

      await updateOrderStatus(orderId, newStatus, token)
      toast.success(`Order marked as ${newStatus}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update order status')
      loadOrders() // rollback on error
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!window.confirm('Are you sure you want to delete this order?')) return
    try {
      await deleteOrderAdmin(orderId, token)
      setOrders(prev => prev.filter(o => o._id !== orderId))
      toast.success('Order deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete order')
    }
  }

  function toggleExpand(orderId) {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  function handleCopy(text, label = 'Copied') {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Status Counts for Pill Filters
  const counts = useMemo(() => {
    let pending = 0
    let shipped = 0
    let delivered = 0
    let cancelled = 0
    let bulk = 0

    orders.forEach(o => {
      const s = o.deliveryStatus || 'pending'
      if (s === 'pending') pending++
      else if (s === 'shipped') shipped++
      else if (s === 'delivered') delivered++
      else if (s === 'cancelled') cancelled++

      if (o.isBulkOrder || o.purchaseMode === 'retailer') bulk++
    })

    return { total: orders.length, pending, shipped, delivered, cancelled, bulk }
  }, [orders])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter === 'pending' && (order.deliveryStatus || 'pending') !== 'pending') return false
      if (statusFilter === 'shipped' && order.deliveryStatus !== 'shipped') return false
      if (statusFilter === 'delivered' && order.deliveryStatus !== 'delivered') return false
      if (statusFilter === 'cancelled' && order.deliveryStatus !== 'cancelled') return false
      if (statusFilter === 'bulk' && !order.isBulkOrder && order.purchaseMode !== 'retailer') return false

      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const idMatch = order._id?.toLowerCase().includes(q)
        const nameMatch = order.user?.name?.toLowerCase().includes(q)
        const emailMatch = order.user?.email?.toLowerCase().includes(q)
        const phoneMatch = (order.shippingAddress?.phone || order.user?.phone || '').includes(q)
        if (!idMatch && !nameMatch && !emailMatch && !phoneMatch) return false
      }

      return true
    })
  }, [orders, statusFilter, search])

  return (
    <div className="adminPage adminOrderManagement">
      {/* ---------------- Header ---------------- */}
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Order Fulfillment Hub</h1>
          <p className="adminPageHeader__subtitle">
            Instant 1-tap dispatching, customer WhatsApp messaging, and tracking
          </p>
        </div>
        <button
          type="button"
          className="adminShortcutBtn"
          onClick={loadOrders}
          title="Refresh Orders"
        >
          <FiRefreshCw className={loading ? 'adminSpin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ---------------- Search & Filter Toolbar ---------------- */}
      <div className="adminCard" style={{ marginBottom: 16, padding: '14px 16px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '1rem'
            }}
          />
          <input
            type="text"
            className="adminInput"
            placeholder="Search Order ID, customer, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Horizontal Status Filter Pills */}
        <div className="adminStatusPills">
          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>All</span>
            <span className="adminStatusPillCount">{counts.total}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'pending' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('pending')}
            style={statusFilter === 'pending' ? { background: '#fff7ed', borderColor: '#fdba74', color: '#c2410c' } : {}}
          >
            <FiClock />
            <span>Pending</span>
            <span className="adminStatusPillCount" style={statusFilter === 'pending' ? { background: '#ea580c' } : {}}>
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'shipped' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('shipped')}
            style={statusFilter === 'shipped' ? { background: '#f5f3ff', borderColor: '#c4b5fd', color: '#7c3aed' } : {}}
          >
            <FiTruck />
            <span>Shipped</span>
            <span className="adminStatusPillCount" style={statusFilter === 'shipped' ? { background: '#7c3aed' } : {}}>
              {counts.shipped}
            </span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'delivered' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
            style={statusFilter === 'delivered' ? { background: '#ecfdf5', borderColor: '#6ee7b7', color: '#059669' } : {}}
          >
            <FiCheckCircle />
            <span>Delivered</span>
            <span className="adminStatusPillCount" style={statusFilter === 'delivered' ? { background: '#059669' } : {}}>
              {counts.delivered}
            </span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'bulk' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('bulk')}
          >
            <FiPackage />
            <span>Bulk Orders</span>
            <span className="adminStatusPillCount">{counts.bulk}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'cancelled' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            <FiXCircle />
            <span>Cancelled</span>
            <span className="adminStatusPillCount">{counts.cancelled}</span>
          </button>
        </div>
      </div>

      {/* ---------------- Order Cards Stream (Mobile First) ---------------- */}
      {loading ? (
        <AdminTableSkeleton rows={5} />
      ) : filteredOrders.length === 0 ? (
        <div className="adminCard" style={{ padding: '40px 16px', textAlign: 'center' }}>
          <FiPackage style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: 8 }} />
          <div style={{ fontWeight: 800, color: '#334155' }}>No orders found</div>
          <div className="adminHelp">Try changing search keywords or status filter</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredOrders.map(order => {
            const currentStatus = order.deliveryStatus || 'pending'
            const statusStyle = getStatusStyle(currentStatus)
            const isExpanded = Boolean(expandedOrders[order._id])
            const shortId = order._id ? order._id.slice(-8).toUpperCase() : 'UNKNOWN'
            const customerName = order.user?.name || order.shippingAddress?.fullName || 'Customer'
            const customerPhone = order.shippingAddress?.phone || order.user?.phone || ''
            const cleanPhone = customerPhone.replace(/\D/g, '')
            const isBulk = order.isBulkOrder || order.purchaseMode === 'retailer' || order.user?.role === 'retailer'
            const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 0
            const totalAmount = order.totalAmount || order.total || 0

            // WhatsApp link with pre-composed notification
            const waMessage = encodeURIComponent(
              `Hello ${customerName}, your KripaConnect order #${shortId} is currently ${statusStyle.label}. Total amount: ₹${totalAmount.toLocaleString('en-IN')}. Thank you for shopping with us!`
            )
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${waMessage}` : null

            return (
              <div
                key={order._id}
                className="adminCard"
                style={{
                  padding: '14px 16px',
                  boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)',
                  border: currentStatus === 'pending' ? '1px solid #fed7aa' : '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                {/* Top Row: Order ID, Mode Pill, Status Pill */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        #{shortId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order._id, 'Order ID')}
                        title="Copy Full ID"
                        style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                      >
                        <FiCopy style={{ fontSize: '0.85rem' }} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                      {formatDate(order.createdAt || order.orderDate)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isBulk && (
                      <span className="adminBadge" style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
                        Bulk / B2B
                      </span>
                    )}
                    <span
                      className="adminBadge"
                      style={{
                        background: statusStyle.bg,
                        borderColor: statusStyle.border,
                        color: statusStyle.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {statusStyle.icon}
                      <span>{statusStyle.label}</span>
                    </span>
                  </div>
                </div>

                {/* Customer & Payment Summary Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderTop: '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9',
                    gap: 10
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      {order.user?.email || 'No email'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                      <FiCreditCard style={{ fontSize: '0.75rem', color: '#64748b' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase' }}>
                        {order.paymentMethod || 'COD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Connect & Expand Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0 6px',
                    gap: 8
                  }}
                >
                  {/* WhatsApp, Call, Address Actions */}
                  <div className="adminQuickConnectRow">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adminQuickBtn adminQuickBtn--whatsapp"
                        title="Chat on WhatsApp"
                      >
                        <FiMessageSquare />
                        <span className="adminOnlyDesktop">WhatsApp</span>
                      </a>
                    ) : null}

                    {customerPhone ? (
                      <a
                        href={`tel:${customerPhone}`}
                        className="adminQuickBtn adminQuickBtn--call"
                        title="Call Customer"
                      >
                        <FiPhoneCall />
                        <span className="adminOnlyDesktop">Call</span>
                      </a>
                    ) : null}

                    {order.shippingAddress?.address && (
                      <button
                        type="button"
                        className="adminQuickBtn"
                        title="Copy Shipping Address"
                        onClick={() => handleCopy(
                          `${customerName}, ${order.shippingAddress.address}, ${order.shippingAddress.city || ''} ${order.shippingAddress.postalCode || ''}, Phone: ${customerPhone}`,
                          'Shipping Address'
                        )}
                      >
                        <FiMapPin />
                        <span className="adminOnlyDesktop">Address</span>
                      </button>
                    )}
                  </div>

                  {/* Accordion Toggle */}
                  <button
                    type="button"
                    className="adminHeaderBtn"
                    style={{ height: 32, fontSize: '0.76rem', padding: '0 10px' }}
                    onClick={() => toggleExpand(order._id)}
                  >
                    <span>{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>

                {/* Expandable Order Details (Accordion) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      animation: 'adminDropdownFade 0.15s ease'
                    }}
                  >
                    {/* Items List */}
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>
                      Purchased Items
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Array.isArray(order.items) && order.items.map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            paddingBottom: 6,
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            {it.product?.images?.[0]?.url && (
                              <img
                                src={it.product.images[0].url}
                                alt={it.product.name}
                                style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                              />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {it.product?.name || it.name || 'Product'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Qty: {it.quantity} × ₹{(it.price || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                            ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address Text */}
                    {order.shippingAddress && (
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.76rem', color: '#64748b', textTransform: 'uppercase' }}>
                          Delivery Address
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#1e293b', marginTop: 2, lineHeight: 1.4 }}>
                          {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Instant 1-Tap Action Dock (Zero Friction) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  {currentStatus === 'pending' && (
                    <button
                      type="button"
                      className="adminInstantActionBtn adminInstantActionBtn--success"
                      style={{ flex: 1 }}
                      disabled={updatingId === order._id}
                      onClick={() => handleQuickStatus(order._id, 'shipped')}
                    >
                      <FiTruck />
                      <span>Mark Shipped</span>
                    </button>
                  )}

                  {currentStatus === 'shipped' && (
                    <button
                      type="button"
                      className="adminInstantActionBtn adminInstantActionBtn--primary"
                      style={{ flex: 1 }}
                      disabled={updatingId === order._id}
                      onClick={() => handleQuickStatus(order._id, 'delivered')}
                    >
                      <FiCheckCircle />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
                    <button
                      type="button"
                      className="adminInstantActionBtn adminInstantActionBtn--danger"
                      disabled={updatingId === order._id}
                      onClick={() => {
                        if (window.confirm('Cancel this order?')) {
                          handleQuickStatus(order._id, 'cancelled')
                        }
                      }}
                      title="Cancel Order"
                    >
                      <FiXCircle />
                      <span>Cancel</span>
                    </button>
                  )}

                  {/* Status Dropdown Override */}
                  <select
                    className="adminSelect"
                    value={currentStatus}
                    onChange={(e) => handleQuickStatus(order._id, e.target.value)}
                    style={{
                      width: 'auto',
                      padding: '7px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      borderRadius: 10
                    }}
                    disabled={updatingId === order._id}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order._id)}
                    className="adminQuickBtn"
                    style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                    title="Delete Order Record"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
