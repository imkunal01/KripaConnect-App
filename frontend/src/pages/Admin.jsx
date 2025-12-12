import { useAuth } from '../hooks/useAuth.js'
import './Admin.css'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Admin() {
  const { user } = useAuth()
  return (
    <div>
      <Navbar />
      <div className="admin">
        <h2>Admin Panel</h2>
        <p>Welcome, {user?.name}. Admin-only area.</p>
      </div>
      <Footer />
    </div>
  )
}
