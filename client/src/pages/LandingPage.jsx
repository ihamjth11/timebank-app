import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import About from '../components/About'
import Footer from '../components/Footer'
import '../styles/landing.css'

function LandingPage() {
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