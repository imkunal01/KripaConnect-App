import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMyOrders } from '../services/orders'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './OrdersPage.css'

function getStatusColor(status) {
  switch (status) {
    case 'pending':
      return { bg: '#dbeafe', color: '#1e40af', label: 'Order Placed' }
    case 'shipped':
      return { bg: '#e9d5ff', color: '#7c3aed', label: 'Shipped' }
    case 'delivered':
      return { bg: '#d1fae5', color: '#166534', label: 'Delivered' }
    case 'cancelled':
      return { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' }
    default:
      return { bg: '#f3f4f6', color: '#374151', label: status }
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function OrdersPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadOrders()
  }, [token, navigate])

  async function loadOrders() {
    try {
      setLoading(true)
      setError('')
      const data = await getMyOrders(token)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, padding: '40px', textAlign: 'center' }}>Loading orders...</div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main style={{ flex: 1, padding: '1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700', color: '#111827' }}>My Orders</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>View and track your order history</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '60px 30px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#374151' }}>No orders yet</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/products')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => {
              const statusStyle = getStatusColor(order.deliveryStatus || 'pending')
              return (
                <div
                  key={order._id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', margin: '4px 0', fontSize: '14px' }}>
                        Placed on {formatDate(order.createdAt)}
                      </p>
                      <p style={{ color: '#6b7280', margin: '4px 0', fontSize: '14px' }}>
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                        ₹{order.totalAmount?.toLocaleString('en-IN') || '0'}
                      </p>
                      <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                        {order.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/orders/${order._id}`)
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
      
      <style>{`
        @media (min-width: 768px) {
          main {
            padding: 2.5rem 1.25rem !important;
          }
          h1 {
            font-size: 2rem !important;
            margin-bottom: 0.625rem !important;
          }
          p {
            font-size: 1rem !important;
          }
          .order-card {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

