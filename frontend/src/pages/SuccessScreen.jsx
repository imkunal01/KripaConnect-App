import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function SuccessScreen() {
  const { orderId } = useParams()
  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>✅</div>
        <h2>Order Placed Successfully</h2>
        <p style={{ color: '#334155' }}>Your order ID is {orderId}. We’ve sent a confirmation email.</p>
        <div style={{ marginTop: 16 }}>
          <Link className="nav-btn signup-btn" to="/products">Continue Shopping</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

