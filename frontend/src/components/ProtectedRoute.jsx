import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import AppLoader from './AppLoader.jsx'

export default function ProtectedRoute({ children, allow = ['customer', 'retailer', 'admin'] }) {
  const { loading, token, role } = useAuth()
  if (loading) return <AppLoader status="Verifying Access..." />
  if (!token) return <Navigate to="/login" replace />
  if (!allow.includes(role)) return <Navigate to="/login" replace />
  return children
}
