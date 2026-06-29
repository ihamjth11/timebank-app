import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Link } from 'react-router-dom'
import '../styles/navbar.css'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'தமிழ்',   flag: '🇱🇰' },
  { code: 'si', label: 'සිංහල',   flag: '🇱🇰' },
]

function Navbar() {
  const [scrolled, setScrolled]       = useState(false)
  const [langOpen, setLangOpen]       = useState(false)
  const [currentLang, setCurrentLang] = useState(LANGUAGES[0])
  const { t } = useTranslation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLangChange = (lang) => {
    setCurrentLang(lang)
    i18n.changeLanguage(lang.code)
    setLangOpen(false)
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>

      {/* LOGO */}
      <Link to="/" className="navbar__logo">
        <div className="navbar__logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="navbar__logo-text">TimeBank</span>
      </Link>

      {/* NAV LINKS */}
      <ul className="navbar__links">
        <li><a href="#home" className="navbar__link">{t('nav_home')}</a></li>
        <li><a href="#about" className="navbar__link">{t('nav_about')}</a></li>
        <li><a href="#how" className="navbar__link">{t('nav_how')}</a></li>
      </ul>

      {/* RIGHT */}
      <div className="navbar__right">

        {/* Language */}
        <div className="lang-dropdown">
          <button
            className="lang-dropdown__btn"
            onClick={() => setLangOpen(!langOpen)}
          >
            <span className="lang-flag">{currentLang.flag}</span>
            <span>{currentLang.label}</span>
            <svg
              className={`lang-arrow ${langOpen ? 'open' : ''}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {langOpen && (
            <ul className="lang-dropdown__menu">
              {LANGUAGES.map((lang) => (
                <li
                  key={lang.code}
                  className={`lang-dropdown__item ${currentLang.code === lang.code ? 'active' : ''}`}
                  onClick={() => handleLangChange(lang)}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {currentLang.code === lang.code && (
                    <svg className="check-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="#7c6fff" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Join Button */}
        <Link to="/register" className="navbar__join-btn">
          <span>{t('join_free')}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Link>

      </div>
    </nav>
  )
}

export default Navbar