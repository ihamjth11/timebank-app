import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import '../styles/auth.css'

const API = 'https://timebank-app.onrender.com/api'

function Register() {
  const [step, setStep] = useState(1) // 1 = form, 2 = otp
  const [form, setForm] = useState({ name: '', email: '', password: '', referralCode: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])
  const timerRef = useRef(null)
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()

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

  // Step 1 — Send OTP
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return setErr('Please fill all required fields')
    if (form.password.length < 6) return setErr('Password must be at least 6 characters')
    setLoading(true); setErr('')
    try {
      await axios.post(`${API}/otp/send`, { email: form.email })
      setStep(2)
      setSuccess(`Verification code sent to ${form.email}`)
      startTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setErr(err.response?.data?.message || 'Failed to send verification code')
    } finally { setLoading(false) }
  }

  // Step 2 — Verify OTP + Register
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) return setErr('Please enter the 6-digit code')
    setLoading(true); setErr('')
    try {
      const verifyRes = await axios.post(`${API}/otp/verify`, { email: form.email, otp: otpString })
      if (!verifyRes.data.success) return setErr('Invalid or expired code')
      const result = await register(form.name, form.email, form.password, form.referralCode)
      if (result.success) { navigate('/dashboard') } else { setErr(result.message) }
    } catch (err) {
      setErr(err.response?.data?.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setLoading(true); setErr(''); setSuccess(''); setOtp(['', '', '', '', '', ''])
    try {
      await axios.post(`${API}/otp/send`, { email: form.email })
      setSuccess('New verification code sent!')
      startTimer()
      otpRefs.current[0]?.focus()
    } catch { setErr('Failed to resend code') }
    finally { setLoading(false) }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setErr('')
    const result = await googleLogin(credentialResponse.credential)
    if (result.success) { navigate('/dashboard') } else { setErr(result.message) }
  }

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

        {/* STEP 1 — REGISTER FORM */}
        {step === 1 && (
          <>
            <h1 className="auth__title">Create Account</h1>
            <p className="auth__sub">Join TimeBank and start exchanging skills</p>

            {err && <div className="auth__error">{err}</div>}

            <div className="auth__google-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErr('Google login failed')}
                theme="filled_black" shape="pill" width="100%" text="signup_with"
              />
            </div>

            <div className="auth__divider">
              <div className="auth__divider-line" />
              <span className="auth__divider-text">or sign up with email</span>
              <div className="auth__divider-line" />
            </div>

            <div className="auth__form">
              <div className="auth__field">
                <label className="auth__label">Full Name</label>
                <input className="auth__input" type="text" name="name" placeholder="Your full name" value={form.name} onChange={handleChange}/>
              </div>
              <div className="auth__field">
                <label className="auth__label">Email Address</label>
                <input className="auth__input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange}/>
              </div>
              <div className="auth__field">
                <label className="auth__label">Password</label>
                <input className="auth__input" type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange}/>
              </div>
              <div className="auth__field">
                <label className="auth__label">
                  Referral Code{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input className="auth__input" type="text" name="referralCode" placeholder="Enter referral code" value={form.referralCode} onChange={handleChange}/>
              </div>
              <button className="auth__btn" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Sending code...' : 'Continue →'}
              </button>
            </div>

            <div className="auth__footer">
              Already have an account?{' '}
              <Link to="/login" className="auth__link">Sign in</Link>
            </div>
          </>
        )}

        {/* STEP 2 — OTP VERIFY */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h1 className="auth__title">Check your email</h1>
            <p className="auth__sub">
              We sent a 6-digit code to<br/>
              <strong style={{ color: 'var(--text)' }}>{form.email}</strong>
            </p>

            {err && <div className="auth__error">{err}</div>}
            {success && (
              <div style={{ background: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.2)', color: '#00b894', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {success}
              </div>
            )}

            {/* 6 OTP boxes */}
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
                    width: '46px', height: '54px', textAlign: 'center',
                    fontSize: '22px', fontWeight: 700, borderRadius: '12px',
                    border: `2px solid ${digit ? '#7c6fff' : 'var(--border)'}`,
                    background: 'var(--input-bg)', color: 'var(--text)',
                    outline: 'none', transition: 'border-color 0.15s'
                  }}
                />
              ))}
            </div>

            <button className="auth__btn" onClick={handleVerifyOTP} disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Verifying...' : 'Verify and Create Account →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Resend code in <strong style={{ color: '#7c6fff' }}>{resendTimer}s</strong>
                </p>
              ) : (
                <button onClick={handleResend} disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#7c6fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Resend code
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={() => { setStep(1); setErr(''); setSuccess(''); setOtp(['', '', '', '', '', '']) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                ← Change email
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Register