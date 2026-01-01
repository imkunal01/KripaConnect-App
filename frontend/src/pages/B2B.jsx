import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import { getMyOrders } from '../services/orders.js'
import { apiFetch } from '../services/api.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
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

function getPeriodStart(periodKey) {
  const now = new Date()
  if (periodKey === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (periodKey === '3months') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 3)
    return d
  }
  return null
}

function normalizeMinBulkQty(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return n > 0 ? Math.floor(n) : 1
}

function monthKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(key) {
  if (!key) return '—'
  const [y, m] = String(key).split('-')
  const mm = Number(m)
  const yy = Number(y)
  if (!Number.isFinite(mm) || !Number.isFinite(yy)) return String(key)
  const d = new Date(yy, Math.max(0, mm - 1), 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

function getDefaultAddress(user) {
  const list = Array.isArray(user?.savedAddresses) ? user.savedAddresses : []
  return list.find(a => a?.default) || list[0] || null
}

export default function B2B() {
  const { token, user, role } = useAuth()
  const { mode } = usePurchaseMode()
  const { cart, addToCart, wipeCart } = useContext(ShopContext)
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('month')

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [qtyByProductId, setQtyByProductId] = useState({})

  const [orderSearch, setOrderSearch] = useState('')
  const [orderType, setOrderType] = useState('all')
  const [orderStatus, setOrderStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (role !== 'retailer') { navigate('/'); return }
  }, [token, role, navigate])

  useEffect(() => {
    if (!token) return
    if (role !== 'retailer') return
    if (mode !== 'retailer') {
      toast.error('Retailer dashboard is available only in Retailer Mode')
      navigate('/products', { replace: true })
    }
  }, [mode, token, role, navigate])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const data = await getMyOrders(token)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function loadRetailerProducts() {
    setProductsLoading(true)
    setProductsError('')
    try {
      const res = await apiFetch('/api/retailer/products', { token })
      const list = res?.data?.data || []
      setProducts(Array.isArray(list) ? list : [])

      setQtyByProductId((prev) => {
        const next = { ...(prev || {}) }
        for (const p of Array.isArray(list) ? list : []) {
          const id = p?._id
          if (!id) continue
          if (next[id] == null) {
            const minQty = normalizeMinBulkQty(p?.min_bulk_qty)
            next[id] = String(minQty)
          }
        }
        return next
      })
    } catch (err) {
      setProductsError(err?.message || 'Failed to load products')
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    if (role !== 'retailer') return
    if (mode !== 'retailer') return
    loadOrders()
    loadRetailerProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role, mode])

  const filteredOrders = useMemo(() => {
    const start = getPeriodStart(period)
    if (!start) return orders
    const startMs = start.getTime()
    return orders.filter((o) => {
      const d = new Date(o?.createdAt)
      if (Number.isNaN(d.getTime())) return false
      return d.getTime() >= startMs
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

    const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0

    const totalSavings = filteredOrders.reduce((sum, o) => {
      const isBulk = o?.purchaseMode === 'retailer' || o?.isBulkOrder
      if (!isBulk || !Array.isArray(o?.items)) return sum
      const orderSavings = o.items.reduce((s, it) => {
        const retailPrice = Number(it?.product?.price)
        const paidPrice = Number(it?.price)
        const qty = Number(it?.qty) || 0
        if (!Number.isFinite(retailPrice) || !Number.isFinite(paidPrice) || qty <= 0) return s
        const diff = retailPrice - paidPrice
        return s + (diff > 0 ? diff * qty : 0)
      }, 0)
      return sum + orderSavings
    }, 0)

    return {
      totalOrders,
      totalSpend,
      totalUnits,
      avgOrderValue,
      totalSavings,
    }
  }, [filteredOrders])

  const analytics = useMemo(() => {
    const list = filteredOrders

    // Monthly spend (based on order total)
    const spendByMonth = new Map()
    for (const o of list) {
      const key = monthKey(o?.createdAt)
      if (!key) continue
      const prev = spendByMonth.get(key) || 0
      spendByMonth.set(key, prev + (Number(o?.totalAmount) || 0))
    }

    const monthKeys = Array.from(spendByMonth.keys()).sort()
    const monthly = monthKeys.map((k) => ({
      key: k,
      label: monthLabel(k),
      value: spendByMonth.get(k) || 0,
    }))

    // Category-wise spend (based on paid item price * qty)
    const spendByCategory = new Map()
    for (const o of list) {
      const items = Array.isArray(o?.items) ? o.items : []
      for (const it of items) {
        const cat = it?.product?.Category?.name || 'Uncategorized'
        const amount = (Number(it?.price) || 0) * (Number(it?.qty) || 0)
        if (amount <= 0) continue
        spendByCategory.set(cat, (spendByCategory.get(cat) || 0) + amount)
      }
    }
    const categories = Array.from(spendByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Bulk vs customer spend
    let bulkSpend = 0
    let customerSpend = 0
    for (const o of list) {
      const isBulk = o?.purchaseMode === 'retailer' || o?.isBulkOrder
      const amt = Number(o?.totalAmount) || 0
      if (isBulk) bulkSpend += amt
      else customerSpend += amt
    }

    // Top products (by units)
    const byProduct = new Map()
    for (const o of list) {
      const items = Array.isArray(o?.items) ? o.items : []
      for (const it of items) {
        const name = it?.name || it?.product?.name || 'Unknown'
        const qty = Number(it?.qty) || 0
        const amount = (Number(it?.price) || 0) * qty
        if (qty <= 0) continue
        const prev = byProduct.get(name) || { name, qty: 0, spend: 0 }
        byProduct.set(name, { name, qty: prev.qty + qty, spend: prev.spend + amount })
      }
    }
    const topProducts = Array.from(byProduct.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return { monthly, categories, bulkSpend, customerSpend, topProducts }
  }, [filteredOrders])

  const savingsInsights = useMemo(() => {
    const list = filteredOrders
    const bulkOrders = list.filter((o) => o?.purchaseMode === 'retailer' || o?.isBulkOrder)

    let totalSavings = 0
    let totalBulkSpend = 0
    let bulkOrdersWithSavings = 0

    const byProduct = new Map()

    for (const o of bulkOrders) {
      const items = Array.isArray(o?.items) ? o.items : []
      const orderSpend = Number(o?.totalAmount) || 0
      totalBulkSpend += orderSpend

      let orderSavings = 0
      for (const it of items) {
        const retail = Number(it?.product?.price)
        const paid = Number(it?.price)
        const qty = Number(it?.qty) || 0
        if (!Number.isFinite(retail) || !Number.isFinite(paid) || qty <= 0) continue

        const diff = retail - paid
        const savings = diff > 0 ? diff * qty : 0
        if (savings <= 0) continue

        orderSavings += savings

        const productId = String(it?.product?._id || it?.product || it?.name || '')
        const name = it?.name || it?.product?.name || 'Unknown'
        const prev = byProduct.get(productId) || { productId, name, savings: 0, qty: 0, spend: 0 }
        byProduct.set(productId, {
          ...prev,
          savings: prev.savings + savings,
          qty: prev.qty + qty,
          spend: prev.spend + paid * qty,
        })
      }

      if (orderSavings > 0) bulkOrdersWithSavings += 1
      totalSavings += orderSavings
    }

    const avgSavingsPerBulkOrder = bulkOrders.length > 0 ? totalSavings / bulkOrders.length : 0
    const avgSavingsPerSavedBulkOrder = bulkOrdersWithSavings > 0 ? totalSavings / bulkOrdersWithSavings : 0

    const mostCostEffective = Array.from(byProduct.values())
      .map((p) => ({
        ...p,
        savingsPerUnit: p.qty > 0 ? p.savings / p.qty : 0,
        savingsRate: p.spend > 0 ? p.savings / p.spend : 0,
      }))
      .filter((p) => p.savings > 0 && p.qty > 0)
      .sort((a, b) => b.savingsRate - a.savingsRate)
      .slice(0, 5)

    const topSavingsDrivers = Array.from(byProduct.values())
      .map((p) => ({
        ...p,
        savingsPerUnit: p.qty > 0 ? p.savings / p.qty : 0,
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5)

    return {
      bulkOrdersCount: bulkOrders.length,
      bulkOrdersWithSavings,
      totalSavings,
      totalBulkSpend,
      avgSavingsPerBulkOrder,
      avgSavingsPerSavedBulkOrder,
      mostCostEffective,
      topSavingsDrivers,
    }
  }, [filteredOrders])

  const paymentOverview = useMemo(() => {
    const list = filteredOrders
    let codCount = 0
    let codAmount = 0
    let onlineCount = 0
    let onlineAmount = 0

    let paidCount = 0
    let paidAmount = 0
    let unpaidCount = 0
    let unpaidAmount = 0
    let failedCount = 0
    let failedAmount = 0

    let pendingCodCount = 0
    let pendingCodAmount = 0

    const refs = []

    for (const o of list) {
      const method = String(o?.paymentMethod || '').toLowerCase()
      const status = String(o?.paymentStatus || '').toLowerCase()
      const amt = Number(o?.totalAmount) || 0

      const isCod = method === 'cod'
      if (isCod) {
        codCount += 1
        codAmount += amt
      } else {
        // Treat razorpay/online payments as UPI/Online (per requirements)
        onlineCount += 1
        onlineAmount += amt
      }

      if (status === 'paid') {
        paidCount += 1
        paidAmount += amt
      } else if (status === 'failed') {
        failedCount += 1
        failedAmount += amt
      } else {
        unpaidCount += 1
        unpaidAmount += amt
      }

      if (isCod && status === 'pending') {
        pendingCodCount += 1
        pendingCodAmount += amt
      }

      if (!isCod) {
        const paymentId = o?.razorpay?.payment_id
        const orderId = o?.razorpay?.order_id
        if (paymentId || orderId) {
          refs.push({
            id: o?._id,
            createdAt: o?.createdAt,
            paymentId: paymentId || null,
            gatewayOrderId: orderId || null,
            status,
            amount: amt,
          })
        }
      }
    }

    refs.sort((a, b) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime())

    return {
      codCount,
      codAmount,
      onlineCount,
      onlineAmount,
      pendingCodCount,
      pendingCodAmount,
      paidCount,
      paidAmount,
      unpaidCount,
      unpaidAmount,
      failedCount,
      failedAmount,
      refs: refs.slice(0, 10),
    }
  }, [filteredOrders])

  const profileOverview = useMemo(() => {
    const def = getDefaultAddress(user)
    const businessName = user?.businessName || user?.storeName || user?.shopName || user?.companyName || ''
    const gstin = user?.gstin || user?.GSTIN || ''

    return {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      businessName,
      gstin,
      defaultAddress: def,
    }
  }, [user])

  const monthlyChart = useMemo(() => {
    const data = analytics.monthly
    const width = 900
    const height = 180
    const padX = 18
    const padY = 18
    const innerW = width - padX * 2
    const innerH = height - padY * 2
    const max = Math.max(1, ...data.map((d) => Number(d.value) || 0))
    const n = Math.max(1, data.length)
    const gap = 10
    const barW = clamp((innerW - gap * (n - 1)) / n, 10, 60)
    const usedW = barW * n + gap * (n - 1)
    const offsetX = padX + (innerW - usedW) / 2

    const bars = data.map((d, idx) => {
      const v = Number(d.value) || 0
      const h = (v / max) * innerH
      const x = offsetX + idx * (barW + gap)
      const y = padY + (innerH - h)
      return { ...d, x, y, w: barW, h, v }
    })

    return { width, height, padX, padY, innerW, innerH, max, bars }
  }, [analytics.monthly])

  const ordersTable = useMemo(() => {
    const q = orderSearch.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null

    return orders.filter((o) => {
      if (q) {
        const id = String(o?._id || '').toLowerCase()
        if (!id.includes(q)) return false
      }

      if (orderType !== 'all') {
        const isBulk = o?.purchaseMode === 'retailer' || o?.isBulkOrder
        if (orderType === 'bulk' && !isBulk) return false
        if (orderType === 'customer' && isBulk) return false
      }

      if (orderStatus !== 'all') {
        const s = String(o?.deliveryStatus || '').toLowerCase()
        if (s !== orderStatus) return false
      }

      if (fromMs != null || toMs != null) {
        const d = new Date(o?.createdAt)
        const t = d.getTime()
        if (Number.isNaN(t)) return false
        if (fromMs != null && t < fromMs) return false
        if (toMs != null && t > toMs) return false
      }

      return true
    })
  }, [orders, orderSearch, orderType, orderStatus, dateFrom, dateTo])

  const bulkSummary = useMemo(() => {
    const items = Array.isArray(cart) ? cart : []
    const totalSkus = items.length
    const totalQty = items.reduce((s, i) => s + (Number(i?.qty) || 0), 0)
    const totalAmount = items.reduce((s, i) => s + (Number(i?.price) || 0) * (Number(i?.qty) || 0), 0)
    const totalSavings = items.reduce((s, i) => {
      const reg = Number(i?.regularPrice)
      const paid = Number(i?.price)
      const qty = Number(i?.qty) || 0
      if (!Number.isFinite(reg) || !Number.isFinite(paid) || qty <= 0) return s
      const diff = reg - paid
      return s + (diff > 0 ? diff * qty : 0)
    }, 0)

    return { totalSkus, totalQty, totalAmount, totalSavings }
  }, [cart])

  const frequentProducts = useMemo(() => {
    // Based on all available order history for the user (not period-filtered)
    // Frequency = number of orders containing the product.
    const map = new Map()
    const list = Array.isArray(orders) ? orders : []
    const sorted = [...list].sort((a, b) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime())

    for (const o of sorted) {
      const items = Array.isArray(o?.items) ? o.items : []
      const seenInOrder = new Set()
      for (const it of items) {
        const productId = String(it?.product?._id || it?.product || '')
        if (!productId) continue
        if (seenInOrder.has(productId)) continue
        seenInOrder.add(productId)

        const current = map.get(productId) || {
          productId,
          name: it?.name || it?.product?.name || 'Unknown',
          product: it?.product || null,
          ordersCount: 0,
          totalQty: 0,
          lastQty: null,
          lastOrderedAt: null,
        }

        // capture most recent product object if present
        if (!current.product && it?.product && typeof it.product === 'object') current.product = it.product

        current.ordersCount += 1
        const qty = Number(it?.qty) || 0
        if (qty > 0) current.totalQty += qty
        if (current.lastOrderedAt == null) {
          current.lastOrderedAt = o?.createdAt || null
          current.lastQty = qty > 0 ? qty : null
        }

        map.set(productId, current)
      }
    }

    const arr = Array.from(map.values())
      .map((p) => ({
        ...p,
        avgQty: p.ordersCount > 0 ? p.totalQty / p.ordersCount : 0,
      }))
      .sort((a, b) => b.ordersCount - a.ordersCount)

    return arr.slice(0, 10)
  }, [orders])

  async function handleReorder(productRow) {
    const qty = Math.max(1, Math.round(Number(productRow?.avgQty) || Number(productRow?.lastQty) || 1))
    const product = productRow?.product && typeof productRow.product === 'object'
      ? productRow.product
      : { _id: productRow?.productId }

    if (!product?._id) {
      toast.error('Could not identify product for reorder')
      return
    }

    const cartHasItems = Array.isArray(cart) && cart.length > 0
    const messageLines = [
      `Reorder ${productRow?.name || 'this item'}?`,
      `Quantity: ${qty}`,
    ]
    if (cartHasItems) {
      messageLines.push('', 'Your cart currently has items.', 'This will clear your cart to avoid mixed orders.')
    }
    const ok = window.confirm(messageLines.join('\n'))
    if (!ok) return

    if (cartHasItems) {
      const cleared = await wipeCart()
      if (!cleared) {
        toast.error('Could not clear cart. Please try again.')
        return
      }
    }

    await addToCart(product, qty)
  }

  async function handleBulkAdd(product) {
    const id = product?._id
    if (!id) return

    const raw = qtyByProductId?.[id]
    const qty = Math.floor(Number(raw))
    const minQty = normalizeMinBulkQty(product?.min_bulk_qty)
    const maxQty = Number(product?.stock) || 0

    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    if (qty < minQty) {
      toast.error(`Minimum bulk quantity is ${minQty}`)
      return
    }
    if (maxQty > 0 && qty > maxQty) {
      toast.error(`Only ${maxQty} units available`)
      return
    }

    await addToCart(product, qty)
  }

  if (role !== 'retailer') return null
  if (mode !== 'retailer') return null

  return (
    <div className="b2b-page">
      <Navbar />
      
      <main className="b2b-main">
        <section className="b2b-hero">
          <div className="b2b-hero-content">
            <h1>Retailer Dashboard</h1>
            <p>Welcome, {user?.name}! Track spending, orders, and bulk savings at a glance.</p>

            <div className="rd-period">
              <div className="rd-period-label">Time period</div>
              <div className="rd-period-buttons" role="tablist" aria-label="Dashboard time filter">
                <button
                  type="button"
                  className={`rd-period-btn ${period === 'month' ? 'active' : ''}`}
                  onClick={() => setPeriod('month')}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`rd-period-btn ${period === '3months' ? 'active' : ''}`}
                  onClick={() => setPeriod('3months')}
                >
                  Last 3 Months
                </button>
                <button
                  type="button"
                  className={`rd-period-btn ${period === 'all' ? 'active' : ''}`}
                  onClick={() => setPeriod('all')}
                >
                  All Time
                </button>
              </div>
              <div className="rd-period-note">Savings are calculated vs current retail prices for ordered products.</div>
            </div>
          </div>
        </section>

        {error && <div className="b2b-error">{error}</div>}

        {loading ? (
          <div className="b2b-loading">
            <div className="spinner">⏳</div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <section className="b2b-content">
            <div className="rd-overview-grid" aria-label="Retailer dashboard overview">
              <div className="rd-card">
                <div className="rd-card-label">Total Spend</div>
                <div className="rd-card-value">{formatCurrency(overview.totalSpend)}</div>
              </div>
              <div className="rd-card">
                <div className="rd-card-label">Total Orders</div>
                <div className="rd-card-value">{overview.totalOrders}</div>
              </div>
              <div className="rd-card">
                <div className="rd-card-label">Total Units Purchased</div>
                <div className="rd-card-value">{overview.totalUnits}</div>
              </div>
              <div className="rd-card">
                <div className="rd-card-label">Average Order Value</div>
                <div className="rd-card-value">{formatCurrency(overview.avgOrderValue)}</div>
              </div>
              <div className="rd-card">
                <div className="rd-card-label">Total Savings (Bulk)</div>
                <div className="rd-card-value">{formatCurrency(overview.totalSavings)}</div>
              </div>
            </div>

            {filteredOrders.length === 0 && (
              <div className="rd-empty">
                <div className="rd-empty-title">No orders in this period</div>
                <div className="rd-empty-sub">Place an order to see spending and savings metrics here.</div>
              </div>
            )}

            <section className="rd-section" aria-label="Orders and invoice center">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Orders & Invoice Center</h2>
                <div className="rd-section-subtitle">Search, filter, and download invoices from your order history.</div>
              </div>

              <div className="rd-filters" role="group" aria-label="Order filters">
                <div className="rd-filter">
                  <label className="rd-filter-label">Search Order ID</label>
                  <input
                    className="rd-input"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="e.g. 66f0a1..."
                  />
                </div>

                <div className="rd-filter">
                  <label className="rd-filter-label">Date from</label>
                  <input
                    className="rd-input"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="rd-filter">
                  <label className="rd-filter-label">Date to</label>
                  <input
                    className="rd-input"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div className="rd-filter">
                  <label className="rd-filter-label">Order type</label>
                  <select className="rd-input" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option value="all">All</option>
                    <option value="customer">Customer Mode</option>
                    <option value="bulk">Bulk Mode</option>
                  </select>
                </div>

                <div className="rd-filter">
                  <label className="rd-filter-label">Status</label>
                  <select className="rd-input" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="rd-filter rd-filter--actions">
                  <button
                    type="button"
                    className="rd-btn"
                    onClick={() => {
                      setOrderSearch('')
                      setOrderType('all')
                      setOrderStatus('all')
                      setDateFrom('')
                      setDateTo('')
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="rd-table-wrap">
                <table className="rd-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Order Type</th>
                      <th>Total Amount</th>
                      <th>Order Status</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersTable.map((o) => {
                      const isBulk = o?.purchaseMode === 'retailer' || o?.isBulkOrder
                      const invoiceUrl = o?.invoiceUrl
                      const status = String(o?.deliveryStatus || 'pending')

                      return (
                        <tr key={o?._id}>
                          <td title={o?._id || ''} className="rd-mono">#{formatShortOrderId(o?._id)}</td>
                          <td>{formatDate(o?.createdAt)}</td>
                          <td>
                            <span className={`rd-pill ${isBulk ? 'rd-pill--bulk' : 'rd-pill--customer'}`}>
                              {isBulk ? 'Bulk Mode' : 'Customer Mode'}
                            </span>
                          </td>
                          <td>{formatCurrency(o?.totalAmount)}</td>
                          <td>
                            <span className={`rd-pill rd-pill--status rd-pill--${status.toLowerCase()}`}>{status}</span>
                          </td>
                          <td>
                            {invoiceUrl ? (
                              <a className="rd-link" href={invoiceUrl} target="_blank" rel="noreferrer">
                                Download
                              </a>
                            ) : (
                              <span className="rd-muted">Not available</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}

                    {ordersTable.length === 0 && (
                      <tr>
                        <td colSpan={6} className="rd-table-empty">
                          No orders match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rd-section" aria-label="Bulk ordering workspace">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Bulk Ordering Workspace</h2>
                <div className="rd-section-subtitle">Add bulk quantities quickly using the table below.</div>
              </div>

              {productsError && <div className="b2b-error">{productsError}</div>}

              {productsLoading ? (
                <div className="rd-subloading">Loading products…</div>
              ) : products.length === 0 ? (
                <div className="rd-empty">
                  <div className="rd-empty-title">No products available</div>
                  <div className="rd-empty-sub">Products will appear here when available for retailers.</div>
                </div>
              ) : (
                <>
                  <div className="rd-table-wrap">
                    <table className="rd-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Bulk price</th>
                          <th>Min bulk qty</th>
                          <th>Stock</th>
                          <th>Qty</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => {
                          const id = p?._id
                          const minQty = normalizeMinBulkQty(p?.min_bulk_qty)
                          const stock = Number(p?.stock) || 0
                          const hasBulkPrice = Number.isFinite(Number(p?.price_bulk))
                          const unit = hasBulkPrice ? Number(p?.price_bulk) : Number(p?.retailer_price)

                          const rawQty = qtyByProductId?.[id] ?? ''
                          const qtyNum = Math.floor(Number(rawQty))
                          const qtyValid = Number.isFinite(qtyNum) && qtyNum >= minQty && qtyNum <= stock

                          return (
                            <tr key={id}>
                              <td className="rd-strong">{p?.name || '—'}</td>
                              <td>{formatCurrency(unit)}</td>
                              <td>{minQty}</td>
                              <td>{stock > 0 ? stock : 'Out of stock'}</td>
                              <td>
                                <input
                                  className={`rd-input rd-qty ${rawQty && !qtyValid ? 'rd-input--invalid' : ''}`}
                                  type="number"
                                  min={minQty}
                                  max={stock}
                                  value={rawQty}
                                  disabled={stock <= 0}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setQtyByProductId((prev) => ({ ...(prev || {}), [id]: v }))
                                  }}
                                  onBlur={() => {
                                    const v = qtyByProductId?.[id]
                                    const n = Math.floor(Number(v))
                                    if (!v) return
                                    if (!Number.isFinite(n)) {
                                      setQtyByProductId((prev) => ({ ...(prev || {}), [id]: String(minQty) }))
                                      return
                                    }
                                    const clamped = Math.min(Math.max(n, minQty), stock)
                                    setQtyByProductId((prev) => ({ ...(prev || {}), [id]: String(clamped) }))
                                  }}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="rd-btn rd-btn--primary"
                                  onClick={() => handleBulkAdd(p)}
                                  disabled={stock <= 0 || !qtyValid}
                                  title={!qtyValid ? `Minimum ${minQty}, max ${stock}` : undefined}
                                >
                                  Add to cart
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rd-sticky-summary" aria-label="Bulk order summary">
                    <div className="rd-summary-item">
                      <div className="rd-summary-label">Total SKUs</div>
                      <div className="rd-summary-value">{bulkSummary.totalSkus}</div>
                    </div>
                    <div className="rd-summary-item">
                      <div className="rd-summary-label">Total quantity</div>
                      <div className="rd-summary-value">{bulkSummary.totalQty}</div>
                    </div>
                    <div className="rd-summary-item">
                      <div className="rd-summary-label">Total amount</div>
                      <div className="rd-summary-value">{formatCurrency(bulkSummary.totalAmount)}</div>
                    </div>
                    <div className="rd-summary-item">
                      <div className="rd-summary-label">Total savings</div>
                      <div className="rd-summary-value">{formatCurrency(bulkSummary.totalSavings)}</div>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="rd-section" aria-label="Spending and expenditure analytics">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Spending & Expenditure Analytics</h2>
                <div className="rd-section-subtitle">All values are computed from your real order history for the selected period.</div>
              </div>

              <div className="rd-analytics-grid">
                <div className="rd-panel">
                  <div className="rd-panel-title">Monthly spending trend</div>
                  {analytics.monthly.length === 0 ? (
                    <div className="rd-muted">No data available.</div>
                  ) : (
                    <div className="rd-chart-wrap" role="img" aria-label="Monthly spending trend chart">
                      <svg
                        className="rd-chart"
                        viewBox={`0 0 ${monthlyChart.width} ${monthlyChart.height}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {monthlyChart.bars.map((b) => (
                          <g key={b.key}>
                            <rect
                              x={b.x}
                              y={b.y}
                              width={b.w}
                              height={b.h}
                              rx="8"
                              className="rd-bar"
                            >
                              <title>{`${b.label}: ${formatCurrency(b.v)}`}</title>
                            </rect>
                            <text x={b.x + b.w / 2} y={monthlyChart.height - 6} textAnchor="middle" className="rd-axis">
                              {b.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                      <div className="rd-chart-hint">Hover bars to see exact values.</div>
                    </div>
                  )}
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Category-wise spending</div>
                  {analytics.categories.length === 0 ? (
                    <div className="rd-muted">No data available.</div>
                  ) : (
                    <div className="rd-kv-list" role="table" aria-label="Category-wise spending distribution">
                      {analytics.categories.slice(0, 8).map((c) => {
                        const total = analytics.categories.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1
                        const pct = (Number(c.value) || 0) / total
                        return (
                          <div className="rd-kv" key={c.name} role="row">
                            <div className="rd-kv-name" role="cell">{c.name}</div>
                            <div className="rd-kv-bar" role="cell" title={`${c.name}: ${formatCurrency(c.value)}`}>
                              <div className="rd-kv-bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
                            </div>
                            <div className="rd-kv-val" role="cell">{formatCurrency(c.value)}</div>
                          </div>
                        )
                      })}
                      {analytics.categories.length > 8 && (
                        <div className="rd-muted">Showing top 8 categories.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Bulk vs Customer spend</div>
                  <div className="rd-compare">
                    <div className="rd-compare-item" title={`Bulk Mode: ${formatCurrency(analytics.bulkSpend)}`}>
                      <div className="rd-compare-label">Bulk Mode</div>
                      <div className="rd-compare-value">{formatCurrency(analytics.bulkSpend)}</div>
                    </div>
                    <div className="rd-compare-item" title={`Customer Mode: ${formatCurrency(analytics.customerSpend)}`}>
                      <div className="rd-compare-label">Customer Mode</div>
                      <div className="rd-compare-value">{formatCurrency(analytics.customerSpend)}</div>
                    </div>
                  </div>
                  <div className="rd-compare-bar" role="img" aria-label="Bulk vs customer spend bar">
                    {(() => {
                      const total = (Number(analytics.bulkSpend) || 0) + (Number(analytics.customerSpend) || 0)
                      const bulkPct = total > 0 ? (analytics.bulkSpend / total) * 100 : 0
                      return (
                        <div className="rd-compare-bar-track" title={`Bulk ${formatCurrency(analytics.bulkSpend)} • Customer ${formatCurrency(analytics.customerSpend)}`}>
                          <div className="rd-compare-bar-bulk" style={{ width: `${bulkPct}%` }} />
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Top 5 most purchased products</div>
                  {analytics.topProducts.length === 0 ? (
                    <div className="rd-muted">No data available.</div>
                  ) : (
                    <div className="rd-table-wrap">
                      <table className="rd-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Units</th>
                            <th>Spend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.topProducts.map((p) => (
                            <tr key={p.name}>
                              <td className="rd-strong">{p.name}</td>
                              <td>{p.qty}</td>
                              <td>{formatCurrency(p.spend)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rd-section" aria-label="Repeat orders and quick reorder">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Repeat Orders / Quick Reorder</h2>
                <div className="rd-section-subtitle">Frequently ordered items from your order history (all time).</div>
              </div>

              {frequentProducts.length === 0 ? (
                <div className="rd-empty">
                  <div className="rd-empty-title">No frequent products yet</div>
                  <div className="rd-empty-sub">Place a few orders to enable quick reorder suggestions.</div>
                </div>
              ) : (
                <div className="rd-table-wrap">
                  <table className="rd-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Times ordered</th>
                        <th>Avg qty ordered</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {frequentProducts.map((p) => (
                        <tr key={p.productId}>
                          <td className="rd-strong">{p.name}</td>
                          <td>{p.ordersCount}</td>
                          <td title={Number.isFinite(p.avgQty) ? p.avgQty.toFixed(2) : ''}>{Math.max(1, Math.round(p.avgQty || 0))}</td>
                          <td>
                            <button type="button" className="rd-btn rd-btn--primary" onClick={() => handleReorder(p)}>
                              Reorder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rd-section" aria-label="Savings and insights">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Savings & Insights</h2>
                <div className="rd-section-subtitle">Transparent calculations based on real bulk orders in the selected period.</div>
              </div>

              {savingsInsights.bulkOrdersCount === 0 ? (
                <div className="rd-empty">
                  <div className="rd-empty-title">No bulk orders in this period</div>
                  <div className="rd-empty-sub">Switch to Retailer Mode and place a bulk order to start tracking savings.</div>
                </div>
              ) : (
                <div className="rd-insights">
                  <div className="rd-panel">
                    <div className="rd-panel-title">Summary</div>
                    <div className="rd-insight-line">
                      <span className="rd-insight-k">Total money saved via bulk pricing</span>
                      <span className="rd-insight-v">{formatCurrency(savingsInsights.totalSavings)}</span>
                    </div>
                    <div className="rd-insight-line" title="Total bulk spend is the sum of bulk order totals in this period.">
                      <span className="rd-insight-k">Total bulk spend</span>
                      <span className="rd-insight-v">{formatCurrency(savingsInsights.totalBulkSpend)}</span>
                    </div>
                    <div className="rd-insight-line">
                      <span className="rd-insight-k">Average savings per bulk order</span>
                      <span className="rd-insight-v">{formatCurrency(savingsInsights.avgSavingsPerBulkOrder)}</span>
                    </div>
                    <div className="rd-insight-line" title="Only counts bulk orders that actually had a positive savings vs retail price.">
                      <span className="rd-insight-k">Average savings (bulk orders with savings)</span>
                      <span className="rd-insight-v">{formatCurrency(savingsInsights.avgSavingsPerSavedBulkOrder)}</span>
                    </div>
                    <div className="rd-insight-note">
                      Savings are calculated as \"(retail price − paid unit price) × quantity\" for bulk orders, using the product retail price returned with your order history.
                    </div>
                  </div>

                  <div className="rd-panel">
                    <div className="rd-panel-title">Most cost-effective products</div>
                    {savingsInsights.mostCostEffective.length === 0 ? (
                      <div className="rd-muted">No measurable savings yet.</div>
                    ) : (
                      <div className="rd-insight-list">
                        {savingsInsights.mostCostEffective.map((p) => (
                          <div className="rd-insight-item" key={p.productId} title={`Savings rate: ${Math.round((p.savingsRate || 0) * 100)}%`}
                          >
                            <div className="rd-insight-name">{p.name}</div>
                            <div className="rd-insight-meta">
                              Saved {formatCurrency(p.savings)} total • {formatCurrency(p.savingsPerUnit)}/unit • {Math.round((p.savingsRate || 0) * 100)}% savings rate
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rd-panel">
                    <div className="rd-panel-title">Top savings drivers</div>
                    {savingsInsights.topSavingsDrivers.length === 0 ? (
                      <div className="rd-muted">No measurable savings yet.</div>
                    ) : (
                      <div className="rd-insight-list">
                        {savingsInsights.topSavingsDrivers.map((p) => (
                          <div className="rd-insight-item" key={p.productId}>
                            <div className="rd-insight-name">{p.name}</div>
                            <div className="rd-insight-meta">
                              Saved {formatCurrency(p.savings)} total • {p.qty} units • {formatCurrency(p.savingsPerUnit)}/unit
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rd-section" aria-label="Payment and settlement overview">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Payment & Settlement Overview</h2>
                <div className="rd-section-subtitle">Breakdown based on payment method and payment status for the selected period.</div>
              </div>

              <div className="rd-insights">
                <div className="rd-panel">
                  <div className="rd-panel-title">Payment method breakdown</div>
                  <div className="rd-insight-line">
                    <span className="rd-insight-k">COD</span>
                    <span className="rd-insight-v">{paymentOverview.codCount} • {formatCurrency(paymentOverview.codAmount)}</span>
                  </div>
                  <div className="rd-insight-line" title="Online payments are captured via Razorpay.">
                    <span className="rd-insight-k">UPI / Online</span>
                    <span className="rd-insight-v">{paymentOverview.onlineCount} • {formatCurrency(paymentOverview.onlineAmount)}</span>
                  </div>
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Collections & status</div>
                  <div className="rd-insight-line" title="COD orders where payment status is pending.">
                    <span className="rd-insight-k">Pending COD collections</span>
                    <span className="rd-insight-v">{paymentOverview.pendingCodCount} • {formatCurrency(paymentOverview.pendingCodAmount)}</span>
                  </div>
                  <div className="rd-insight-line">
                    <span className="rd-insight-k">Paid orders</span>
                    <span className="rd-insight-v">{paymentOverview.paidCount} • {formatCurrency(paymentOverview.paidAmount)}</span>
                  </div>
                  <div className="rd-insight-line">
                    <span className="rd-insight-k">Unpaid orders</span>
                    <span className="rd-insight-v">{paymentOverview.unpaidCount} • {formatCurrency(paymentOverview.unpaidAmount)}</span>
                  </div>
                  {paymentOverview.failedCount > 0 && (
                    <div className="rd-insight-line">
                      <span className="rd-insight-k">Failed payments</span>
                      <span className="rd-insight-v">{paymentOverview.failedCount} • {formatCurrency(paymentOverview.failedAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Transaction references (if available)</div>
                  {paymentOverview.refs.length === 0 ? (
                    <div className="rd-muted">No transaction references found for this period.</div>
                  ) : (
                    <div className="rd-ref-list">
                      {paymentOverview.refs.map((r) => (
                        <div className="rd-ref" key={`${r.id}-${r.paymentId || r.gatewayOrderId || 'na'}`}>
                          <div className="rd-ref-top">
                            <div className="rd-ref-id">#{formatShortOrderId(r.id)}</div>
                            <div className="rd-ref-meta">{formatCurrency(r.amount)} • {String(r.status || 'pending')}</div>
                          </div>
                          <div className="rd-ref-bottom">
                            {r.paymentId ? (
                              <div className="rd-ref-row"><span className="rd-ref-k">Payment ID</span><span className="rd-ref-v">{r.paymentId}</span></div>
                            ) : null}
                            {r.gatewayOrderId ? (
                              <div className="rd-ref-row"><span className="rd-ref-k">Gateway Order</span><span className="rd-ref-v">{r.gatewayOrderId}</span></div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rd-section" aria-label="Profile and business info">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Profile & Business Info</h2>
                <div className="rd-section-subtitle">A quick snapshot of your account and default delivery details.</div>
              </div>

              <div className="rd-profile-grid">
                <div className="rd-panel">
                  <div className="rd-panel-title">Account</div>
                  <div className="rd-kv">
                    <div className="rd-k">Name</div>
                    <div className="rd-v">{profileOverview.name || 'Not set'}</div>
                  </div>
                  <div className="rd-kv">
                    <div className="rd-k">Email</div>
                    <div className="rd-v">{profileOverview.email || 'Not set'}</div>
                  </div>
                  <div className="rd-kv">
                    <div className="rd-k">Phone</div>
                    <div className="rd-v">{profileOverview.phone || 'Not set'}</div>
                  </div>
                  <div className="rd-actions">
                    <button className="rd-btn" type="button" onClick={() => navigate('/profile')}>Manage in Profile</button>
                  </div>
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Business</div>
                  <div className="rd-kv">
                    <div className="rd-k">Business name</div>
                    <div className="rd-v">{profileOverview.businessName || 'Not set'}</div>
                  </div>
                  <div className="rd-kv">
                    <div className="rd-k">GSTIN</div>
                    <div className="rd-v">{profileOverview.gstin || 'Not set'}</div>
                  </div>
                  <div className="rd-muted">Add or edit business details from your profile when available.</div>
                </div>

                <div className="rd-panel">
                  <div className="rd-panel-title">Default delivery address</div>
                  {profileOverview.defaultAddress ? (
                    <div className="rd-address-block">
                      <div className="rd-address-line">{profileOverview.defaultAddress.name || profileOverview.name || '—'}</div>
                      {profileOverview.defaultAddress.phone || profileOverview.phone ? (
                        <div className="rd-address-line">{profileOverview.defaultAddress.phone || profileOverview.phone}</div>
                      ) : null}
                      {profileOverview.defaultAddress.addressLine ? (
                        <div className="rd-address-line">{profileOverview.defaultAddress.addressLine}</div>
                      ) : null}
                      <div className="rd-address-line">
                        {[profileOverview.defaultAddress.city, profileOverview.defaultAddress.state].filter(Boolean).join(', ')}
                        {profileOverview.defaultAddress.pincode ? ` - ${profileOverview.defaultAddress.pincode}` : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="rd-muted">No address saved yet.</div>
                  )}
                  <div className="rd-actions">
                    <button className="rd-btn rd-btn-secondary" type="button" onClick={() => navigate('/profile')}>Update address</button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
