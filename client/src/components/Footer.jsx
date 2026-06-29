import { useTranslation } from 'react-i18next'
import '../styles/footer.css'

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer">

      {/* CTA Section */}
      <div className="footer__cta">
        <div className="footer__cta-inner">

          <div className="footer__cta-badge">
            <span className="footer__cta-dot" />
            <span>Join the Movement</span>
          </div>

          <h2 className="footer__cta-title">
            Ready to Trade <span>Time?</span>
          </h2>

          <p className="footer__cta-sub">
            Be part of Sri Lanka's first time exchange community. Free forever. Equal for everyone.
          </p>

          <div className="footer__cta-btns">
            <button className="footer__cta-btn-primary">
              🚀 Join TimeBank Free
            </button>
            <button className="footer__cta-btn-secondary">
              Learn More →
            </button>
          </div>

          {/* Stats row */}
          <div className="footer__cta-stats">
            <div className="footer__cta-stat">
              <span className="footer__cta-stat-num">100%</span>
              <span className="footer__cta-stat-label">Free Forever</span>
            </div>
            <div className="footer__cta-divider" />
            <div className="footer__cta-stat">
              <span className="footer__cta-stat-num">1hr</span>
              <span className="footer__cta-stat-label">= 1 Credit</span>
            </div>
            <div className="footer__cta-divider" />
            <div className="footer__cta-stat">
              <span className="footer__cta-stat-num">∞</span>
              <span className="footer__cta-stat-label">Skills</span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">

          {/* Left — Logo */}
          <div className="footer__logo">
            <div className="footer__logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                <path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span>TimeBank</span>
          </div>

          {/* Center — Credit */}
          <div className="footer__credit">
            Built with <span className="footer__heart">♥</span> by{' '}
            <span className="footer__name">Mohamed Hamjath</span>
            {' '}· Sri Lanka 🇱🇰
          </div>

          {/* Right — Copyright */}
          <div className="footer__copy">
            © 2026 TimeBank · All rights reserved
          </div>

        </div>
      </div>

    </footer>
  )
}

export default Footer