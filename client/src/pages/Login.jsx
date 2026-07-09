import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const { login, googleLogin, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErr('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      return setErr('Please fill all fields')
    }
    const result = await login(form.email, form.password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setErr(result.message)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setErr('')
    const result = await googleLogin(credentialResponse.credential)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setErr(result.message)
    }
  }

  return (
    <div className="auth">
      <div className="auth__bg" />
      <div className="auth__card">

        {/* Logo */}
        <Link to="/" className="auth__logo">
          <div className="auth__logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="auth__logo-text">TimeBank</span>
        </Link>

        <h1 className="auth__title">Welcome Back</h1>
        <p className="auth__sub">Sign in to your TimeBank account</p>

        {err && <div className="auth__error">{err}</div>}

        <div className="auth__google-wrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErr('Google login failed')}
            theme="filled_black"
            shape="pill"
            width="100%"
            text="signin_with"
          />
        </div>

        <div className="auth__divider">
          <div className="auth__divider-line" />
          <span className="auth__divider-text">or sign in with email</span>
          <div className="auth__divider-line" />
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label className="auth__label">Email Address</label>
            <input
              className="auth__input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input
              className="auth__input"
              type="password"
              name="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            className="auth__btn"
            type="submit"
            disabled={loading}
          >
           {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth__link">Create one free</Link>
        </div>

      </div>
    </div>
  )
}

export default Login