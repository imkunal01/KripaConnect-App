import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedRoute({ children, allow = ['customer', 'retailer', 'admin'] }) {
  const { loading, token, role } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!token) return <Navigate to="/login" replace />
  if (!allow.includes(role)) return <Navigate to="/login" replace />
  return children
}
