import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps any route that requires authentication.
// While the app is still initializing (reading token from storage / verifying
// with the server) we render nothing so the user never sees a flash of the
// login page. Once initialization is complete, non-authenticated users are
// redirected to /login; authenticated users see the page normally.
function ProtectedRoute({ children }) {
  const { user, token, initializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initializing && !token) {
      navigate('/login', { replace: true })
    }
  }, [initializing, token, navigate])

  if (initializing) return null

  if (!token) return null

  return children
}

export default ProtectedRoute