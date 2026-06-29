import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/about.css'

const POINTS = [
  { color: '#7c6fff', bg: 'rgba(124,111,255,0.1)' },
  { color: '#6fffd4', bg: 'rgba(111,255,212,0.1)' },
  { color: '#ff6fb0', bg: 'rgba(255,111,176,0.1)' },
  { color: '#ffd166', bg: 'rgba(255,209,102,0.1)' },
]

// Animated SVG Illustration
function TimeBankIllustration() {
  return (
    <div className="tb-illustration">
      <svg viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* Background circles */}
        <circle cx="200" cy="190" r="160" fill="rgba(124,111,255,0.04)" className="pulse-ring"/>
        <circle cx="200" cy="190" r="120" fill="rgba(124,111,255,0.06)" className="pulse-ring2"/>

        {/* Center clock circle */}
        <circle cx="200" cy="190" r="72" fill="#13131e" stroke="rgba(124,111,255,0.3)" strokeWidth="1.5" className="center-glow"/>
        <circle cx="200" cy="190" r="64" fill="#0f0f18"/>

        {/* Clock face */}
        <circle cx="200" cy="190" r="3" fill="#7c6fff"/>
        <line x1="200" y1="190" x2="200" y2="158" stroke="#7c6fff" strokeWidth="2" strokeLinecap="round" className="clock-hour"/>
        <line x1="200" y1="190" x2="222" y2="190" stroke="#6fffd4" strokeWidth="1.5" strokeLinecap="round" className="clock-min"/>

        {/* Clock ticks */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x1 = 200 + 55 * Math.sin(rad)
          const y1 = 190 - 55 * Math.cos(rad)
          const x2 = 200 + 48 * Math.sin(rad)
          const y2 = 190 - 48 * Math.cos(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth={i % 3 === 0 ? 2 : 1}/>
        })}

        {/* Person 1 — Top */}
        <g className="person-float-1">
          <circle cx="200" cy="72" r="28" fill="#1a1a2e" stroke="rgba(124,111,255,0.3)" strokeWidth="1"/>
          <circle cx="200" cy="66" r="10" fill="rgba(124,111,255,0.8)"/>
          <path d="M184 88c0-8.8 7.2-14 16-14s16 5.2 16 14" fill="rgba(124,111,255,0.8)"/>
          <rect x="172" y="94" width="56" height="20" rx="10" fill="#7c6fff"/>
          <text x="200" y="108" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">CODING</text>
        </g>

        {/* Person 2 — Right */}
        <g className="person-float-2">
          <circle cx="328" cy="190" r="28" fill="#1a1a2e" stroke="rgba(255,111,176,0.3)" strokeWidth="1"/>
          <circle cx="328" cy="184" r="10" fill="rgba(255,111,176,0.8)"/>
          <path d="M312 206c0-8.8 7.2-14 16-14s16 5.2 16 14" fill="rgba(255,111,176,0.8)"/>
          <rect x="300" y="212" width="56" height="20" rx="10" fill="#ff6fb0"/>
          <text x="328" y="226" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">COOKING</text>
        </g>

        {/* Person 3 — Bottom */}
        <g className="person-float-3">
          <circle cx="200" cy="308" r="28" fill="#1a1a2e" stroke="rgba(111,255,212,0.3)" strokeWidth="1"/>
          <circle cx="200" cy="302" r="10" fill="rgba(111,255,212,0.8)"/>
          <path d="M184 324c0-8.8 7.2-14 16-14s16 5.2 16 14" fill="rgba(111,255,212,0.8)"/>
          <rect x="172" y="330" width="56" height="20" rx="10" fill="#6fffd4"/>
          <text x="200" y="344" textAnchor="middle" fill="#0a0a0f" fontSize="9" fontWeight="700">TEACHING</text>
        </g>

        {/* Person 4 — Left */}
        <g className="person-float-4">
          <circle cx="72" cy="190" r="28" fill="#1a1a2e" stroke="rgba(255,209,102,0.3)" strokeWidth="1"/>
          <circle cx="72" cy="184" r="10" fill="rgba(255,209,102,0.8)"/>
          <path d="M56 206c0-8.8 7.2-14 16-14s16 5.2 16 14" fill="rgba(255,209,102,0.8)"/>
          <rect x="44" y="212" width="56" height="20" rx="10" fill="#ffd166"/>
          <text x="72" y="226" textAnchor="middle" fill="#0a0a0f" fontSize="9" fontWeight="700">DESIGN</text>
        </g>

        {/* Connecting lines with dots */}
        {/* Top to center */}
        <line x1="200" y1="100" x2="200" y2="118" stroke="rgba(124,111,255,0.4)" strokeWidth="1" strokeDasharray="4 3" className="connect-line"/>
        {/* Right to center */}
        <line x1="300" y1="190" x2="272" y2="190" stroke="rgba(255,111,176,0.4)" strokeWidth="1" strokeDasharray="4 3" className="connect-line"/>
        {/* Bottom to center */}
        <line x1="200" y1="280" x2="200" y2="262" stroke="rgba(111,255,212,0.4)" strokeWidth="1" strokeDasharray="4 3" className="connect-line"/>
        {/* Left to center */}
        <line x1="100" y1="190" x2="128" y2="190" stroke="rgba(255,209,102,0.4)" strokeWidth="1" strokeDasharray="4 3" className="connect-line"/>

        {/* Credit badges floating */}
        <g className="credit-badge-1">
          <rect x="240" y="108" width="72" height="26" rx="13" fill="rgba(124,111,255,0.15)" stroke="rgba(124,111,255,0.3)" strokeWidth="1"/>
          <text x="276" y="125" textAnchor="middle" fill="#7c6fff" fontSize="10" fontWeight="700">+1 Credit</text>
        </g>

        <g className="credit-badge-2">
          <rect x="88" y="248" width="72" height="26" rx="13" fill="rgba(111,255,212,0.15)" stroke="rgba(111,255,212,0.3)" strokeWidth="1"/>
          <text x="124" y="265" textAnchor="middle" fill="#6fffd4" fontSize="10" fontWeight="700">+1 Credit</text>
        </g>

      </svg>
    </div>
  )
}

