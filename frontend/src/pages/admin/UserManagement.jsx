import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAllUsers, toggleBlockUser, updateUserRole, deleteUser } from '../../services/admin'

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
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [token])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await getAllUsers(token)
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleBlock(userId) {
    try {
      await toggleBlockUser(userId, token)
      await loadUsers()
    } catch (err) {
      alert(err.message || 'Failed to update user')
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await updateUserRole(userId, newRole, token)
      await loadUsers()
    } catch (err) {
      alert(err.message || 'Failed to update role')
    }
  }

  async function handleDelete(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId, token)
        await loadUsers()
      } catch (err) {
        alert(err.message || 'Failed to delete user')
      }
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'customer' && user.role !== 'customer') return false
    if (filter === 'retailer' && user.role !== 'retailer') return false
    if (filter === 'admin' && user.role !== 'admin') return false
    if (filter === 'blocked' && !user.isBlocked) return false
    if (search) {
      const s = search.toLowerCase()
      const matchesName = user.name?.toLowerCase().includes(s)
      const matchesEmail = user.email?.toLowerCase().includes(s)
      if (!matchesName && !matchesEmail) return false
    }
    return true
  })

  if (loading) return <div className="adminEmpty">Loading…</div>

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">User Management</h1>
          <p className="adminPageHeader__subtitle">Manage users, roles, and access control</p>
        </div>
      </div>

      <div className="adminCard" style={{ marginBottom: 16 }}>
        <div className="adminCard__section">
          <div className="adminFieldRow adminFieldRow--2" style={{ alignItems: 'end' }}>
            <div>
              <label className="adminLabel">Search</label>
              <input
                className="adminInput"
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="adminLabel">Filter</label>
              <select
                className="adminSelect"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="customer">Customers</option>
                <option value="retailer">Retailers</option>
                <option value="admin">Admins</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="adminCard">
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
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
                        <div style={{ fontWeight: 900 }}>{user.name}</div>
                        {user.phone && (
                          <div className="adminHelp">{user.phone}</div>
                        )}
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
                      style={{ opacity: user.role === 'admin' ? 0.7 : 1 }}
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
                  <td>
                    <div className="adminActions">
                      <button
                        type="button"
                        className={`adminBtn adminBtn--sm ${user.isBlocked ? 'adminBtnPrimary' : ''}`}
                        onClick={() => handleToggleBlock(user._id)}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        type="button"
                        className="adminBtn adminBtnDanger adminBtn--sm"
                        onClick={() => handleDelete(user._id)}
                        disabled={user.role === 'admin'}
                        style={{ opacity: user.role === 'admin' ? 0.45 : 1, cursor: user.role === 'admin' ? 'not-allowed' : 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && <div className="adminEmpty">No users found</div>}
      </div>
    </div>
  )
}

