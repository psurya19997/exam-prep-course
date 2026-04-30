import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Spinner from './ui/Spinner.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-gray-500">
        <Spinner />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
