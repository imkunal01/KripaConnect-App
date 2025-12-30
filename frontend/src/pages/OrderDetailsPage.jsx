import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getOrderById } from '../services/orders'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import OrderTimeline from '../components/OrderTimeline'

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (id) {
      loadOrder()
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, padding: '40px', textAlign: 'center' }}>Loading order details...</div>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error || 'Order not found'}
          </div>
          <button
            onClick={() => navigate('/orders')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#FF3D3D',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to Orders
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => navigate('/orders')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '14px'
            }}
          >
            ← Back to Orders
          </button>
          <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
            Order Details
          </h1>
          <p style={{ color: '#666' }}>
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <OrderTimeline status={order.deliveryStatus} orderDate={order.createdAt} />
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
              Order Summary
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Order ID</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  #{order._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Order Date</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Payment Method</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {order.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Payment Status</span>
                <span style={{
                  fontWeight: '500',
                  color: order.paymentStatus === 'paid' ? '#10b981' : order.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b'
                }}>
                  {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Total Amount</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  ₹{order.totalAmount?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {order.shippingAddress && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
              Delivery Address
            </h3>
            <div style={{ color: '#374151', lineHeight: '1.8' }}>
              <p style={{ margin: '4px 0', fontWeight: '500' }}>{order.shippingAddress.name}</p>
              {order.shippingAddress.phone && (
                <p style={{ margin: '4px 0' }}>Phone: {order.shippingAddress.phone}</p>
              )}
              <p style={{ margin: '4px 0' }}>{order.shippingAddress.addressLine}</p>
              <p style={{ margin: '4px 0' }}>
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>
          </div>
        )}

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
            Ordered Items ({order.items?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {order.items && order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              >
                {item.product?.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.name || item.product?.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      backgroundColor: '#fff'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af'
                  }}>
                    No Image
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                    {item.name || item.product?.name || 'Product'}
                  </h4>
                  {item.product?.description && (
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      {item.product.description.substring(0, 100)}...
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      Quantity: <strong>{item.qty}</strong>
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      Price: <strong>₹{item.price?.toLocaleString('en-IN')}</strong>
                    </span>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: '600', marginLeft: 'auto' }}>
                      ₹{(item.price * item.qty)?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

