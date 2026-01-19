import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AdminDashboard from './admin/AdminDashboard'
import ProductManagement from './admin/ProductManagement'
import CategoryManagement from './admin/CategoryManagement'
import SubcategoryManagement from './admin/SubcategoryManagement'
import OrderManagement from './admin/OrderManagement'
import UserManagement from './admin/UserManagement'
import ReviewModeration from './admin/ReviewModeration'
import { FaBars, FaChartPie, FaBoxOpen, FaTags, FaSitemap, FaShoppingBag, FaUsers, FaStar, FaSignOutAlt } from 'react-icons/fa'
import './Admin.css'
import './admin/AdminUI.css'

export default function Admin() {
  const { user, role, token, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => (location.hash.replace('#', '') || 'dashboard'))
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Check if user is admin
    if (!token) {
      navigate('/login')
      return
    }
    if (role !== 'admin') {
      navigate('/')
      return
    }
  }, [token, role, navigate, location])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setMenuOpen(false) // Close mobile menu when tab changes
    navigate(`/admin#${tab}`, { replace: true })
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartPie />, component: AdminDashboard },
    { id: 'products', label: 'Products', icon: <FaBoxOpen />, component: ProductManagement },
    { id: 'categories', label: 'Categories', icon: <FaTags />, component: CategoryManagement },
    { id: 'subcategories', label: 'Subcategories', icon: <FaSitemap />, component: SubcategoryManagement },
    { id: 'orders', label: 'Orders', icon: <FaShoppingBag />, component: OrderManagement },
    { id: 'users', label: 'Users', icon: <FaUsers />, component: UserManagement },
    { id: 'reviews', label: 'Reviews', icon: <FaStar />, component: ReviewModeration },
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || AdminDashboard

  if (role !== 'admin') {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>Admin access required</p>
        </div>
        <Footer />
      </div>
    )
  }

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Dashboard'

  return (
    <div className="adminShell">
      <Navbar />

      <div className="adminLayout">
        <button
          type="button"
          className="adminMobileToggle"
          onClick={() => setMenuOpen(open => !open)}
          aria-expanded={menuOpen}
          aria-controls="adminSidebar"
        >
          <FaBars aria-hidden="true" />
          <span>Menu</span>
        </button>

        {menuOpen && (
          <button
            type="button"
            className="adminBackdrop"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
        )}

        <aside
          id="adminSidebar"
          className={`adminSidebar ${menuOpen ? 'isOpen' : ''}`}
        >
          <div className="adminSidebar__header">
            <div className="adminSidebar__title">Admin</div>
            <div className="adminSidebar__subtitle">{user?.name ? `Signed in as ${user.name}` : 'Signed in'}</div>
          </div>

          <nav className="adminNav" aria-label="Admin navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`adminNavItem ${activeTab === tab.id ? 'isActive' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="adminNavItem__icon" aria-hidden="true">{tab.icon}</span>
                <span className="adminNavItem__label">{tab.label}</span>
              </button>
            ))}

            <div className="adminNav__divider" />

            <button
              type="button"
              className="adminNavItem adminNavItem--danger"
              onClick={async () => {
                await signOut()
                navigate('/login')
              }}
            >
              <span className="adminNavItem__icon" aria-hidden="true"><FaSignOutAlt /></span>
              <span className="adminNavItem__label">Logout</span>
            </button>
          </nav>
        </aside>

        <main className="adminMain">
          <div className="adminTopbar">
            <div className="adminTopbar__title">{activeTabLabel}</div>
            <div className="adminTopbar__meta">Admin Panel</div>
          </div>

          <div className="adminContent">
            <ActiveComponent />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
