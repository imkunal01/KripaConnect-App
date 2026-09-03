import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  getAllUsers,
  toggleBlockUser,
  updateUserRole,
  deleteUser,
  clearRetailerCooldown
} from '../../services/admin'
import {
  FiUsers,
  FiSearch,
  FiPhoneCall,
  FiMessageSquare,
  FiLock,
  FiUnlock,
  FiTrash2,
  FiShield,
  FiRefreshCw,
  FiCheckCircle,
  FiUser
} from 'react-icons/fi'
import toast from 'react-hot-toast'

function getMongoObjectIdTimeMs(id) {
  if (typeof id !== 'string' || id.length < 8) return 0
  const tsHex = id.slice(0, 8)
  const seconds = Number.parseInt(tsHex, 16)
  return Number.isFinite(seconds) ? seconds * 1000 : 0
}

function getDocCreatedTimeMs(doc) {
  const createdAt = doc?.createdAt || doc?.created_at || doc?.createdOn
  const t = createdAt ? Date.parse(createdAt) : Number.NaN
  if (Number.isFinite(t)) return t
  return getMongoObjectIdTimeMs(doc?._id)
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function UserManagement() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'customer' | 'retailer' | 'blocked'
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [token])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await getAllUsers(token)
      const sorted = Array.isArray(data)
        ? data.slice().sort((a, b) => getDocCreatedTimeMs(b) - getDocCreatedTimeMs(a))
        : []
      setUsers(sorted)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleBlock(userId, currentBlocked) {
    try {
      // Optimistic update
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !currentBlocked } : u))
      await toggleBlockUser(userId, token)
      toast.success(currentBlocked ? 'User unblocked' : 'User blocked')
    } catch (err) {
      toast.error(err.message || 'Failed to update user')
      loadUsers()
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
      await updateUserRole(userId, newRole, token)
      toast.success(`Role updated to ${newRole}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update role')
      loadUsers()
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      await deleteUser(userId, token)
      setUsers(prev => prev.filter(u => u._id !== userId))
      toast.success('User deleted successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to delete user')
    }
  }

  async function handleClearCooldown(userId) {
    try {
      await clearRetailerCooldown(userId, token)
      toast.success('Retailer cooldown reset')
      loadUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to clear cooldown')
    }
  }

  // Counts
  const counts = useMemo(() => {
    let customer = 0
    let retailer = 0
    let blocked = 0

    users.forEach(u => {
      if (u.role === 'customer') customer++
      if (u.role === 'retailer') retailer++
      if (u.isBlocked) blocked++
    })

    return { total: users.length, customer, retailer, blocked }
  }, [users])

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filter === 'customer' && user.role !== 'customer') return false
      if (filter === 'retailer' && user.role !== 'retailer') return false
      if (filter === 'blocked' && !user.isBlocked) return false

      if (search.trim()) {
        const s = search.toLowerCase()
        const matchesName = user.name?.toLowerCase().includes(s)
        const matchesEmail = user.email?.toLowerCase().includes(s)
        const matchesPhone = user.phone?.includes(s)
        if (!matchesName && !matchesEmail && !matchesPhone) return false
      }
      return true
    })
  }, [users, filter, search])

  return (
    <div className="adminPage adminUserManagement">
      {/* Header */}
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">User Account Control</h1>
          <p className="adminPageHeader__subtitle">
            Manage customer accounts, retailer certifications, and access permissions
          </p>
        </div>
        <button
          type="button"
          className="adminShortcutBtn"
          onClick={loadUsers}
          title="Refresh User List"
        >
          <FiRefreshCw className={loading ? 'adminSpin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="adminCard" style={{ marginBottom: 16, padding: '14px 16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '1rem'
            }}
          />
          <input
            type="text"
            className="adminInput"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Filter Pills */}
        <div className="adminStatusPills">
          <button
            type="button"
            className={`adminStatusPill ${filter === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <FiUsers />
            <span>All Users</span>
            <span className="adminStatusPillCount">{counts.total}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${filter === 'customer' ? 'is-active' : ''}`}
            onClick={() => setFilter('customer')}
          >
            <FiUser />
            <span>Customers</span>
            <span className="adminStatusPillCount">{counts.customer}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${filter === 'retailer' ? 'is-active' : ''}`}
            onClick={() => setFilter('retailer')}
          >
            <FiShield />
            <span>Retailers</span>
            <span className="adminStatusPillCount">{counts.retailer}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${filter === 'blocked' ? 'is-active' : ''}`}
            onClick={() => setFilter('blocked')}
          >
            <FiLock />
            <span>Blocked</span>
            <span className="adminStatusPillCount">{counts.blocked}</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="adminCard">
        {/* Desktop Table */}
        <div className="adminOnlyDesktop">
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {user.profilePhoto ? (
                          <img className="adminAvatar" src={user.profilePhoto} alt={user.name} />
                        ) : (
                          <div className="adminAvatarFallback">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800 }}>{user.name}</div>
                          {user.phone && <div className="adminHelp">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="adminHelp">{user.email}</td>
                    <td>
                      <select
                        className="adminSelect"
                        value={user.role}
                        onChange={e => handleRoleChange(user._id, e.target.value)}
                        disabled={user.role === 'admin'}
                        style={{ padding: '6px 10px', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        <option value="customer">Customer</option>
                        <option value="retailer">Retailer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`adminBadge ${user.isBlocked ? 'adminBadge--danger' : 'adminBadge--ok'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="adminHelp">{formatDate(user.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="adminActions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className={`adminBtn adminBtn--sm ${user.isBlocked ? 'adminBtnPrimary' : ''}`}
                          onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                          disabled={user.role === 'admin'}
                        >
                          {user.isBlocked ? <FiUnlock /> : <FiLock />}
                          <span>{user.isBlocked ? 'Unblock' : 'Block'}</span>
                        </button>
                        <button
                          type="button"
                          className="adminBtn adminBtnDanger adminBtn--sm"
                          onClick={() => handleDelete(user._id)}
                          disabled={user.role === 'admin'}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards (Zero Friction) */}
        <div className="adminOnlyMobile">
          {filteredUsers.length === 0 ? (
            <div className="adminEmpty">No users found</div>
          ) : (
            <div className="adminMobileList">
              {filteredUsers.map(user => {
                const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : ''
                const waUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(user.name)},%20greeting%20from%20KripaConnect%20Admin!`
                  : null

                return (
                  <div key={user._id} className="adminMobileCard">
                    <div className="adminMobileCardHeader">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {user.profilePhoto ? (
                          <img className="adminAvatar" src={user.profilePhoto} alt={user.name} />
                        ) : (
                          <div className="adminAvatarFallback">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div className="adminMobileCardTitle" title={user.name}>{user.name}</div>
                          <div className="adminMobileCardSub" title={user.email}>{user.email}</div>
                        </div>
                      </div>

                      <span className={`adminBadge ${user.isBlocked ? 'adminBadge--danger' : 'adminBadge--ok'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>

                    <div className="adminMobileCardBody">
                      <div className="adminMobileMetaRow">
                        <span className="adminHelp">Joined</span>
                        <span className="adminMobileMetaValue">{formatDate(user.createdAt)}</span>
                      </div>

                      {user.phone && (
                        <div className="adminMobileMetaRow" style={{ alignItems: 'center' }}>
                          <span className="adminHelp">Phone</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="adminMobileMetaValue">{user.phone}</span>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="adminQuickBtn adminQuickBtn--whatsapp"
                                style={{ height: 26, width: 26, padding: 0 }}
                                title="WhatsApp"
                              >
                                <FiMessageSquare style={{ fontSize: '0.8rem' }} />
                              </a>
                            )}
                            <a
                              href={`tel:${user.phone}`}
                              className="adminQuickBtn adminQuickBtn--call"
                              style={{ height: 26, width: 26, padding: 0 }}
                              title="Call"
                            >
                              <FiPhoneCall style={{ fontSize: '0.8rem' }} />
                            </a>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 10 }}>
                        <div className="adminLabel">User Role</div>
                        <select
                          className="adminSelect"
                          value={user.role}
                          onChange={e => handleRoleChange(user._id, e.target.value)}
                          disabled={user.role === 'admin'}
                          style={{ fontSize: '0.84rem', fontWeight: 750 }}
                        >
                          <option value="customer">Customer</option>
                          <option value="retailer">Retailer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {user.role === 'retailer' && user.retailerCooldownUntil && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className="adminBtn adminBtn--sm"
                            style={{ width: '100%', fontSize: '0.78rem' }}
                            onClick={() => handleClearCooldown(user._id)}
                          >
                            <FiRefreshCw />
                            <span>Reset Retailer Cooldown</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="adminMobileActions">
                      <button
                        type="button"
                        className={`adminBtn adminBtn--sm ${user.isBlocked ? 'adminBtnPrimary' : ''}`}
                        onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                        disabled={user.role === 'admin'}
                      >
                        {user.isBlocked ? <FiUnlock /> : <FiLock />}
                        <span>{user.isBlocked ? 'Unblock User' : 'Block User'}</span>
                      </button>
                      <button
                        type="button"
                        className="adminBtn adminBtnDanger adminBtn--sm"
                        onClick={() => handleDelete(user._id)}
                        disabled={user.role === 'admin'}
                      >
                        <FiTrash2 />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
