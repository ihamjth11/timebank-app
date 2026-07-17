import { createContext, useState, useContext, useEffect, useRef } from 'react'
import axios from 'axios'
import { subscribeToPush } from '../utils/pushNotifications'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)
  const pushSubscribedRef = useRef(false)

  const API = 'https://timebank-app.onrender.com/api'

  // On app load, if a token exists but user is not loaded, fetch the real user
  useEffect(() => {
    const loadUser = async () => {
      if (token && !user) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setUser(res.data.user)
        } catch (err) {
          // Token invalid/expired — clear it
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setInitializing(false)
    }
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Once we have both a valid token and a loaded user, register for
  // browser push notifications (only once per app session).
  useEffect(() => {
    if (token && user && !pushSubscribedRef.current) {
      pushSubscribedRef.current = true
      subscribeToPush(token)
    }
  }, [token, user])

  const register = async (name, email, password, refCode) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/auth/register`, {
        name, email, password, refCode
      })
      setToken(res.data.token)
      setUser(res.data.user)
      localStorage.setItem('token', res.data.token)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email, password
      })
      setToken(res.data.token)
      setUser(res.data.user)
      localStorage.setItem('token', res.data.token)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (credential, refCode) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/auth/google`, { credential, refCode })
      setToken(res.data.token)
      setUser(res.data.user)
      localStorage.setItem('token', res.data.token)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google login failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.put(`${API}/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data.user)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    pushSubscribedRef.current = false
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading, error, initializing,
      register, login, googleLogin, updateProfile, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)