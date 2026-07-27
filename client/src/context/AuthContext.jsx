import { createContext, useState, useContext, useEffect, useRef } from 'react'
import axios from 'axios'
import { subscribeToPush } from '../utils/pushNotifications'
import { analytics } from '../utils/analytics'

const AuthContext = createContext()

const INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000 // 7 days of not opening the app

// iOS Home Screen ("Add to Home Screen") web apps sometimes don't reliably
// keep localStorage in sync with regular Safari due to WebKit's storage
// purging behavior. As a resilience layer, we mirror the token into a
// first-party cookie too — cookies have historically survived more
// consistently than localStorage under iOS's Intelligent Tracking
// Prevention, so if one gets wiped we can recover the session from the
// other instead of forcing a fresh login every time.
function setStoredToken(token) {
  localStorage.setItem('token', token)
  document.cookie = `tb_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
}

function getStoredToken() {
  const fromLocalStorage = localStorage.getItem('token')
  if (fromLocalStorage) return fromLocalStorage
  const match = document.cookie.match(/(?:^|;\s*)tb_token=([^;]+)/)
  return match ? match[1] : null
}

function clearStoredToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('tb_last_active')
  document.cookie = 'tb_token=; path=/; max-age=0'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(getStoredToken())
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)
  const pushSubscribedRef = useRef(false)

  const API = 'https://timebank-app.onrender.com/api'

  const markActive = () => {
    localStorage.setItem('tb_last_active', Date.now().toString())
  }

  const clearSession = () => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  // On app load: first check whether the user has simply been away for
  // 7+ days (auto-logout for inactivity), then — and only if a real,
  // confirmed-invalid token is returned — clear the session. Network
  // errors, CORS hiccups, or a temporarily unreachable server must NEVER
  // silently log the user out; they should only be logged out by an
  // explicit Logout tap or genuine 7-day inactivity.
  useEffect(() => {
    const loadUser = async () => {
      // If localStorage lost the token but the backup cookie still has it
      // (or vice versa), re-sync both so future loads are consistent.
      if (token) {
        setStoredToken(token)
      }

      const lastActive = parseInt(localStorage.getItem('tb_last_active') || '0', 10)
      if (token && lastActive && Date.now() - lastActive > INACTIVITY_LIMIT_MS) {
        clearSession()
        setInitializing(false)
        return
      }

      if (token && !user) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setUser(res.data.user)
          markActive()
        } catch (err) {
          // Only a real "token rejected" response (401/403) should log the
          // person out. Anything else (network error, CORS, timeout, 5xx)
          // just fails silently for this load — the token stays, and the
          // next successful request will restore the session normally.
          const status = err.response?.status
          if (status === 401 || status === 403) {
            clearSession()
          }
        }
      } else if (token && user) {
        markActive()
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
      setStoredToken(res.data.token)
      markActive()
      analytics.signUp('email')
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
      setStoredToken(res.data.token)
      markActive()
      analytics.login('email')
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
      setStoredToken(res.data.token)
      markActive()
      analytics.login('google')
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
      markActive()
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
    pushSubscribedRef.current = false
    clearSession()
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