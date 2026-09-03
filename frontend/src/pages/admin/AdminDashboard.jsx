import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  getOverview,
  getRevenueStats,
  getLowStock,
  getOrderStats,
  updateProductAdmin
} from '../../services/admin'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import {
  FiZap,
  FiAlertTriangle,
  FiTrendingUp,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiPlus,
  FiRefreshCw,
  FiArrowRight,
  FiCheckCircle,
  FiTruck,
  FiDollarSign
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import './AdminDashboard.css'

const PIE_COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#64748b']

export default function AdminDashboard({ onSelectTab, onNavigateToOrders, onNavigateToProducts }) {
  const { token } = useAuth()

  const [overview, setOverview] = useState({})
  const [revenueData, setRevenueData] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [orderStats, setOrderStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartTimeframe, setChartTimeframe] = useState('all') // '7d' | '30d' | 'all'
  const [restockingId, setRestockingId] = useState(null)

  useEffect(() => {
    if (token) fetchDashboardData()
  }, [token])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const [ov, rev, stock, ord] = await Promise.all([
        getOverview(token).catch(() => ({})),
        getRevenueStats(token).catch(() => []),
        getLowStock(token).catch(() => []),
        getOrderStats(token).catch(() => [])
      ])

      setOverview(ov?.data || ov || {})
      setRevenueData(Array.isArray(rev) ? rev : [])
      setLowStock(Array.isArray(stock) ? stock : [])
      setOrderStats(Array.isArray(ord) ? ord : [])
    } catch (err) {
      console.error('Dashboard load failed:', err)
      toast.error('Failed to refresh dashboard analytics')
    } finally {
      setLoading(false)
    }
  }

  // Quick Inline Restock
  async function handleQuickRestock(item, addAmount) {
    try {
      setRestockingId(item._id)
      const currentStock = Number(item.stock) || 0
      const newStock = currentStock + addAmount

      await updateProductAdmin(item._id, { stock: newStock }, null, token)
      
      // Optimistically update local lowStock list
      setLowStock(prev => 
        prev.map(p => p._id === item._id ? { ...p, stock: newStock } : p)
            .filter(p => Number(p.stock) < 10)
      )

      toast.success(`Restocked ${item.name} (+${addAmount} units)`)
    } catch (err) {
      toast.error(err.message || 'Failed to restock product')
    } finally {
      setRestockingId(null)
    }
  }

  // Processed chart data based on timeframe
  const formattedRevenue = useMemo(() => {
    let list = revenueData.map(item => ({
      rawDate: item?._id ? new Date(item._id) : new Date(),
      date: item?._id
        ? new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'N/A',
      amount: typeof item?.total === 'number' ? item.total : 0
    }))

    list.sort((a, b) => a.rawDate - b.rawDate)

    if (chartTimeframe === '7d') {
      list = list.slice(-7)
    } else if (chartTimeframe === '30d') {
      list = list.slice(-30)
    }

    return list
  }, [revenueData, chartTimeframe])

  const pieData = useMemo(() => {
    return orderStats.map(item => ({
      name: item?._id
        ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
        : 'Unknown',
      value: typeof item?.count === 'number' ? item.count : 0
    }))
  }, [orderStats])

  const pendingOrders = useMemo(() => {
    const stat = orderStats.find(s => s._id === 'pending')
    return stat ? stat.count : 0
  }, [orderStats])

  const totalRevenueFormatted =
    typeof overview?.totalRevenue === 'number'
      ? `₹${overview.totalRevenue.toLocaleString('en-IN')}`
      : '₹0'

  const totalOrders =
    typeof overview?.totalOrders === 'number'
      ? overview.totalOrders.toLocaleString('en-IN')
      : '0'

  const totalUsers =
    typeof overview?.totalUsers === 'number'
      ? overview.totalUsers.toLocaleString('en-IN')
      : '0'

  const lowStockCount =
    typeof overview?.lowStock === 'number'
      ? overview.lowStock
      : lowStock.length

  return (
    <div className="adminPage adminDashboard">
      {/* ---------------- Header & Page Title ---------------- */}
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Operations Overview</h1>
          <p className="adminPageHeader__subtitle">
            Real-time fulfillment metrics, store health, and inventory
          </p>
        </div>
        <button
          type="button"
          className="adminShortcutBtn"
          onClick={fetchDashboardData}
          title="Refresh Data"
        >
          <FiRefreshCw className={loading ? 'adminSpin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ---------------- Live Urgency Banners (Zero Friction) ---------------- */}
      {pendingOrders > 0 && (
        <div className="adminUrgencyBanner">
          <div className="adminUrgencyBanner__content">
            <div className="adminUrgencyBanner__icon">
              <FiTruck />
            </div>
            <div className="adminUrgencyBanner__text">
              <div className="adminUrgencyBanner__title">
                {pendingOrders} Order{pendingOrders > 1 ? 's' : ''} Awaiting Dispatch
              </div>
              <div className="adminUrgencyBanner__sub">
                Customers are waiting for their items to be shipped
              </div>
            </div>
          </div>
          <button
            type="button"
            className="adminUrgencyBanner__btn"
            onClick={onNavigateToOrders || (() => onSelectTab && onSelectTab('orders'))}
          >
            <span>Dispatch Orders</span>
            <FiArrowRight />
          </button>
        </div>
      )}

      {lowStockCount > 0 && (
        <div className="adminUrgencyBanner adminUrgencyBanner--warning">
          <div className="adminUrgencyBanner__content">
            <div className="adminUrgencyBanner__icon">
              <FiAlertTriangle />
            </div>
            <div className="adminUrgencyBanner__text">
              <div className="adminUrgencyBanner__title">
                {lowStockCount} Product{lowStockCount > 1 ? 's' : ''} Running Low
              </div>
              <div className="adminUrgencyBanner__sub">
                Inventory levels are below the reorder threshold
              </div>
            </div>
          </div>
          <button
            type="button"
            className="adminUrgencyBanner__btn"
            onClick={onNavigateToProducts || (() => onSelectTab && onSelectTab('products'))}
          >
            <span>Review Stock</span>
            <FiArrowRight />
          </button>
        </div>
      )}

      {/* ---------------- Quick Action Shortcuts ---------------- */}
      <div className="adminQuickShortcuts">
        <button
          type="button"
          className="adminShortcutBtn adminShortcutBtn--primary"
          onClick={() => onSelectTab && onSelectTab('products')}
        >
          <FiPlus />
          <span>Add Product</span>
        </button>

        <button
          type="button"
          className="adminShortcutBtn"
          onClick={() => onSelectTab && onSelectTab('orders')}
        >
          <FiShoppingBag />
          <span>Manage Orders</span>
        </button>

        <button
          type="button"
          className="adminShortcutBtn"
          onClick={() => onSelectTab && onSelectTab('users')}
        >
          <FiUsers />
          <span>View Users</span>
        </button>

        <button
          type="button"
          className="adminShortcutBtn"
          onClick={() => onSelectTab && onSelectTab('categories')}
        >
          <FiBox />
          <span>Categories</span>
        </button>
      </div>

      {/* ---------------- KPI Metric Cards ---------------- */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Net Revenue</span>
            <div className="kpi-card-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-card-value">{loading ? '...' : totalRevenueFormatted}</div>
          <div className="kpi-card-sub">
            <FiTrendingUp />
            <span>Active Volume</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Orders</span>
            <div className="kpi-card-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
              <FiShoppingBag />
            </div>
          </div>
          <div className="kpi-card-value">{loading ? '...' : totalOrders}</div>
          <div className="kpi-card-sub" style={{ color: '#6b7280' }}>
            <span>{pendingOrders} awaiting fulfillment</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Registered Users</span>
            <div className="kpi-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FiUsers />
            </div>
          </div>
          <div className="kpi-card-value">{loading ? '...' : totalUsers}</div>
          <div className="kpi-card-sub" style={{ color: '#2563eb' }}>
            <span>Retailers & Customers</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Low Stock Alert</span>
            <div className="kpi-card-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <FiAlertTriangle />
            </div>
          </div>
          <div
            className="kpi-card-value"
            style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981' }}
          >
            {loading ? '...' : lowStockCount}
          </div>
          <div className="kpi-card-sub" style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981' }}>
            <span>{lowStockCount > 0 ? 'Requires attention' : 'Inventory healthy'}</span>
          </div>
        </div>
      </div>

      {/* ---------------- Interactive Charts ---------------- */}
      <div className="dashboard-charts-grid">
        {/* Revenue Analytics Chart */}
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3 className="dashboard-chart-title">Revenue Trajectory</h3>
            <div className="dashboard-chart-pills">
              <button
                type="button"
                className={`dashboard-chart-pill ${chartTimeframe === '7d' ? 'isActive' : ''}`}
                onClick={() => setChartTimeframe('7d')}
              >
                7D
              </button>
              <button
                type="button"
                className={`dashboard-chart-pill ${chartTimeframe === '30d' ? 'isActive' : ''}`}
                onClick={() => setChartTimeframe('30d')}
              >
                30D
              </button>
              <button
                type="button"
                className={`dashboard-chart-pill ${chartTimeframe === 'all' ? 'isActive' : ''}`}
                onClick={() => setChartTimeframe('all')}
              >
                All
              </button>
            </div>
          </div>

          <div className="dashboard-chart-container">
            {!loading && formattedRevenue.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3D3D" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF3D3D" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                      fontWeight: 700
                    }}
                    formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#FF3D3D"
                    strokeWidth={2.5}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="adminEmpty">No revenue records found</div>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3 className="dashboard-chart-title">Order Statuses</h3>
            <span className="adminBadge">{totalOrders} Total</span>
          </div>

          <div className="dashboard-chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!loading && pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontWeight: 700
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="adminEmpty">No order status breakdown</div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Quick Restock Ticker (Frictionless) ---------------- */}
      <div className="adminCard" style={{ marginBottom: 20 }}>
        <div className="adminCard__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertTriangle style={{ color: '#ef4444' }} />
            <h3 className="adminCard__title">Low Stock Quick Restock</h3>
          </div>
          <button
            type="button"
            className="adminHeaderBtn"
            style={{ height: 30, fontSize: '0.75rem' }}
            onClick={() => onSelectTab && onSelectTab('products')}
          >
            <span>All Products</span>
            <FiArrowRight />
          </button>
        </div>

        <div>
          {!loading && lowStock.length > 0 ? (
            lowStock.slice(0, 5).map(item => (
              <div key={item._id} className="restock-item-card">
                <div className="restock-item-info">
                  <img
                    src={item.images?.[0]?.url || 'https://via.placeholder.com/50?text=No+Img'}
                    alt={item.name}
                    className="restock-item-thumb"
                  />
                  <div className="restock-item-meta">
                    <div className="restock-item-name" title={item.name}>{item.name}</div>
                    <div className="restock-item-stock">
                      {item.stock === 0 ? 'Out of stock' : `Only ${item.stock} remaining`}
                    </div>
                  </div>
                </div>

                <div className="restock-quick-actions">
                  <button
                    type="button"
                    className="restock-btn"
                    disabled={restockingId === item._id}
                    onClick={() => handleQuickRestock(item, 5)}
                  >
                    +5 Units
                  </button>
                  <button
                    type="button"
                    className="restock-btn"
                    disabled={restockingId === item._id}
                    onClick={() => handleQuickRestock(item, 10)}
                  >
                    +10 Units
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="adminEmpty" style={{ padding: '24px 16px' }}>
              <FiCheckCircle style={{ color: '#10b981', fontSize: '1.6rem', marginBottom: 6 }} />
              <div>All catalog inventory is well stocked!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
