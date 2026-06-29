import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  })
  const [err, setErr] = useState('')
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErr('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      return setErr('Please fill all fields')
    }
    if (form.password !== form.confirm) {
      return setErr('Passwords do not match')
    }
    if (form.password.length < 6) {
      return setErr('Password must be at least 6 characters')
    }
    const result = await register(form.name, form.email, form.password)
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

        {/* Badge */}
        <div className="auth__badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="#6fffd4" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span>Get 5 free Time Credits when you join!</span>
        </div>

        <h1 className="auth__title">Create Account</h1>
        <p className="auth__sub">Join Sri Lanka's first time exchange community</p>

        {err && <div className="auth__error">{err}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label className="auth__label">Full Name</label>
            <input
              className="auth__input"
              type="text"
              name="name"
              placeholder="Mohamed Hamjath"
              value={form.name}
              onChange={handleChange}
            />
          </div>

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
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Confirm Password</label>
            <input
              className="auth__input"
              type="password"
              name="confirm"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handleChange}
            />
          </div>

          <button
            className="auth__btn"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="auth__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth__link">Sign In</Link>
        </div>

      </div>
    </div>
  )
}

export default Register