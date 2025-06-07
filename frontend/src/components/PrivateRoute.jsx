import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    // You might want to show a spinner here
    return (
      <div className="min-h-screen flex items-center justify-center bg-skin-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skin-btn-primary"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

export default PrivateRoute 