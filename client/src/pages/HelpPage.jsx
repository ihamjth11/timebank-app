import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileNav from '../components/MobileNav'
import '../styles/dashboard.css'

// SVG icons for each section — premium, consistent with TimeBank design
const SECTION_ICONS = {
  what: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
      <path d="M12 6v6l4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  register: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  skills: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
      <path d="M16.5 16.5l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  messages: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  sessions: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  classes: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  leaderboard: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 5H4a2 2 0 002 4M17 5h3a2 2 0 01-2 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 13v4M9 21h6M10 17h4v4h-4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  wallet: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
      <path d="M2 10h20" stroke={color} strokeWidth="1.5"/>
      <circle cx="16" cy="15" r="1.5" fill={color}/>
    </svg>
  ),
  profile: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  safety: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l7 4v6c0 4.4-3 8.5-7 9.5C8 20.5 5 16.4 5 12V6l7-4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pwa: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5"/>
      <path d="M9 18h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 6v6M9 9l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

const FAQ_SECTIONS = [
  {
    id: 'what',
    title: 'What is TimeBank?',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.08)',
    border: 'rgba(124,111,255,0.2)',
    items: [
      { q: 'What is TimeBank?', a: 'TimeBank is Sri Lanka\'s first time exchange platform — open to everyone, worldwide. Help someone for 1 hour, earn 1 Time Credit. Use it whenever you need help. No money. Just time. Everyone\'s hour is equal.' },
      { q: 'Is TimeBank free?', a: 'Yes! Completely free to join. No credit card needed. Every new member starts with 5 free Time Credits.' },
      { q: 'Who can use TimeBank?', a: 'Anyone! Students, professionals, teachers, freelancers — anyone with a skill to share or something to learn. Available worldwide.' }
    ]
  },
  {
    id: 'register',
    title: 'Register and Login',
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.06)',
    border: 'rgba(111,255,212,0.2)',
    items: [
      { q: 'How do I sign up?', a: 'Go to timebank-app.vercel.app and click "Join Free". Sign up with Email or Google — done in 30 seconds!' },
      { q: 'Can I use Google to sign in?', a: 'Yes! Click "Sign in with Google" on the login page. Your Google account links automatically.' },
      { q: 'What if I forget my password?', a: 'Sign in with Google instead. Email-based password reset is coming in a future update.' }
    ]
  },
  {
    id: 'skills',
    title: 'Skills — Offer and Request',
    color: '#ff6fb0',
    bg: 'rgba(255,111,176,0.06)',
    border: 'rgba(255,111,176,0.2)',
    items: [
      { q: 'How do I offer a skill?', a: 'Go to Find Skills → click "+ Post Skill" → select "Offer" → add title, category, description → set your Time Credits rate → Submit. Others can now find and message you!' },
      { q: 'How do I request a skill?', a: 'Go to Find Skills → click "+ Post Skill" → select "Request" → describe what you need → set Time Credits you will pay → Submit. Others will reach out to help!' },
      { q: 'How do I find someone to help me?', a: 'Go to Find Skills → browse the feed → filter by category or search by keyword → click any skill → click Message to connect.' }
    ]
  },
  {
    id: 'messages',
    title: 'Messaging',
    color: '#ffd166',
    bg: 'rgba(255,209,102,0.06)',
    border: 'rgba(255,209,102,0.2)',
    items: [
      { q: 'How do I message someone?', a: 'Find a skill → click on it → click Message. Or go to Messages tab → start a conversation!' },
      { q: 'What can I send?', a: 'Text, photos, files, and voice notes — just like WhatsApp. Tap the attachment icon for photos or files. Tap the mic to record a voice note.' },
      { q: 'Will I get notifications?', a: 'Yes! Real push notifications even when the app is closed — just like WhatsApp. Enable notifications when prompted.' },
      { q: 'Can I delete messages?', a: 'Yes! Hover over your message and tap the trash icon. Long-press to bulk select and delete multiple. You can also delete entire conversations.' }
    ]
  },
  {
    id: 'sessions',
    title: 'Session Scheduling',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.06)',
    border: 'rgba(124,111,255,0.2)',
    items: [
      { q: 'How do I schedule a session?', a: 'Inside a chat → tap "Schedule" (top right) → pick date and time → add meeting link (optional) → confirm. Both get reminders 15 min before and at start time.' },
      { q: 'Can I set recurring sessions?', a: 'Yes! When scheduling, toggle "Repeat weekly" and choose how many weeks. Creates multiple sessions automatically.' },
      { q: 'How do I add to Google Calendar?', a: 'In the session card inside chat, tap "Add to Google Calendar". Opens with all details pre-filled.' },
      { q: 'How do credits transfer?', a: 'After the session, both must tap "Mark as Completed" and confirm who helped. Once both confirm, credits transfer automatically.' }
    ]
  },
  {
    id: 'classes',
    title: 'Classes and Workshops',
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.06)',
    border: 'rgba(111,255,212,0.2)',
    items: [
      { q: 'How do I host a class?', a: 'Go to Classes → tap "+ Host a Class" → add title, category, date, time, capacity, credits per student, meeting link → Host Class. Your class is now live!' },
      { q: 'How do I join a class?', a: 'Go to Classes → browse or filter → find a class → tap "Join Class". Credits deduct when the host marks the class complete.' },
      { q: 'What if a class is full?', a: 'Join the waitlist! When someone leaves, you get auto-promoted and notified instantly.' },
      { q: 'How does the host settle credits?', a: 'After class, host taps "Complete". Credits from all attendees transfer to the host automatically.' }
    ]
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard and Badges',
    color: '#ffd166',
    bg: 'rgba(255,209,102,0.06)',
    border: 'rgba(255,209,102,0.2)',
    items: [
      { q: 'How does the leaderboard work?', a: 'Rankings by how much you help others — Weekly, Monthly, or All Time. More sessions as a helper = higher rank.' },
      { q: 'How do I earn badges?', a: 'Badges earned automatically from real activity — sessions completed, streaks, and more. Cannot be bought or manually awarded.' },
      { q: 'What are premium badges?', a: 'Top leaderboard rankers earn Gold, Silver, and Bronze premium badges displayed on their profile.' }
    ]
  },
  {
    id: 'calendar',
    title: 'Calendar',
    color: '#ff6fb0',
    bg: 'rgba(255,111,176,0.06)',
    border: 'rgba(255,111,176,0.2)',
    items: [
      { q: 'What does the Calendar show?', a: 'All your sessions and classes in one place. Filter by Today, Upcoming, or Past.' },
      { q: 'Can I sync with Google Calendar?', a: 'Yes! In each session card, tap "Add to Google Calendar". Full automatic sync coming in a future update.' }
    ]
  },
  {
    id: 'wallet',
    title: 'Time Wallet',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.06)',
    border: 'rgba(124,111,255,0.2)',
    items: [
      { q: 'How does the Time Wallet work?', a: 'Shows your Time Credits balance, every credit earned and spent, and full transaction history.' },
      { q: 'How do I earn credits?', a: 'Help someone in a session or host a class. After mutual confirmation, credits transfer to your wallet. Also earn 2 credits per successful referral.' },
      { q: 'How do I spend credits?', a: 'Credits deduct automatically when you receive help in a completed session or join a completed class.' }
    ]
  },
  {
    id: 'profile',
    title: 'Profile and Referrals',
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.06)',
    border: 'rgba(111,255,212,0.2)',
    items: [
      { q: 'How do I edit my profile?', a: 'Go to Profile → tap Edit Profile → update name, bio (max 90 words), avatar → save.' },
      { q: 'Can I view someone else\'s profile?', a: 'Yes! Tap any user\'s name or avatar to see their public profile — skills, ratings, reviews, badges, session count.' },
      { q: 'How do I get my referral code?', a: 'Go to Profile → scroll down to find your unique Referral Code. Share it — when someone signs up using your code, both of you earn 2 Time Credits!' }
    ]
  },
  {
    id: 'safety',
    title: 'Block and Report',
    color: '#ff5050',
    bg: 'rgba(255,80,80,0.05)',
    border: 'rgba(255,80,80,0.2)',
    items: [
      { q: 'How do I block someone?', a: 'Go to their profile → tap the 3 dots menu (⋯) → tap Block. Blocked users cannot message you, see your skills, or find your conversations. Manage blocked users from Profile settings.' },
      { q: 'How do I report someone?', a: 'Go to their profile → tap the 3 dots menu (⋯) → tap Report → select a reason and add details → submit. Report goes directly to admin.' },
      { q: 'What happens after I report?', a: 'Our admin team reviews every report. Accounts violating guidelines may be suspended. Your report is fully confidential.' }
    ]
  },
  {
    id: 'pwa',
    title: 'Install the App',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.06)',
    border: 'rgba(124,111,255,0.2)',
    items: [
      { q: 'How to install on iPhone or iPad?', a: 'Open timebank-app.vercel.app in Safari → tap the Share button → tap "Add to Home Screen" → tap Add. TimeBank appears on your home screen like a native app!' },
      { q: 'How to install on Android?', a: 'Open timebank-app.vercel.app in Chrome → tap the 3 dots menu → tap "Add to Home Screen" → tap Add. Or look for the install icon in the address bar.' },
      { q: 'How to install on Laptop or Desktop?', a: 'Open timebank-app.vercel.app in Chrome → look for the install icon in the address bar (right side) → click Install. Opens as a standalone app!' },
      { q: 'Does it work like a real app?', a: 'Yes! Full screen, no browser bar, real push notifications even when closed. Works on any device with a browser.' }
    ]
  }
]

