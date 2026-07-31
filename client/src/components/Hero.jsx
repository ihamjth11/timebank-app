import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import '../styles/hero.css'

function Hero() {
  const { t } = useTranslation()

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

      <div className="hero__stats">
        <div className="hero__stat">
          <div className="hero__stat-num">1hr = 1</div>
          <div className="hero__stat-label">Time Credit</div>
        </div>
        <div className="hero__stat">
          <div className="hero__stat-num">0%</div>
          <div className="hero__stat-label">Real Money Needed</div>
        </div>
        <div className="hero__stat">
          <div className="hero__stat-num">100%</div>
          <div className="hero__stat-label">Community Powered</div>
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