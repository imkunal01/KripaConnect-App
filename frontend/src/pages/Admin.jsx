import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AdminDashboard from './admin/AdminDashboard'
import ProductManagement from './admin/ProductManagement'
import OrderManagement from './admin/OrderManagement'
import UserManagement from './admin/UserManagement'
import ReviewModeration from './admin/ReviewModeration'
import './Admin.css'

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
    { id: 'dashboard', label: '📊 Dashboard', component: AdminDashboard },
    { id: 'products', label: '🛍️ Products', component: ProductManagement },
    { id: 'orders', label: '📦 Orders', component: OrderManagement },
    { id: 'users', label: '👥 Users', component: UserManagement },
    { id: 'reviews', label: '⭐ Reviews', component: ReviewModeration },
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }} className="admin-layout">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            padding: '0.75rem 1rem',
            backgroundColor: '#1f2937',
            color: 'white',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            minHeight: '44px'
          }}
          className="admin-mobile-toggle"
        >
          {menuOpen ? '✕' : '☰'} Menu
        </button>

        {/* Sidebar */}
        <aside style={{
          width: '100%',
          maxWidth: '280px',
          backgroundColor: '#1f2937',
          color: '#fff',
          padding: '2rem 0',
          minHeight: 'calc(100vh - 64px)',
          position: 'sticky',
          top: '64px',
          alignSelf: 'flex-start',
          zIndex: 100
        }} className={`admin-sidebar ${menuOpen ? 'mobile-open' : ''}`}>
          <div style={{ padding: '0 1.5rem', marginBottom: '2rem', borderBottom: '1px solid #374151', paddingBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              color: 'white'
            }}>
              Admin Panel
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              Welcome, {user?.name}
            </p>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 1rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  backgroundColor: activeTab === tab.id ? '#FF3D3D' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  transition: 'all 0.2s',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#374151'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#d1d5db'
                  }
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{tab.label.split(' ')[0]}</span>
                <span>{tab.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/login')
                }}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7f1d1d'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '1rem',
          backgroundColor: '#f9fafb',
          overflowY: 'auto',
          minHeight: 'calc(100vh - 64px)',
          width: '100%'
        }} className="admin-main">
          <ActiveComponent />
        </main>
      </div>

      <Footer />
      
      <style>{`
        @media (max-width: 767px) {
          .admin-layout {
            flex-direction: column !important;
          }
          .admin-mobile-toggle {
            display: block !important;
          }
          .admin-sidebar {
            position: fixed !important;
            left: -100% !important;
            top: 64px !important;
            height: calc(100vh - 64px) !important;
            transition: left 0.3s ease !important;
            z-index: 1000 !important;
          }
          .admin-sidebar.mobile-open {
            left: 0 !important;
          }
          .admin-main {
            padding: 1rem !important;
          }
        }
        @media (min-width: 768px) {
          .admin-layout {
            flex-direction: row !important;
          }
          .admin-mobile-toggle {
            display: none !important;
          }
          .admin-sidebar {
            position: sticky !important;
            left: auto !important;
          }
          .admin-main {
            padding: 2rem !important;
          }
        }
      `}</style>
    </div>
  )
}
