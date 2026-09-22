import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@organizacion/shared'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from './ui/Spinner'

export const ProtectedRoute = ({ roles }: { roles?: Role[] }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label='Validando sessao' />

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to='/perfil' replace />
  }

  return <Outlet />
}
