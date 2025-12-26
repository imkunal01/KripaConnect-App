import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  getOverview,
  getRevenueStats,
  getLowStock,
  getOrderStats
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
  FaUsers,
  FaShoppingCart,
  FaExclamationTriangle
} from 'react-icons/fa'
import './AdminDashboard.css'

const COLORS = ['#FF3D3D', '#374151', '#9CA3AF', '#F87171', '#EF4444']

function StatCard({ title, value, icon, color = '#FF3D3D', loading }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div>
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-value" style={{ color: color }}>
            {loading ? '...' : value}
          </div>
        </div>
        <div
          className="stat-card-icon"
          style={{ color: color, backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { token } = useAuth()

  const [overview, setOverview] = useState({})
  const [revenueData, setRevenueData] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [orderStats, setOrderStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const [ov, rev, stock, ord] = await Promise.all([
          getOverview(token),
          getRevenueStats(token),
          getLowStock(token),
          getOrderStats(token)
        ])

        setOverview(ov?.data || {})
        setRevenueData(Array.isArray(rev) ? rev : [])
        setLowStock(Array.isArray(stock) ? stock : [])
        setOrderStats(Array.isArray(ord) ? ord : [])
      } catch (err) {
        console.error('Dashboard load failed:', err)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchData()
  }, [token])

  // ---------- Safe formatted data ----------

  const formattedRevenue = revenueData.map(item => ({
    date: item?._id
      ? new Date(item._id).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      : 'N/A',
    amount: typeof item?.total === 'number' ? item.total : 0
  }))

  const pieData = orderStats.map(item => ({
    name: item?._id
      ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
      : 'Unknown',
    value: typeof item?.count === 'number' ? item.count : 0
  }))

  const totalRevenue =
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
      ? overview.lowStock.toLocaleString('en-IN')
      : '0'

  // ---------- UI ----------

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, Admin</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          icon={<div style={{ fontSize: 22, fontWeight: 'bold' }}>₹</div>}
          color="#FF3D3D"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={<FaShoppingCart />}
          color="#374151"
          loading={loading}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<FaUsers />}
          color="#6B7280"
          loading={loading}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={<FaExclamationTriangle />}
          color="#EF4444"
          loading={loading}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenue Analytics</h3>
          <div className="chart-wrapper">
            {!loading && formattedRevenue.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3D3D" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF3D3D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${v / 1000}k`}
                    tick={{fill: '#9ca3af', fontSize: 12}}
                  />
                  <Tooltip
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#FF3D3D"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No revenue data</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Order Status Distribution</h3>
          <div className="chart-wrapper">
            {!loading && pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No order data</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Low Stock Alert</h3>

        {!loading && lowStock.length ? (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(item => (
                  <tr key={item._id}>
                    <td className="product-cell">
                      {item?.images?.[0]?.url && (
                        <img src={item.images[0].url} alt={item.name} />
                      )}
                      <span>{item?.name || 'Unnamed Product'}</span>
                    </td>
                    <td>
                      ₹{typeof item?.price === 'number'
                        ? item.price.toLocaleString('en-IN')
                        : '—'}
                    </td>
                    <td className="stock-danger">
                      {typeof item?.stock === 'number' ? item.stock : '—'}
                    </td>
                    <td>
                      <span className="badge badge-danger">Low Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">All products are well stocked!</div>
        )}
      </div>
    </div>
  )
}
