import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import '../styles/auth.css'

const API = 'https://timebank-app.onrender.com/api'

function Login() {
  const [step, setStep] = useState('login') // login | forgot-email | forgot-otp | forgot-reset
  const [form, setForm] = useState({ email: '', password: '' })
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])
  const timerRef = useRef(null)

  const { login, googleLogin, loading: authLoading, token, initializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initializing && token) {
      navigate('/dashboard', { replace: true })
    }
  }, [initializing, token, navigate])

  const startTimer = () => {
    setResendTimer(60)
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => { return () => clearInterval(timerRef.current) }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErr('')
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setErr('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return setErr('Please fill all fields')
    const result = await login(form.email, form.password)
    if (result.success) { navigate('/dashboard') } else { setErr(result.message) }
  }

  const handleForgotSend = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return setErr('Please enter your email')
    setLoading(true); setErr('')
    try {
      await axios.post(`${API}/otp/send`, { email: forgotEmail })
      setStep('forgot-otp')
      setSuccess(`Verification code sent to ${forgotEmail}`)
      startTimer()
    } catch (err) {
      setErr(err.response?.data?.message || 'Failed to send code')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setLoading(true); setErr(''); setSuccess(''); setOtp(['', '', '', '', '', ''])
    try {
      await axios.post(`${API}/otp/send`, { email: forgotEmail })
      setSuccess('New code sent!')
      startTimer()
      otpRefs.current[0]?.focus()
    } catch { setErr('Failed to resend code') }
    finally { setLoading(false) }
  }

  const handleForgotVerify = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) return setErr('Please enter the 6-digit code')
    setLoading(true); setErr('')
    try {
      const res = await axios.post(`${API}/otp/verify`, { email: forgotEmail, otp: otpString })
      if (res.data.success) { setStep('forgot-reset'); setSuccess('') }
    } catch (err) {
      setErr(err.response?.data?.message || 'Invalid or expired code')
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) return setErr('Password must be at least 6 characters')
    if (newPassword !== confirmPassword) return setErr('Passwords do not match')
    setLoading(true); setErr('')
    try {
      await axios.post(`${API}/auth/reset-password`, { email: forgotEmail, password: newPassword })
      setSuccess('Password reset successfully!')
      setTimeout(() => {
        setStep('login'); setSuccess(''); setForgotEmail('')
        setOtp(['', '', '', '', '', '']); setNewPassword(''); setConfirmPassword('')
      }, 1500)
    } catch (err) {
      setErr(err.response?.data?.message || 'Failed to reset password')
    } finally { setLoading(false) }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setErr('')
    const result = await googleLogin(credentialResponse.credential)
    if (result.success) { navigate('/dashboard') } else { setErr(result.message) }
  }

  if (initializing || token) return null

  const OtpBoxes = () => (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => otpRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleOtpChange(index, e.target.value)}
          onKeyDown={e => handleOtpKeyDown(index, e)}
          onPaste={index === 0 ? handleOtpPaste : undefined}
          style={{
            width: '46px', height: '54px', textAlign: 'center', fontSize: '22px', fontWeight: 700,
            borderRadius: '12px', border: `2px solid ${digit ? '#7c6fff' : 'var(--border)'}`,
            background: 'var(--input-bg)', color: 'var(--text)', outline: 'none', transition: 'border-color 0.15s'
          }}
        />
      ))}
    </div>
  )

  const IconCircle = ({ children }) => (
    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
      {children}
    </div>
  )

  const SuccessBanner = () => success ? (
    <div style={{ background: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.2)', color: '#00b894', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
      {success}
    </div>
  ) : null

  return (
    <div className="auth">
      <div className="auth__bg" />
      <div className="auth__card">

        <Link to="/" className="auth__logo">
          <div className="auth__logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="auth__logo-text">TimeBank</span>
        </Link>

        {/* LOGIN */}
        {step === 'login' && (
          <>
            <h1 className="auth__title">Welcome Back</h1>
            <p className="auth__sub">Sign in to your TimeBank account</p>
            {err && <div className="auth__error">{err}</div>}
            <div className="auth__google-wrap">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErr('Google login failed')} theme="filled_black" shape="pill" width="100%" text="signin_with"/>
            </div>
            <div className="auth__divider">
              <div className="auth__divider-line" />
              <span className="auth__divider-text">or sign in with email</span>
              <div className="auth__divider-line" />
            </div>
            <div className="auth__form">
              <div className="auth__field">
                <label className="auth__label">Email Address</label>
                <input className="auth__input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange}/>
              </div>
              <div className="auth__field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="auth__label" style={{ margin: 0 }}>Password</label>
                  <button type="button" onClick={() => { setStep('forgot-email'); setErr(''); setSuccess('') }}
                    style={{ background: 'none', border: 'none', color: '#7c6fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
                <input className="auth__input" type="password" name="password" placeholder="Your password" value={form.password} onChange={handleChange}/>
              </div>
              <button className="auth__btn" onClick={handleSubmit} disabled={authLoading}>
                {authLoading ? 'Signing in...' : 'Sign In →'}
              </button>
            </div>
            <div className="auth__footer">
              Don't have an account?{' '}
              <Link to="/register" className="auth__link">Create one free</Link>
            </div>
          </>
        )}

        {/* FORGOT EMAIL */}
        {step === 'forgot-email' && (
          <>
            <button onClick={() => { setStep('login'); setErr(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '16px', padding: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to login
            </button>
            <IconCircle>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </IconCircle>
            <h1 className="auth__title">Forgot Password?</h1>
            <p className="auth__sub">Enter your email and we'll send you a verification code</p>
            {err && <div className="auth__error">{err}</div>}
            <div className="auth__form">
              <div className="auth__field">
                <label className="auth__label">Email Address</label>
                <input className="auth__input" type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setErr('') }}/>
              </div>
              <button className="auth__btn" onClick={handleForgotSend} disabled={loading}>
                {loading ? 'Sending code...' : 'Send Verification Code →'}
              </button>
            </div>
          </>
        )}

        {/* FORGOT OTP */}
        {step === 'forgot-otp' && (
          <>
            <IconCircle>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IconCircle>
            <h1 className="auth__title">Check your email</h1>
            <p className="auth__sub">We sent a 6-digit code to<br/><strong style={{ color: 'var(--text)' }}>{forgotEmail}</strong></p>
            {err && <div className="auth__error">{err}</div>}
            <SuccessBanner />
            <OtpBoxes />
            <button className="auth__btn" onClick={handleForgotVerify} disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Resend code in <strong style={{ color: '#7c6fff' }}>{resendTimer}s</strong></p>
              ) : (
                <button onClick={handleResend} disabled={loading} style={{ background: 'none', border: 'none', color: '#7c6fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Resend code</button>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={() => { setStep('forgot-email'); setErr(''); setSuccess(''); setOtp(['', '', '', '', '', '']) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                ← Change email
              </button>
            </div>
          </>
        )}

        {/* FORGOT RESET */}
        {step === 'forgot-reset' && (
          <>
            <IconCircle>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IconCircle>
            <h1 className="auth__title">Set New Password</h1>
            <p className="auth__sub">Choose a strong password for your account</p>
            {err && <div className="auth__error">{err}</div>}
            <SuccessBanner />
            <div className="auth__form">
              <div className="auth__field">
                <label className="auth__label">New Password</label>
                <input className="auth__input" type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => { setNewPassword(e.target.value); setErr('') }}/>
              </div>
              <div className="auth__field">
                <label className="auth__label">Confirm Password</label>
                <input className="auth__input" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErr('') }}/>
              </div>
              <button className="auth__btn" onClick={handleResetPassword} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Login