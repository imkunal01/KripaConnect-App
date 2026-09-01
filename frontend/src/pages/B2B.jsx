import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import { getMyOrders, downloadInvoicePdf } from '../services/orders.js'
import { listCategories } from '../services/categories.js'
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
  FiUser,
  FiChevronLeft,
  FiChevronRight
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

  const [activeTab, setActiveTab] = useState('wholesale') // 'wholesale' | 'orders' | 'profile'
  const [period, setPeriod] = useState('month') // 'month' | '3months' | 'all'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Paginated Wholesale Products
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [qtyByProductId, setQtyByProductId] = useState({})
  const [categories, setCategories] = useState([])

  // Pagination & Filtering State
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Auth Guard
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (role !== 'retailer') { navigate('/'); return }
  }, [token, role, navigate])

  // Load Orders & Categories once
  useEffect(() => {
    if (!token || role !== 'retailer') return

    async function loadMeta() {
      setLoading(true)
      try {
        const [ordersData, catsData] = await Promise.all([
          getMyOrders(token).catch(() => []),
          listCategories().catch(() => [])
        ])
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setCategories(Array.isArray(catsData) ? catsData : [])
      } catch (err) {
        console.error('B2B Meta Load Error', err)
      } finally {
        setLoading(false)
      }
    }
    loadMeta()
  }, [token, role])

  // Fetch Paginated Products whenever page, search, or category changes
  useEffect(() => {
    if (!token || role !== 'retailer') return
    let isMounted = true

    const timer = setTimeout(async () => {
      setProductsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(limit)
        })
        if (productSearch.trim()) {
          queryParams.set('search', productSearch.trim())
        }
        if (selectedCategory && selectedCategory !== 'all') {
          queryParams.set('category', selectedCategory)
        }

        const res = await apiFetch(`/api/retailer/products?${queryParams.toString()}`, { token })
        if (!isMounted) return

        const pList = res?.data?.data || []
        const pagination = res?.data?.pagination || { page: 1, totalPages: 1, total: pList.length }

        setProducts(pList)
        setTotalPages(pagination.totalPages || 1)
        setTotalProducts(pagination.total || pList.length)

        const initialQtys = {}
        for (const p of pList) {
          if (p?._id) {
            initialQtys[p._id] = normalizeMinBulkQty(p.min_bulk_qty)
          }
        }
        setQtyByProductId(initialQtys)
      } catch (err) {
        console.error('B2B Products Load Error', err)
        if (isMounted) setProducts([])
      } finally {
        if (isMounted) setProductsLoading(false)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [token, role, page, limit, productSearch, selectedCategory])

  // Reset page to 1 when search or category filter changes
  const handleSearchChange = (val) => {
    setProductSearch(val)
    setPage(1)
  }

  const handleCategoryChange = (val) => {
    setSelectedCategory(val)
    setPage(1)
  }

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

  // Handlers
  const handleQtyChange = (productId, val, minVal) => {
    const num = Math.max(minVal, Number(val) || minVal)
    setQtyByProductId(prev => ({ ...prev, [productId]: num }))
  }

  const handleAddSingleToCart = async (product) => {
    const qty = qtyByProductId[product._id] || normalizeMinBulkQty(product.min_bulk_qty)
    await addToCart(product, qty)
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    const toolbar = document.querySelector('.b2b-catalog-toolbar')
    if (toolbar) {
      toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="b2b-search-input"
                />
              </div>

              <div className="b2b-filter-group">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="b2b-cat-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
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
            ) : products.length === 0 ? (
              <div className="b2b-empty-state">
                <FiBox className="b2b-empty-icon" />
                <h3>No Wholesale Products Found</h3>
                <p>Try modifying your search query or category filter.</p>
              </div>
            ) : (
              <>
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
                      {products.map((p) => {
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
                                  <span className="b2b-prod-sku">ID: {formatShortOrderId(p._id)}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="b2b-cat-badge">
                                {p.Category?.name || 'Electronics'}
                              </span>
                            </td>
                            <td>
                              <span className="b2b-price-retail">{formatCurrency(priceRetail)}</span>
                            </td>
                            <td>
                              <strong className="b2b-price-bulk">{formatCurrency(priceBulk)}</strong>
                            </td>
                            <td>
                              <div className="b2b-margin-cell">
                                <span className="b2b-margin-val">+{formatCurrency(margin)}</span>
                                <span className="b2b-margin-pct">({marginPct}%)</span>
                              </div>
                            </td>
                            <td>
                              {inStock ? (
                                <span className="b2b-stock-pill in-stock">
                                  <FiCheck /> {stock} in Hub
                                </span>
                              ) : (
                                <span className="b2b-stock-pill out-stock">Out of Stock</span>
                              )}
                            </td>
                            <td>
                              <div className="b2b-qty-ctrl">
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="b2b-pagination-bar">
                    <div className="b2b-pagination-info">
                      Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, totalProducts)}</strong> of <strong>{totalProducts}</strong> wholesale products
                    </div>

                    <div className="b2b-pagination-actions">
                      <button
                        type="button"
                        className="b2b-page-btn"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Previous Page"
                      >
                        <FiChevronLeft /> Previous
                      </button>

                      <div className="b2b-page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(pNum => pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 2)
                          .map((pNum, idx, arr) => (
                            <React.Fragment key={pNum}>
                              {idx > 0 && arr[idx - 1] !== pNum - 1 && (
                                <span className="b2b-page-ellipsis">…</span>
                              )}
                              <button
                                type="button"
                                className={`b2b-page-num ${pNum === page ? 'is-active' : ''}`}
                                onClick={() => handlePageChange(pNum)}
                              >
                                {pNum}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>

                      <button
                        type="button"
                        className="b2b-page-btn"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        aria-label="Next Page"
                      >
                        Next <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                    ? o.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
                    : 0

                  return (
                    <article key={o._id} className="b2b-order-card">
                      <div className="b2b-order-top">
                        <div className="b2b-order-id-col">
                          <span className="b2b-order-label">Consignment No.</span>
                          <span className="b2b-order-id">#{formatShortOrderId(o._id)}</span>
                          <span className="b2b-order-date">{formatDate(o.createdAt)}</span>
                        </div>

                        <div className="b2b-order-status-col">
                          <span className={`b2b-status-pill status-${status.toLowerCase()}`}>
                            {status.toUpperCase()}
                          </span>
                          <span className="b2b-units-badge">{totalUnits} units in lot</span>
                        </div>
                      </div>

                      <div className="b2b-order-items-preview">
                        {Array.isArray(o.items) && o.items.map((it, idx) => (
                          <div key={idx} className="b2b-item-chip">
                            <span className="b2b-item-name">{it.product?.name || it.name || 'Wholesale SKU'}</span>
                            <span className="b2b-item-qty">×{it.qty}</span>
                            <span className="b2b-item-cost">{formatCurrency((Number(it.price) || 0) * (Number(it.qty) || 1))}</span>
                          </div>
                        ))}
                      </div>

                      <div className="b2b-order-bottom">
                        <div className="b2b-order-total-block">
                          <span className="b2b-total-label">Invoice Total (inc. GST)</span>
                          <div className="b2b-total-amt">{formatCurrency(o.totalAmount)}</div>
                        </div>

                        <div className="b2b-order-action-btns">
                          <button
                            type="button"
                            className="b2b-btn-secondary"
                            onClick={() => handleDownloadInvoice(o._id)}
                          >
                            <FiDownload /> Tax Invoice PDF
                          </button>
                          <button
                            type="button"
                            className="b2b-btn-primary"
                            onClick={() => handleReorder(o)}
                          >
                            <FiRefreshCw /> Reorder Consignment
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Business & Tax Details */}
        {activeTab === 'profile' && (
          <div className="b2b-tab-pane fade-in">
            <div className="b2b-profile-card">
              <div className="b2b-profile-header">
                <div>
                  <h3 className="b2b-profile-title">Verified Business Profile</h3>
                  <p className="b2b-profile-sub">Your registered enterprise & GSTIN details for tax invoice computation.</p>
                </div>
                <span className="b2b-verified-tag">
                  <FiCheckCircle /> Verified Enterprise
                </span>
              </div>

              <div className="b2b-profile-grid">
                <div className="b2b-profile-item">
                  <span className="b2b-profile-label">Registered Enterprise Name</span>
                  <div className="b2b-profile-value">{user?.businessName || user?.shopName || 'Kripa Retail Partner'}</div>
                </div>

                <div className="b2b-profile-item">
                  <span className="b2b-profile-label">Authorized Signatory</span>
                  <div className="b2b-profile-value">{user?.name}</div>
                </div>

                <div className="b2b-profile-item">
                  <span className="b2b-profile-label">GSTIN / Tax ID</span>
                  <div className="b2b-profile-value is-mono">{user?.gstin || '23AAAAA0000A1Z5'}</div>
                </div>

                <div className="b2b-profile-item">
                  <span className="b2b-profile-label">Billing & Depot Address</span>
                  <div className="b2b-profile-value">{user?.shopAddress || 'Indore Wholesale Market, MP'}</div>
                </div>

                <div className="b2b-profile-item">
                  <span className="b2b-profile-label">Registered Phone</span>
                  <div className="b2b-profile-value">{user?.phone || '+91 98765 43210'}</div>
                </div>

                <div className="b2b-profile-item">
                  <span className="b2b-profile-label">Payment & Credit Terms</span>
                  <div className="b2b-profile-value">Standard Net-0 / Instant Bank & COD</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
