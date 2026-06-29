import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import '../styles/hero.css'

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    let current = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [start, target, duration])

  return count
}

function Hero() {
  const { t } = useTranslation()
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef(null)

  const credits     = useCounter(12400, 2200, statsVisible)
  const skills      = useCounter(340,   1800, statsVisible)
  const communities = useCounter(28,    1500, statsVisible)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const scrollToHow = () => {
    const el = document.getElementById('how')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" id="home">

      <div className="hero__bg" />
      <div className="orb orb--1" />
      <div className="orb orb--2" />
      <div className="orb orb--3" />

      <div className="hero__badge">
        <span className="hero__badge-dot" />
        <span>🇱🇰 {t('badge')}</span>
      </div>

      <h1 className="hero__title">
        <span className="hero__title-line">{t('hero_title')}</span>
        <span className="hero__title-highlight">{t('hero_highlight')}</span>
      </h1>

      <p className="hero__sub">{t('hero_sub')}</p>

      <div className="hero__btns">
        <Link to="/register" className="btn--primary">
          🚀 {t('btn_start')}
        </Link>
        <button className="btn--secondary" onClick={scrollToHow}>
          ▶ {t('btn_how')}
        </button>
      </div>

      <div className="hero__stats" ref={statsRef}>
        <div className="hero__stat">
          <div className="hero__stat-num">{credits.toLocaleString()}+</div>
          <div className="hero__stat-label">{t('stat1')}</div>
        </div>
        <div className="hero__stat">
          <div className="hero__stat-num">{skills}+</div>
          <div className="hero__stat-label">{t('stat2')}</div>
        </div>
        <div className="hero__stat">
          <div className="hero__stat-num">{communities}</div>
          <div className="hero__stat-label">{t('stat3')}</div>
        </div>
      </div>

      <div className="hero__scroll">
        <span>scroll</span>
        <div className="hero__scroll-line" />
      </div>

    </section>
  )
}

export default Hero