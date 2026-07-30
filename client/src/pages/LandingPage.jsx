import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import About from '../components/About'
import Footer from '../components/Footer'
import '../styles/landing.css'

function LandingPage() {
  const { token, initializing } = useAuth()
  const navigate = useNavigate()

  // iPhone PWA ignores manifest start_url and always opens at /
  // So if user is already logged in, skip landing page and go straight to dashboard
  useEffect(() => {
    if (!initializing && token) {
      navigate('/dashboard', { replace: true })
    }
  }, [initializing, token, navigate])

  // Wait for auth check before rendering anything
  if (initializing) return null

  // If token exists, render nothing (redirect will fire)
  if (token) return null

  return (
    <div className="landing">
      <Navbar />
      <Hero />
      <HowItWorks />
      <About />
      <Footer />
    </div>
  )
}

export default LandingPage