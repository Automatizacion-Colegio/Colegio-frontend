import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

const ProtectedRoute = ({ allowedRoles }) => {
  const { token, role } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