function About() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const points = [t('point1'), t('point2'), t('point3'), t('point4')]

  return (
    <section className="about" id="about" ref={ref}>

      {/* Left */}
      <div className={`about__left ${visible ? 'visible' : ''}`}>
        <div className="about__label">About TimeBank</div>
        <h2 className="about__title">
          What is <span>TimeBank?</span>
        </h2>
        <p className="about__text">{t('about_text')}</p>
        <ul className="about__points">
          {points.map((point, i) => (
            <li key={i} className="about__point">
              <div className="about__point-icon" style={{ background: POINTS[i].bg, color: POINTS[i].color }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — SVG Illustration */}
      <div className={`about__right ${visible ? 'visible' : ''}`}>
        <TimeBankIllustration />
      </div>
     {/* Founder Card */}
      <div className={`about__founder ${visible ? 'visible' : ''}`}>
        <div className="about__founder-card">
          <div className="about__founder-left">
            <div className="about__founder-avatar">
              <span>MH</span>
            </div>
            <div className="about__founder-dot" />
          </div>
          <div className="about__founder-info">
            <div className="about__founder-tag">
           <span className="about__founder-icon">✦</span> Founder & Developer
           </div>
            <div className="about__founder-name">Mohamed Hamjath</div>
            <div className="about__founder-desc">
             Developer · Sri Lanka 🇱🇰
             </div>
          </div>
          <div className="about__founder-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.9L8 1z" fill="#ffd166"/>
            </svg>
            <span>Creator</span>
          </div>
        </div>
      </div>
  

    </section>
  )
}

export default About