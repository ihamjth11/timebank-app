import { useState } from 'react'
import '../styles/onboarding.css'

const SLIDES = [
  {
    emoji: '👋',
    title: 'Welcome to TimeBank!',
    desc: "Sri Lanka's first time exchange platform. Trade your skills for time — no money needed.",
    color: '#7c6fff'
  },
  {
    emoji: '⏰',
    title: '1 Hour = 1 Time Credit',
    desc: 'Help someone for 1 hour, earn 1 Time Credit. Use your credits to get help from others — everyone is equal.',
    color: '#6fffd4'
  },
  {
    emoji: '🔍',
    title: 'Find Skills',
    desc: 'Browse the Skill Feed to find people offering help — coding, cooking, design, languages, and more.',
    color: '#ff6fb0'
  },
  {
    emoji: '➕',
    title: 'Post Your Own Skill',
    desc: 'Got a skill to share? Post it! Others can connect with you and start a conversation instantly.',
    color: '#ffd166'
  },
  {
    emoji: '💬',
    title: 'Chat & Connect',
    desc: 'Once connected, message each other in the Messages tab to plan your skill exchange session.',
    color: '#7c6fff'
  },
  {
    emoji: '🚀',
    title: "You're All Set!",
    desc: 'Start exploring, offer your skills, and become part of your community. Welcome aboard!',
    color: '#6fffd4'
  }
]

function OnboardingTour({ onClose }) {
  const [step, setStep] = useState(0)
  const isLast = step === SLIDES.length - 1

  const next = () => {
    if (isLast) {
      localStorage.setItem('tb_onboarding_seen', 'true')
      onClose()
    } else {
      setStep(step + 1)
    }
  }

  const skip = () => {
    localStorage.setItem('tb_onboarding_seen', 'true')
    onClose()
  }

  const slide = SLIDES[step]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-skip" onClick={skip}>Skip</button>

        <div className="onboarding-icon" style={{ background: `${slide.color}20`, color: slide.color }}>
          <span style={{ fontSize: '40px' }}>{slide.emoji}</span>
        </div>

        <h2 className="onboarding-title">{slide.title}</h2>
        <p className="onboarding-desc">{slide.desc}</p>

        <div className="onboarding-dots">
          {SLIDES.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} style={i === step ? { background: slide.color } : {}} />
          ))}
        </div>

        <button className="onboarding-next" style={{ background: `linear-gradient(135deg, ${slide.color}, #ff6fb0)` }} onClick={next}>
          {isLast ? "Let's Go! 🎉" : 'Next →'}
        </button>
      </div>
    </div>
  )
}

export default OnboardingTour