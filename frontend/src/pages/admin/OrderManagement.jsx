import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAllOrdersAdmin, updateOrderStatus, getOrderByIdAdmin, deleteOrderAdmin } from '../../services/admin'
import OrderTimeline from '../../components/OrderTimeline'

const statusOptions = ['pending', 'shipped', 'delivered', 'cancelled']

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
      setOrders(data)
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

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Order Management</h1>
        <p style={{ color: '#6b7280' }}>View and manage all orders</p>
      </div>

      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Status</label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Status</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{getStatusColor(s).label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Payment</label>
            <select
              value={filters.paymentMethod}
              onChange={e => setFilters({ ...filters, paymentMethod: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Methods</option>
              <option value="COD">COD</option>
              <option value="razorpay">UPI</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Order Type</label>
            <select
              value={filters.orderType}
              onChange={e => setFilters({ ...filters, orderType: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Orders</option>
              <option value="customer">Customer</option>
              <option value="bulk">Bulk Orders</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Search</label>
            <input
              type="text"
              placeholder="Order ID, Customer..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 400px' : '1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Orders ({filteredOrders.length})</h3>
            </div>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No orders found</div>
            ) : (
              filteredOrders.map(order => {
                const statusStyle = getStatusColor(order.deliveryStatus || 'pending')
                return (
                  <div
                    key={order._id}
                    onClick={() => getOrderByIdAdmin(order._id, token).then(res => setSelectedOrder(res.data))}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      backgroundColor: selectedOrder?._id === order._id ? '#f3f4f6' : '#fff',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOrder?._id !== order._id) {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOrder?._id !== order._id) {
                        e.currentTarget.style.backgroundColor = '#fff'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          Order #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {order.user?.name} ({order.user?.email})
                        </div>
                        {order.isBulkOrder && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            padding: '2px 8px',
                            backgroundColor: '#fff1f2',
                            color: '#FF3D3D',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Bulk Order
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(order.createdAt)} • {order.paymentMethod === 'razorpay' ? 'UPI' : 'COD'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {selectedOrder && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <OrderTimeline status={selectedOrder.deliveryStatus} orderDate={selectedOrder.createdAt} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Update Status</label>
              <select
                value={selectedOrder.deliveryStatus || 'pending'}
                onChange={e => handleStatusUpdate(selectedOrder._id, e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{getStatusColor(s).label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Order ID</div>
              <div style={{ fontWeight: '600' }}>#{selectedOrder._id.slice(-8).toUpperCase()}</div>
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: '600' }}>{selectedOrder.user?.name}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>{selectedOrder.user?.email}</div>
            </div>

            {selectedOrder.shippingAddress && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Delivery Address</div>
                <div>{selectedOrder.shippingAddress.name}</div>
                <div>{selectedOrder.shippingAddress.addressLine}</div>
                <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Items</div>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name || item.product?.name}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Qty: {item.qty} × ₹{item.price?.toLocaleString('en-IN')} = ₹{(item.qty * item.price).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px' }}>
                <span>Total</span>
                <span>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => handleDeleteOrder(selectedOrder._id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fecaca'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fee2e2'}
              >
                Delete Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

