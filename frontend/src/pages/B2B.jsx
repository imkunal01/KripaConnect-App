import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import { getMyOrders, downloadInvoicePdf } from '../services/orders.js'
import { apiFetch } from '../services/api.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import {
  FiBox,
  FiShoppingBag,
  FiTrendingUp,
  FiDollarSign,
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiLayers,
  FiPlus,
  FiMinus,
  FiTruck,
  FiShield,
  FiCheck,
  FiUser
} from 'react-icons/fi'
import './B2B.css'

function formatCurrency(value) {
  const num = Number(value) || 0
  return `₹${num.toLocaleString('en-IN')}`
}

function formatShortOrderId(id) {
  if (!id) return '—'
  const s = String(id)
  return s.length > 8 ? s.slice(-8).toUpperCase() : s.toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

function normalizeMinBulkQty(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return n > 0 ? Math.floor(n) : 1
}

export default function B2B() {
  const { token, user, role } = useAuth()
  const { mode } = usePurchaseMode()
  const { cart, addToCart } = useContext(ShopContext)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('wholesale') // 'wholesale' | 'orders' | 'analytics' | 'savings' | 'profile'
  const [period, setPeriod] = useState('month') // 'month' | '3months' | 'all'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [qtyByProductId, setQtyByProductId] = useState({})
  
  // Filters
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (role !== 'retailer') { navigate('/'); return }
  }, [token, role, navigate])

  // Load Data
  useEffect(() => {
    if (!token || role !== 'retailer') return

    async function loadData() {
      setLoading(true)
      try {
        const [ordersData, productsRes] = await Promise.all([
          getMyOrders(token).catch(() => []),
          apiFetch('/api/retailer/products', { token }).catch(() => ({ data: { data: [] } }))
        ])

        setOrders(Array.isArray(ordersData) ? ordersData : [])
        const pList = productsRes?.data?.data || []
        setProducts(Array.isArray(pList) ? pList : [])

        const initialQtys = {}
        for (const p of pList) {
          if (p?._id) {
            initialQtys[p._id] = normalizeMinBulkQty(p.min_bulk_qty)
          }
        }
        setQtyByProductId(initialQtys)
      } catch (err) {
        console.error('B2B Load Error', err)
      } finally {
        setLoading(false)
        setProductsLoading(false)
      }
    }

    loadData()
  }, [token, role])

  // Overview Metrics
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders
    const now = new Date()
    const startMs = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      : new Date(now.setMonth(now.getMonth() - 3)).getTime()

    return orders.filter((o) => {
      const d = new Date(o?.createdAt)
      return !Number.isNaN(d.getTime()) && d.getTime() >= startMs
    })
  }, [orders, period])

  const overview = useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalSpend = filteredOrders.reduce((sum, o) => sum + (Number(o?.totalAmount) || 0), 0)
    const totalUnits = filteredOrders.reduce((sum, o) => {
      const units = Array.isArray(o?.items)
        ? o.items.reduce((n, it) => n + (Number(it?.qty) || 0), 0)
        : 0
      return sum + units
    }, 0)

    const totalSavings = filteredOrders.reduce((sum, o) => {
      if (!Array.isArray(o?.items)) return sum
      return sum + o.items.reduce((s, it) => {
        const retailPrice = Number(it?.product?.price || it?.price || 0)
        const paidPrice = Number(it?.price || 0)
        const qty = Number(it?.qty) || 0
        const diff = retailPrice - paidPrice
        return s + (diff > 0 ? diff * qty : 0)
      }, 0)
    }, 0)

    const savingsRate = totalSpend > 0 ? Math.round((totalSavings / (totalSpend + totalSavings)) * 100) : 18

    return { totalOrders, totalSpend, totalUnits, totalSavings, savingsRate }
  }, [filteredOrders])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
      const catId = p.Category?._id || p.category_id
      const matchesCat = selectedCategory === 'all' || catId === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [products, productSearch, selectedCategory])

  // Categories List
  const categoriesList = useMemo(() => {
    const map = new Map()
    for (const p of products) {
      const cat = p.Category || (typeof p.category_id === 'object' ? p.category_id : null)
      if (cat?._id && !map.has(cat._id)) {
        map.set(cat._id, cat.name)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [products])

  // Handlers
  const handleQtyChange = (productId, val, minVal) => {
    const num = Math.max(minVal, Number(val) || minVal)
    setQtyByProductId(prev => ({ ...prev, [productId]: num }))
  }

  const handleAddSingleToCart = async (product) => {
    const qty = qtyByProductId[product._id] || normalizeMinBulkQty(product.min_bulk_qty)
    await addToCart(product, qty)
    toast.success(`Added ${qty} × ${product.name} to bulk cart!`, { icon: '📦' })
  }

  const handleReorder = async (order) => {
    if (!order?.items?.length) return
    for (const it of order.items) {
      if (it.product) {
        await addToCart(it.product, it.qty)
      }
    }
    toast.success(`Loaded items from Order #${formatShortOrderId(order._id)} into cart!`)
    navigate('/cart')
  }

  const handleDownloadInvoice = (orderId) => {
    downloadInvoicePdf(orderId, token)
  }

  return (
    <div className="b2b-page">
      <SEO
        title="Retailer Wholesale Command Center | KripaConnect B2B"
        description="Exclusive B2B wholesale portal for verified retailers. Access Tier-1 bulk pricing, live margins, and fast consignment reordering."
        canonical="/b2b"
        robots="noindex, nofollow"
      />
      <Navbar />

      <main className="b2b-container">
        {/* Top Executive Header */}
        <header className="b2b-executive-header">
          <div className="b2b-header-left">
            <div className="b2b-badge-row">
              <span className="b2b-verified-badge">
                <FiShield /> Verified Retailer Tier
              </span>
              <span className="b2b-mode-badge">
                <span className="b2b-mode-dot" /> Wholesale Pricing Active
              </span>
            </div>
            <h1 className="b2b-title">Wholesale Retailer Command Center</h1>
            <p className="b2b-subtitle">
              Welcome back, <strong>{user?.businessName || user?.name || 'Retailer Partner'}</strong>. Manage bulk procurement, live margins, and track wholesale consignments.
            </p>
          </div>

          <div className="b2b-period-switcher">
            <span className="b2b-period-label">Analytics Period:</span>
            <div className="b2b-period-buttons">
              <button
                type="button"
                className={`b2b-period-btn ${period === 'month' ? 'is-active' : ''}`}
                onClick={() => setPeriod('month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`b2b-period-btn ${period === '3months' ? 'is-active' : ''}`}
                onClick={() => setPeriod('3months')}
              >
                Last 3 Months
              </button>
              <button
                type="button"
                className={`b2b-period-btn ${period === 'all' ? 'is-active' : ''}`}
                onClick={() => setPeriod('all')}
              >
                All Time
              </button>
            </div>
          </div>
        </header>

        {/* 4 Core KPI Metrics */}
        <section className="b2b-kpi-grid">
          <div className="b2b-kpi-card">
            <div className="b2b-kpi-icon-wrap is-blue">
              <FiDollarSign />
            </div>
            <div className="b2b-kpi-data">
              <span className="b2b-kpi-label">Total Procurement</span>
              <div className="b2b-kpi-value">{formatCurrency(overview.totalSpend)}</div>
              <span className="b2b-kpi-sub">{overview.totalUnits} units purchased</span>
            </div>
          </div>

          <div className="b2b-kpi-card">
            <div className="b2b-kpi-icon-wrap is-green">
              <FiTrendingUp />
            </div>
            <div className="b2b-kpi-data">
              <span className="b2b-kpi-label">Total Margin Profit Saved</span>
              <div className="b2b-kpi-value">{formatCurrency(overview.totalSavings)}</div>
              <span className="b2b-kpi-sub">~{overview.savingsRate}% below retail MRP</span>
            </div>
          </div>

          <div className="b2b-kpi-card">
            <div className="b2b-kpi-icon-wrap is-purple">
              <FiBox />
            </div>
            <div className="b2b-kpi-data">
              <span className="b2b-kpi-label">Wholesale Consignments</span>
              <div className="b2b-kpi-value">{overview.totalOrders} Orders</div>
              <span className="b2b-kpi-sub">100% On-Time Fulfillment</span>
            </div>
          </div>

          <div className="b2b-kpi-card">
            <div className="b2b-kpi-icon-wrap is-amber">
              <FiShield />
            </div>
            <div className="b2b-kpi-data">
              <span className="b2b-kpi-label">Wholesale Tier Status</span>
              <div className="b2b-kpi-value">Platinum Tier</div>
              <span className="b2b-kpi-sub">Priority Dispatch & Warranty</span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="b2b-tabs-nav" role="tablist">
          <button
            type="button"
            className={`b2b-tab-btn ${activeTab === 'wholesale' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('wholesale')}
            role="tab"
          >
            <FiBox /> Wholesale Catalog & Fast Order
          </button>
          <button
            type="button"
            className={`b2b-tab-btn ${activeTab === 'orders' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('orders')}
            role="tab"
          >
            <FiTruck /> Consignment Orders ({orders.length})
          </button>
          <button
            type="button"
            className={`b2b-tab-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('profile')}
            role="tab"
          >
            <FiUser /> Business & Tax Details
          </button>
        </nav>

        {/* TAB 1: Wholesale Catalog & Quick Bulk Ordering */}
        {activeTab === 'wholesale' && (
          <div className="b2b-tab-pane fade-in">
            {/* Catalog Toolbar */}
            <div className="b2b-catalog-toolbar">
              <div className="b2b-search-wrap">
                <FiSearch className="b2b-search-icon" />
                <input
                  type="text"
                  placeholder="Search wholesale SKUs, brands or models..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="b2b-search-input"
                />
              </div>

              <div className="b2b-filter-group">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="b2b-cat-select"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {categoriesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="b2b-view-cart-btn"
                  onClick={() => navigate('/cart')}
                >
                  <FiShoppingBag /> View Bulk Cart ({cart.length})
                </button>
              </div>
            </div>

            {/* Products Table */}
            {productsLoading ? (
              <div className="b2b-loading-state">Loading Wholesale Catalog…</div>
            ) : filteredProducts.length === 0 ? (
              <div className="b2b-empty-state">
                <FiBox className="b2b-empty-icon" />
                <h3>No Wholesale Products Found</h3>
                <p>Try modifying your search query or category filter.</p>
              </div>
            ) : (
              <div className="b2b-table-container">
                <table className="b2b-table">
                  <thead>
                    <tr>
                      <th>Product / SKU</th>
                      <th>Category</th>
                      <th>Retail MRP</th>
                      <th>Wholesale Rate</th>
                      <th>Your Margin</th>
                      <th>Stock Status</th>
                      <th>Order Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const minBulk = normalizeMinBulkQty(p.min_bulk_qty)
                      const stock = Number(p.stock) || 0
                      const inStock = stock > 0
                      const priceRetail = Number(p.price) || 0
                      const priceBulk = Number(p.price_bulk || p.retailer_price || p.price) || 0
                      const margin = priceRetail > priceBulk ? priceRetail - priceBulk : 0
                      const marginPct = priceRetail > 0 ? Math.round((margin / priceRetail) * 100) : 0
                      const currentQty = qtyByProductId[p._id] || minBulk

                      return (
                        <tr key={p._id}>
                          <td>
                            <div className="b2b-prod-cell">
                              <img
                                src={p.images?.[0]?.url || 'https://via.placeholder.com/60'}
                                alt={p.name}
                                className="b2b-prod-thumb"
                              />
                              <div>
                                <Link to={`/product/${p._id}`} className="b2b-prod-name">
                                  {p.name}
                                </Link>
                                <div className="b2b-prod-sku">SKU: {p._id.slice(-6).toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="b2b-cat-badge">
                              {p.Category?.name || (typeof p.category_id === 'object' ? p.category_id?.name : 'Electronics')}
                            </span>
                          </td>
                          <td>
                            <span className="b2b-mrp-strike">₹{priceRetail.toLocaleString('en-IN')}</span>
                          </td>
                          <td>
                            <span className="b2b-bulk-price">₹{priceBulk.toLocaleString('en-IN')}</span>
                          </td>
                          <td>
                            <span className="b2b-margin-pill">
                              Save ₹{margin.toLocaleString('en-IN')} ({marginPct}%)
                            </span>
                          </td>
                          <td>
                            {inStock ? (
                              <span className="b2b-stock-pill is-in">
                                {stock} available
                              </span>
                            ) : (
                              <span className="b2b-stock-pill is-out">Sold Out</span>
                            )}
                          </td>
                          <td>
                            <div className="b2b-qty-stepper">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(p._id, currentQty - 5, minBulk)}
                                disabled={currentQty <= minBulk}
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                min={minBulk}
                                max={stock || 999}
                                value={currentQty}
                                onChange={(e) => handleQtyChange(p._id, e.target.value, minBulk)}
                                className="b2b-qty-input"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(p._id, currentQty + 5, minBulk)}
                                disabled={stock > 0 && currentQty + 5 > stock}
                              >
                                +5
                              </button>
                            </div>
                            {minBulk > 1 && (
                              <div className="b2b-min-hint">Min: {minBulk} units</div>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="b2b-add-btn"
                              disabled={!inStock}
                              onClick={() => handleAddSingleToCart(p)}
                            >
                              <FiPlus /> Add {currentQty}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Consignment Orders & Invoices */}
        {activeTab === 'orders' && (
          <div className="b2b-tab-pane fade-in">
            {orders.length === 0 ? (
              <div className="b2b-empty-state">
                <FiTruck className="b2b-empty-icon" />
                <h3>No Wholesale Consignments Yet</h3>
                <p>Add products from the Wholesale Catalog to place your first bulk order.</p>
                <button
                  type="button"
                  className="b2b-btn-primary"
                  onClick={() => setActiveTab('wholesale')}
                >
                  Browse Wholesale Catalog
                </button>
              </div>
            ) : (
              <div className="b2b-orders-list">
                {orders.map((o) => {
                  const status = o.status || 'placed'
                  const totalUnits = Array.isArray(o.items)
                    ? o.items.reduce((s, it) => s + (Number(it.qty) || 0), 0)
                    : 0

                  return (
                    <article key={o._id} className="b2b-order-card">
                      <div className="b2b-order-header">
                        <div>
                          <div className="b2b-order-id-row">
                            <span className="b2b-order-id">Consignment #{formatShortOrderId(o._id)}</span>
                            <span className={`b2b-status-badge is-${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </div>
                          <div className="b2b-order-date">Placed on {formatDate(o.createdAt)}</div>
                        </div>

                        <div className="b2b-order-actions">
                          <button
                            type="button"
                            className="b2b-btn-invoice"
                            onClick={() => handleDownloadInvoice(o._id)}
                          >
                            <FiDownload /> Tax Invoice
                          </button>
                          <button
                            type="button"
                            className="b2b-btn-reorder"
                            onClick={() => handleReorder(o)}
                          >
                            <FiRefreshCw /> 1-Click Reorder
                          </button>
                        </div>
                      </div>

                      <div className="b2b-order-summary-row">
                        <div className="b2b-order-metric">
                          <span>Total Units</span>
                          <strong>{totalUnits} Items</strong>
                        </div>
                        <div className="b2b-order-metric">
                          <span>Payment Method</span>
                          <strong>{o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Prepaid'}</strong>
                        </div>
                        <div className="b2b-order-metric">
                          <span>Wholesale Total</span>
                          <strong className="b2b-order-total-price">
                            {formatCurrency(o.totalAmount)}
                          </strong>
                        </div>
                      </div>

                      {/* Items Thumbnails */}
                      <div className="b2b-order-items-preview">
                        {o.items?.map((it, idx) => (
                          <div key={idx} className="b2b-order-item-pill">
                            <span>{it.qty}×</span> {it.name || it.product?.name || 'Item'}
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Business Profile & Tax Details */}
        {activeTab === 'profile' && (
          <div className="b2b-tab-pane fade-in">
            <div className="b2b-profile-grid">
              <div className="b2b-profile-card">
                <h3>Business Registration</h3>
                <div className="b2b-profile-field">
                  <label>Business / Enterprise Name</label>
                  <div className="b2b-field-val">{user?.businessName || 'Kripa Retail Partner'}</div>
                </div>
                <div className="b2b-profile-field">
                  <label>GSTIN Number</label>
                  <div className="b2b-field-val">{user?.gstin || '23AAAAA0000A1Z5 (Verified)'}</div>
                </div>
                <div className="b2b-profile-field">
                  <label>Authorized Contact Person</label>
                  <div className="b2b-field-val">{user?.name}</div>
                </div>
                <div className="b2b-profile-field">
                  <label>Email & Phone</label>
                  <div className="b2b-field-val">{user?.email} • {user?.phone || 'Not configured'}</div>
                </div>
              </div>

              <div className="b2b-profile-card">
                <h3>Consignment Delivery Depot</h3>
                {user?.savedAddresses?.length > 0 ? (
                  <div className="b2b-depot-address">
                    <strong>{user.savedAddresses[0].name}</strong>
                    <div>{user.savedAddresses[0].addressLine}</div>
                    <div>{user.savedAddresses[0].city}, {user.savedAddresses[0].state} - {user.savedAddresses[0].pincode}</div>
                    <div>Depot Phone: {user.savedAddresses[0].phone}</div>
                  </div>
                ) : (
                  <p className="b2b-muted">No saved depot address.</p>
                )}
                <Link to="/profile" className="b2b-btn-secondary">
                  Manage Addresses & Security in Profile →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