function HelpPage() {
  const navigate = useNavigate()
  const [openSection, setOpenSection] = useState(null)
  const [openItem, setOpenItem] = useState(null)

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id)
    setOpenItem(null)
  }

  const toggleItem = (key) => {
    setOpenItem(openItem === key ? null : key)
  }

  return (
    <div className="dash" style={{ background: 'var(--bg)' }}>
      <main className="dash__main" style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
                cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>Help and FAQ</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Everything you need to know about TimeBank</p>
            </div>
          </div>

          {/* Contact banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,111,255,0.08), rgba(255,111,176,0.06))',
            border: '1px solid rgba(124,111,255,0.18)',
            borderRadius: '14px', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(124,111,255,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#7c6fff" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>Still need help?</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Email us at <span style={{ color: '#7c6fff', fontWeight: 600 }}>hello.timebankapp@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQ_SECTIONS.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  background: openSection === section.id ? section.bg : 'var(--card)',
                  border: `1px solid ${openSection === section.id ? section.border : 'var(--border)'}`,
                  borderRadius: openSection === section.id ? '14px 14px 0 0' : '14px',
                  padding: '13px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                    background: openSection === section.id ? section.bg : 'var(--input-bg)',
                    border: `1px solid ${openSection === section.id ? section.border : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s'
                  }}>
                    {SECTION_ICONS[section.id]?.(openSection === section.id ? section.color : 'var(--text-muted)')}
                  </div>
                  <span style={{
                    fontSize: '13.5px', fontWeight: 700,
                    color: openSection === section.id ? section.color : 'var(--text)',
                    transition: 'color 0.18s'
                  }}>
                    {section.title}
                  </span>
                </div>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: openSection === section.id ? section.bg : 'var(--input-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s'
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    style={{ transform: openSection === section.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6" stroke={openSection === section.id ? section.color : 'var(--text-muted)'} strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </button>

              {openSection === section.id && (
                <div style={{
                  background: 'var(--card)',
                  border: `1px solid ${section.border}`,
                  borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden'
                }}>
                  {section.items.map((item, idx) => {
                    const key = `${section.id}-${idx}`
                    const isOpen = openItem === key
                    return (
                      <div key={key} style={{ borderBottom: idx < section.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <button
                          onClick={() => toggleItem(key)}
                          style={{
                            width: '100%', textAlign: 'left',
                            background: isOpen ? section.bg : 'transparent',
                            border: 'none', padding: '12px 16px', cursor: 'pointer',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
                            transition: 'background 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                            <div style={{
                              width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                              background: isOpen ? section.color : 'var(--border)'
                            }}/>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isOpen ? section.color : 'var(--text)', lineHeight: 1.5 }}>
                              {item.q}
                            </span>
                          </div>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                            style={{ flexShrink: 0, marginTop: '4px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                            <path d="M6 9l6 6 6-6" stroke={section.color} strokeWidth="2.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        {isOpen && (
                          <div style={{ padding: '0 16px 14px 32px', borderTop: `1px solid ${section.border}` }}>
                            <div style={{ paddingTop: '10px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                              {item.a}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '28px', padding: '22px 20px',
          background: 'linear-gradient(135deg, rgba(124,111,255,0.07), rgba(255,111,176,0.05))',
          borderRadius: '16px', border: '1px solid rgba(124,111,255,0.15)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Still have questions?</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Our team is happy to help you get started</div>
          <a
            href="mailto:hello.timebankapp@gmail.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
              color: '#fff', textDecoration: 'none', borderRadius: '20px',
              padding: '10px 20px', fontSize: '13px', fontWeight: 700,
              boxShadow: '0 4px 14px rgba(124,111,255,0.3)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            hello.timebankapp@gmail.com
          </a>
        </div>

      </main>
      <MobileNav />
    </div>
  )
}

export default HelpPage