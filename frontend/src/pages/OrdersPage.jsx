import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "../hooks/useAuth"
import { getMyOrders, cancelOrder } from "../services/orders"
import { subscribeToUserOrders } from "../services/socket"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SEO from "../components/SEO"
import { OrdersListSkeleton } from "../components/SkeletonLoader"
import "./OrdersPage.css"

function formatDate(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function OrdersPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getMyOrders(token)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || "Failed to load orders")
      if (err?.response?.status === 401) navigate("/login")
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) return navigate("/login")
    loadOrders()

    const uId = user?._id || user?.id
    if (uId) {
      const unsubscribe = subscribeToUserOrders(uId, (updatedOrder) => {
        setOrders(prev => prev.map(o => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o)))
        toast.success(`Order #${(updatedOrder._id || '').slice(-8).toUpperCase()} is now ${updatedOrder.deliveryStatus?.toUpperCase()} 🚚`, {
          id: `order-status-${updatedOrder._id}`
        })
      })
      return () => unsubscribe()
    }
  }, [token, user, navigate, loadOrders])

  function handleBuyAgain() {
    navigate("/products")
  }

  async function handleCancel(id) {
    if (!window.confirm("Cancel this order?")) return
    try {
      await cancelOrder(id, token)
      loadOrders()
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to cancel order')
    }
  }

  if (loading) {
    return (
      <div className="orders-page">
        <Navbar />
        <main className="orders-main">
          <header className="orders-header">
            <h1 className="orders-title">My Orders</h1>
            <p className="orders-subtitle">View and track your order history</p>
          </header>
          <OrdersListSkeleton count={4} />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="orders-page">
      <SEO
        title="My Orders | Order History & Tracking | KripaConnect"
        description="Track your active shipments and view complete order history on KripaConnect."
        canonical="/orders"
        robots="noindex, nofollow"
      />
      <Navbar />

      <main className="orders-main">
        <header className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">View and track your order history</p>
        </header>

        {error && <div className="orders-error">{error}</div>}

        {orders.length === 0 ? (
          <section className="orders-empty-state">
            <div className="orders-empty-icon">📦</div>
            <h2 className="orders-empty-title">No orders yet</h2>
            <p className="orders-empty-text">
              Start shopping to see your orders here
            </p>
            <button
              onClick={() => navigate("/products")}
              className="orders-btn orders-btn-primary"
            >
              Browse Products
            </button>
          </section>
        ) : (
          <section className="orders-list">
            {orders.map((order) => (
              <article
                key={order._id}
                className="orders-card"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                <header className="orders-card-header">
                  <div>
                    <h3 className="orders-card-id">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h3>
                    <span
                      className={`orders-status orders-status-${order.deliveryStatus}`}
                    >
                      {order.deliveryStatus || "Pending"}
                    </span>

                    <p className="orders-meta">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                    <p className="orders-meta">
                      {order.items?.length || 0} item
                      {(order.items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="orders-price">
                    <p className="orders-amount">
                      ₹{order.totalAmount?.toLocaleString("en-IN") || 0}
                    </p>
                    <p className="orders-payment">
                      {order.paymentMethod === "razorpay"
                        ? "Online Payment"
                        : "Cash on Delivery"}
                    </p>
                  </div>
                </header>

                <footer className="orders-card-footer">
                  <button
                    className="orders-btn orders-btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/orders/${order._id}`)
                    }}
                  >
                    View Details →
                  </button>

                  <button
                    className="orders-btn orders-btn-blue"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBuyAgain(order)
                    }}
                  >
                    Buy Again
                  </button>

                  {order.deliveryStatus === "pending" && (
                    <button
                      className="orders-btn orders-btn-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancel(order._id)
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                </footer>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
