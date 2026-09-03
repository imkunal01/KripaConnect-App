import { Suspense, lazy, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAllOrdersAdmin } from '../services/admin'
import { subscribeToAdminOrders } from '../services/socket'
import {
  FiPieChart,
  FiShoppingBag,
  FiBox,
  FiUsers,
  FiGrid,
  FiTag,
  FiGitBranch,
  FiImage,
  FiStar,
  FiLogOut,
  FiExternalLink,
  FiArrowLeft,
  FiPlus,
  FiChevronDown
} from 'react-icons/fi'
import './Admin.css'
import './admin/AdminUI.css'

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const ProductManagement = lazy(() => import('./admin/ProductManagement'))
const BannerManagement = lazy(() => import('./admin/BannerManagement'))
const CategoryManagement = lazy(() => import('./admin/CategoryManagement'))
const SubcategoryManagement = lazy(() => import('./admin/SubcategoryManagement'))
const OrderManagement = lazy(() => import('./admin/OrderManagement'))
const UserManagement = lazy(() => import('./admin/UserManagement'))
const ReviewModeration = lazy(() => import('./admin/ReviewModeration'))
const AdminHub = lazy(() => import('./admin/AdminHub'))

export default function Admin() {
  const { user, role, token, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [activeTab, setActiveTab] = useState(() => (location.hash.replace('#', '') || 'dashboard'))
  const [profileOpen, setProfileOpen] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const profileMenuRef = useRef(null)

  // Auth gate check
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (role !== 'admin') {
      navigate('/')
      return
    }
  }, [token, role, navigate])

  // Sync hash changes
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && hash !== activeTab) {
      setActiveTab(hash)
    }
  }, [location.hash])

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load pending orders count and listen to live updates via socket
  useEffect(() => {
    if (!token) return

    async function fetchPending() {
      try {
        const orders = await getAllOrdersAdmin(token)
        if (Array.isArray(orders)) {
          const pending = orders.filter(o => o.deliveryStatus === 'pending' || !o.deliveryStatus).length
          setPendingOrdersCount(pending)
        }
      } catch (err) {
        // silent fail
      }
    }
    fetchPending()

    const unsubscribe = subscribeToAdminOrders((updatedOrder) => {
      fetchPending()
    })

    return () => unsubscribe()
  }, [token])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setProfileOpen(false)
    navigate(`/admin#${tab}`, { replace: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // Primary bottom dock tabs
  const dockTabs = [
    { id: 'dashboard', label: 'Overview', icon: <FiPieChart /> },
    { id: 'orders', label: 'Orders', icon: <FiShoppingBag />, badge: pendingOrdersCount },
    { id: 'products', label: 'Products', icon: <FiBox /> },
    { id: 'users', label: 'Users', icon: <FiUsers /> },
    { id: 'hub', label: 'Hub', icon: <FiGrid /> },
  ]

  // All desktop navigation tabs
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiPieChart />, component: AdminDashboard },
    { id: 'orders', label: 'Orders', icon: <FiShoppingBag />, badge: pendingOrdersCount, component: OrderManagement },
    { id: 'products', label: 'Products', icon: <FiBox />, component: ProductManagement },
    { id: 'users', label: 'Users', icon: <FiUsers />, component: UserManagement },
    { id: 'categories', label: 'Categories', icon: <FiTag />, component: CategoryManagement },
    { id: 'subcategories', label: 'Subcategories', icon: <FiGitBranch />, component: SubcategoryManagement },
    { id: 'banners', label: 'Banners', icon: <FiImage />, component: BannerManagement },
    { id: 'reviews', label: 'Reviews', icon: <FiStar />, component: ReviewModeration },
    { id: 'hub', label: 'Operations Hub', icon: <FiGrid />, component: AdminHub },
  ]

  const ActiveComponent = allTabs.find(t => t.id === activeTab)?.component || AdminDashboard
  const currentTabMeta = allTabs.find(t => t.id === activeTab)

  const isHubSubTab = ['categories', 'subcategories', 'banners', 'reviews'].includes(activeTab)

  if (role !== 'admin') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', minHeight: '100vh' }}>
        <h2>Access Denied</h2>
        <p>Administrator credentials required</p>
      </div>
    )
  }

  return (
    <div className="adminShell">
      {/* ---------------- Dedicated Admin Header ---------------- */}
      <header className="adminAppHeader">
        <div className="adminAppHeader__left">
          {isHubSubTab ? (
            <button
              type="button"
              className="adminHeaderBtn"
              onClick={() => handleTabChange('hub')}
              aria-label="Back to Hub"
              style={{ padding: '0 10px', height: 34 }}
            >
              <FiArrowLeft />
              <span>Hub</span>
            </button>
          ) : (
            <div className="adminBrandLogo">K</div>
          )}

          <div className="adminBrandMeta">
            <div className="adminBrandTitle">
              <span>KripaConnect</span>
              <span className="adminLivePulse">
                <span className="adminLivePulseDot" />
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="adminAppHeader__right">
          {/* Direct link to live customer storefront */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="adminHeaderBtn"
            title="Preview Customer Storefront"
          >
            <FiExternalLink />
            <span className="adminOnlyDesktop">Store</span>
          </a>

          {/* User Profile & Logout */}
          <div className="adminUserTrigger" ref={profileMenuRef}>
            <button
              type="button"
              className="adminAvatarBtn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Admin Profile Menu"
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="adminAvatarImg" />
              ) : (
                <div className="adminAvatarInitial">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <FiChevronDown style={{ fontSize: '0.85rem', color: '#64748b' }} />
            </button>

            {profileOpen && (
              <div className="adminUserMenu">
                <div className="adminUserMenu__info">
                  <div className="adminUserMenu__name">{user?.name || 'Administrator'}</div>
                  <div className="adminUserMenu__role">Store Manager (Admin)</div>
                </div>

                <button
                  type="button"
                  className="adminUserMenu__item"
                  onClick={() => handleTabChange('dashboard')}
                >
                  <FiPieChart />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  className="adminUserMenu__item"
                  onClick={() => handleTabChange('orders')}
                >
                  <FiShoppingBag />
                  <span>Orders {pendingOrdersCount > 0 ? `(${pendingOrdersCount})` : ''}</span>
                </button>

                <button
                  type="button"
                  className="adminUserMenu__item"
                  onClick={() => handleTabChange('products')}
                >
                  <FiBox />
                  <span>Products</span>
                </button>

                <div style={{ height: 1, background: '#e2e8f0', margin: '6px 0' }} />

                <button
                  type="button"
                  className="adminUserMenu__item adminUserMenu__item--danger"
                  onClick={async () => {
                    await signOut()
                    navigate('/login')
                  }}
                >
                  <FiLogOut />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- Main Layout ---------------- */}
      <div className="adminLayout">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="adminSidebar">
          <div className="adminSidebarSectionTitle">Main Operations</div>
          <nav className="adminSidebarNav">
            {allTabs.slice(0, 4).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`adminSidebarBtn ${activeTab === tab.id ? 'isActive' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <div className="adminSidebarBtn__main">
                  <span className="adminSidebarBtn__icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.badge) && (
                  <span className="adminSidebarBadge">{tab.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="adminSidebarSectionTitle">Store Configuration</div>
          <nav className="adminSidebarNav">
            {allTabs.slice(4, 8).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`adminSidebarBtn ${activeTab === tab.id ? 'isActive' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <div className="adminSidebarBtn__main">
                  <span className="adminSidebarBtn__icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>

          <div style={{ height: 1, background: '#e2e8f0', margin: '14px 6px' }} />

          <button
            type="button"
            className="adminSidebarBtn"
            style={{ color: '#ef4444' }}
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
          >
            <div className="adminSidebarBtn__main">
              <span className="adminSidebarBtn__icon" style={{ color: '#ef4444' }}><FiLogOut /></span>
              <span>Sign Out</span>
            </div>
          </button>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="adminMain">
          <Suspense
            fallback={
              <div className="adminEmpty" style={{ padding: '60px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary, #FF3D3D)', animation: 'adminPulse 0.8s linear infinite' }} />
                <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 750 }}>Loading section...</span>
              </div>
            }
          >
            <ActiveComponent
              onSelectTab={handleTabChange}
              onNavigateToOrders={() => handleTabChange('orders')}
              onNavigateToProducts={() => handleTabChange('products')}
            />
          </Suspense>
        </main>
      </div>

      {/* ---------------- Ergonomic Mobile Bottom Dock ---------------- */}
      <nav className="adminBottomDock" aria-label="Mobile Admin Navigation">
        {dockTabs.map((tab) => {
          const isCurrentActive = activeTab === tab.id || (tab.id === 'hub' && isHubSubTab)
          return (
            <button
              key={tab.id}
              type="button"
              className={`adminBottomDockItem ${isCurrentActive ? 'isActive' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <div className="adminBottomDockIcon">
                {tab.icon}
                {Boolean(tab.badge) && tab.badge > 0 && (
                  <span className="adminBottomDockBadge">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="adminBottomDockLabel">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
