import { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import ShopContext from '../context/ShopContext.jsx'
import Logo from '../assets/newLogo3.png'
import './Navbar.css'
import toast from 'react-hot-toast'

// (Keep your Icons object exactly as it is)
const Icons = {
  Search: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Home: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Grid: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Heart: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Cart: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
  User: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Briefcase: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  X: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
}

export default function Navbar() {
  const { user, role } = useAuth()
  const { mode, setMode, canSwitchMode } = usePurchaseMode()
  const { cart, favorites, wipeCart } = useContext(ShopContext)
  const [q, setQ] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [modeConfirmOpen, setModeConfirmOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState(null)
  const [modeSwitchBusy, setModeSwitchBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Calc totals
  const cartCount = Array.isArray(cart) ? cart.reduce((n, i) => n + Number(i.qty || 0), 0) : 0
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0

  function onSearch(e) {
    e.preventDefault()
    if (q.trim().length > 0) {
      navigate(`/products?search=${encodeURIComponent(q.trim())}`)
      setMobileSearchOpen(false)
    }
  }

  const isActive = (path) => location.pathname === path

  const modeLabel = mode === 'retailer' ? 'Retailer(Bulk)' : 'Customer'

  function requestModeChange(nextMode) {
    if (!canSwitchMode) return
    if (nextMode === mode) return
    setPendingMode(nextMode)
    setModeConfirmOpen(true)
  }

  async function confirmModeChange() {
    if (!pendingMode || modeSwitchBusy) return
    setModeSwitchBusy(true)
    try {
      const ok = await wipeCart()
      if (!ok) {
        toast.error('Could not clear cart. Please try again.')
        return
      }
      setMode(pendingMode)
      if (pendingMode === 'customer' && location.pathname === '/b2b') {
        toast.error('Retailer dashboard is available only in Retailer Mode')
        navigate('/products', { replace: true })
      } else {
        toast.success('Mode switched. Cart cleared.')
      }
      setModeConfirmOpen(false)
      setPendingMode(null)
    } finally {
      setModeSwitchBusy(false)
    }
  }

  function cancelModeChange() {
    if (modeSwitchBusy) return
    setModeConfirmOpen(false)
    setPendingMode(null)
  }

  return (
    <>
      {modeConfirmOpen && (
        <div className="mode-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm mode switch">
          <div className="mode-modal">
            <div className="mode-modal-title">Switch purchase mode?</div>
            <div className="mode-modal-body">
              Switching modes will clear your cart to prevent mixed-mode items.
            </div>
            <div className="mode-modal-actions">
              <button type="button" className="mode-btn mode-btn--ghost" onClick={cancelModeChange} disabled={modeSwitchBusy}>
                Cancel
              </button>
              <button type="button" className="mode-btn mode-btn--primary" onClick={confirmModeChange} disabled={modeSwitchBusy}>
                {modeSwitchBusy ? 'Switching…' : 'Clear Cart & Switch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================
          MOBILE TOP BAR
      ======================== */}
      <nav className="navbar-top">
        <Link to="/" className="brand-logo" aria-label="Kripa Connect">
          <img src={Logo} alt="Kripa Connect" className="brand-logo-img" />
          <span className="brand-dot" aria-hidden="true" />
        </Link>
        <div className="navbar-top-right">
          {canSwitchMode && (
            <label className="mode-control mode-control--mobile" aria-label="Purchase mode">
              <span className="mode-label">{modeLabel}</span>
              <select
                className="mode-select"
                value={mode}
                onChange={(e) => requestModeChange(e.target.value)}
                disabled={modeConfirmOpen || modeSwitchBusy}
                title={modeConfirmOpen ? 'Confirm mode switch to continue' : undefined}
              >
                <option value="customer">Customer</option>
                <option value="retailer">Retailer(Bulk)</option>
              </select>
            </label>
          )}

          <Link to="/cart" className="navbar-top-icon" aria-label="Cart">
            <Icons.Cart />
            {cartCount > 0 && <span className="badge-dot" />}
          </Link>
        </div>
      </nav>

      {/* =======================
          MOBILE SEARCH FULLSCREEN
      ======================== */}
      <div className={`mobile-search-overlay ${mobileSearchOpen ? 'open' : ''}`}>
        <div className="mobile-search-inner">
          <div className="mobile-search-header">
             <h3 className="mobile-search-title">Search</h3>
             <button type="button" onClick={() => setMobileSearchOpen(false)} className="mobile-search-close">
                <Icons.X />
             </button>
          </div>
          <form onSubmit={onSearch} className="mobile-search-form">
            <input 
              className="mobile-search-input" 
              placeholder="Search products..." 
              value={q} 
              onChange={e => setQ(e.target.value)}
              autoFocus={mobileSearchOpen}
            />
          </form>
        </div>
      </div>

      {/* =======================
          MOBILE FLOATING DOCK
      ======================== */}
      <nav className="mobile-dock">
        <Link to="/" className={`dock-item ${isActive('/') ? 'active' : ''}`}>
          <Icons.Home />
        </Link>
        
        <Link to="/products" className={`dock-item ${isActive('/products') ? 'active' : ''}`}>
          <Icons.Grid />
        </Link>
        
        {/* Search Toggle */}
        <button 
          type="button"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)} 
          className={`dock-item ${mobileSearchOpen ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
        >
          <Icons.Search />
        </button>

        <Link to="/favorites" className={`dock-item ${isActive('/favorites') ? 'active' : ''}`} aria-label="Favorites">
            <Icons.Heart />
            {favoritesCount > 0 && <span className="badge-dot" />}
        </Link>
        
        <Link to={user ? "/profile" : "/login"} className={`dock-item ${isActive('/profile') ? 'active' : ''}`} aria-label={user ? 'My profile' : 'Sign in'}>
          <Icons.User />
        </Link>

        {role === 'retailer' && mode === 'retailer' && (
          <Link to="/b2b" className={`dock-item ${isActive('/b2b') ? 'active' : ''}`} aria-label="Retailer Dashboard">
            <Icons.Briefcase />
          </Link>
        )}
      </nav>

      {/* =======================
          DESKTOP (Redesigned)
      ======================== */}
      <header className="desktop-header">
        <div className="header-inner">
          
          {/* Left: Logo */}
          <Link to="/" className="desk-logo">
            <img src={Logo} alt="Kripa Connect" className="logo-image" />
          </Link>

          {/* Center: Search */}
          <form onSubmit={onSearch} className="desk-search-wrapper">
             <div className="search-icon-wrapper">
               <Icons.Search />
             </div>
             <input 
               className="desk-search-input" 
               placeholder="Search here..." 
               value={q} 
               onChange={e => setQ(e.target.value)} 
             />
             <button type="submit" className="search-btn-red">
               <Icons.Search />
             </button>
          </form>

          {/* Right: Actions */}
          <div className="desk-actions">

            {canSwitchMode && (
              <div className="mode-control" aria-label="Purchase mode">
                <div className="mode-label" title={modeLabel}>{modeLabel}</div>
                <select
                  className="mode-select"
                  value={mode}
                  onChange={(e) => requestModeChange(e.target.value)}
                >
                  <option value="customer">Customer Mode</option>
                  <option value="retailer">Retailer Mode (Bulk)</option>
                </select>
              </div>
            )}
            
            <nav className="nav-links">
               <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
               <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>Products</Link>
               {role === 'retailer' && mode === 'retailer' && (
                 <Link to="/b2b" className={`nav-link ${isActive('/b2b') ? 'active' : ''}`}>Retailer Dashboard</Link>
               )}
            </nav>

            <div className="action-divider"></div>

            <Link to="/favorites" className="icon-btn" title="Favorites">
              <Icons.Heart />
              {favoritesCount > 0 && <span className="badge-dot" />}
            </Link>

            <Link to="/cart" className="icon-btn" title="Cart">
              <Icons.Cart />
              {cartCount > 0 && <span className="badge-dot" />}
            </Link>
            
            {user ? (
              <Link to={role === 'admin' ? '/admin' : '/profile'} className="btn-primary-red">
                {role === 'admin' ? 'Admin Panel' : 'My Account'}
              </Link>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-text">Sign In</Link>
                <Link to="/signup" className="btn-primary-red">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}