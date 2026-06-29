import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/howitworks.css'

const STEPS = [
  {
    id: 1,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.1)',
  },
  {
    id: 2,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#ff6fb0',
    bg: 'rgba(255,111,176,0.1)',
  },
  {
    id: 3,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.1)',
  },
  {
    id: 4,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#ffd166',
    bg: 'rgba(255,209,102,0.1)',
  },
]

function HowItWorks() {
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

  const steps = [
    { title: t('step1_title'), desc: t('step1_desc') },
    { title: t('step2_title'), desc: t('step2_desc') },
    { title: t('step3_title'), desc: t('step3_desc') },
    { title: t('step4_title'), desc: t('step4_desc') },
  ]

  return (
    <section className="how" id="how" ref={ref}>

      {/* Header */}
      <div className={`how__header ${visible ? 'visible' : ''}`}>
        <div className="how__label">{t('how_label')}</div>
        <h2 className="how__title">
        Simple. <span>Fair.</span> Human.
        </h2>
        <p className="how__sub">{t('how_sub')}</p>
      </div>

      {/* Steps Grid */}
      <div className="how__grid">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`how__card ${visible ? 'visible' : ''}`}
            style={{ transitionDelay: `${i * 0.12}s` }}
          >
            {/* Step number */}
            <div className="how__card-num" style={{ color: step.color }}>
              0{step.id}
            </div>

            {/* Icon */}
            <div className="how__card-icon" style={{ background: step.bg, color: step.color }}>
              {step.icon}
            </div>

            {/* Content */}
            <h3 className="how__card-title">{steps[i].title}</h3>
            <p className="how__card-desc">{steps[i].desc}</p>

            {/* Connector arrow — last card-ல வேண்டாம் */}
            {i < 3 && (
              <div className="how__arrow" style={{ color: step.color }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

    </section>
  )
}

export default HowItWorks