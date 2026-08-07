import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileNav from '../components/MobileNav'
import '../styles/dashboard.css'

const FAQ_SECTIONS = [
  {
    id: 'what',
    emoji: '⏰',
    title: 'What is TimeBank?',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.1)',
    border: 'rgba(124,111,255,0.3)',
    items: [
      {
        q: 'What is TimeBank?',
        a: 'TimeBank is Sri Lanka\'s first time exchange platform — open to everyone, worldwide. You help someone for 1 hour and earn 1 Time Credit. You use that credit whenever you need help from someone else. No money involved. Everyone\'s hour is equal.'
      },
      {
        q: 'Is TimeBank free?',
        a: 'Yes! TimeBank is completely free to join and use. No credit card needed. Every new member starts with 5 free Time Credits to get started.'
      },
      {
        q: 'Who can use TimeBank?',
        a: 'Anyone! Students, professionals, teachers, freelancers — anyone with a skill to share or something to learn. TimeBank is available worldwide.'
      }
    ]
  },
  {
    id: 'register',
    emoji: '🔐',
    title: 'Register and Login',
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.1)',
    border: 'rgba(111,255,212,0.3)',
    items: [
      {
        q: 'How do I sign up?',
        a: 'Go to timebank-app.vercel.app and click "Join Free". You can sign up with your Email or use Google sign-in. The whole process takes less than 30 seconds!'
      },
      {
        q: 'Can I use Google to sign in?',
        a: 'Yes! Click "Sign in with Google" on the login or register page. Your Google account will be linked automatically.'
      },
      {
        q: 'What happens if I forget my password?',
        a: 'You can always sign in with Google instead. Password reset via email is coming soon in a future update.'
      }
    ]
  },
  {
    id: 'skills',
    emoji: '🎯',
    title: 'Skills — Offer and Request',
    color: '#ff6fb0',
    bg: 'rgba(255,111,176,0.1)',
    border: 'rgba(255,111,176,0.3)',
    items: [
      {
        q: 'How do I offer a skill?',
        a: 'Go to Find Skills → click "+ Post Skill" → select "Offer" → add a title, category, and description → set your Time Credits rate → Submit. Others can now find and message you!'
      },
      {
        q: 'How do I request a skill?',
        a: 'Go to Find Skills → click "+ Post Skill" → select "Request" → describe what you need → add category and Time Credits you will pay → Submit. Others will reach out to help you!'
      },
      {
        q: 'How do I find someone to help me?',
        a: 'Go to Find Skills → browse the feed → filter by category or search by keyword → click on any skill to view details → click Message to connect with the person.'
      }
    ]
  },
  {
    id: 'messages',
    emoji: '💬',
    title: 'Messaging',
    color: '#ffd166',
    bg: 'rgba(255,209,102,0.1)',
    border: 'rgba(255,209,102,0.3)',
    items: [
      {
        q: 'How do I message someone?',
        a: 'Find a skill → click on it → click Message. Or go to the Messages tab → select a conversation → start chatting!'
      },
      {
        q: 'What can I send in messages?',
        a: 'You can send text, photos, files, and voice notes — just like WhatsApp. Tap the attachment icon to send photos or files. Tap the microphone to record a voice note.'
      },
      {
        q: 'Will I get notifications for new messages?',
        a: 'Yes! You get real push notifications on your phone even when the app is closed — just like WhatsApp. Make sure to enable notifications when prompted.'
      },
      {
        q: 'Can I delete messages?',
        a: 'Yes! Hover over your message and click the trash icon to delete it. You can also bulk delete by long-pressing a message, selecting multiple, then deleting. You can also delete an entire conversation from the chat header.'
      }
    ]
  },
  {
    id: 'sessions',
    emoji: '📅',
    title: 'Session Scheduling',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.1)',
    border: 'rgba(124,111,255,0.3)',
    items: [
      {
        q: 'How do I schedule a session?',
        a: 'Inside a chat → click the "Schedule" button at the top right → pick a date and time → add a meeting link (optional) → confirm. Both people get reminders 15 minutes before and at the start time.'
      },
      {
        q: 'Can I set recurring sessions?',
        a: 'Yes! When scheduling, toggle on "Repeat weekly" and choose how many weeks. This creates multiple sessions automatically — same day and time every week.'
      },
      {
        q: 'How do I add the session to Google Calendar?',
        a: 'In the session card inside the chat, click "Add to Google Calendar". It will open Google Calendar with all the session details pre-filled.'
      },
      {
        q: 'How do credits transfer after a session?',
        a: 'After the session, both people must click "Mark as Completed" and confirm who helped. Once both confirm, the Time Credits transfer automatically to the helper\'s wallet.'
      }
    ]
  },
  {
    id: 'classes',
    emoji: '🎓',
    title: 'Classes and Workshops',
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.1)',
    border: 'rgba(111,255,212,0.3)',
    items: [
      {
        q: 'How do I host a group class?',
        a: 'Go to Classes → click "+ Host a Class" → add title, description, category, date, time, capacity, credits per student, and meeting link → click Host Class. Your class is now live!'
      },
      {
        q: 'How do I join a class?',
        a: 'Go to Classes → browse or filter by category → find a class you like → click "Join Class". Time Credits will be deducted when the host marks the class as complete.'
      },
      {
        q: 'What happens if a class is full?',
        a: 'You can join the waitlist! If a spot opens up when someone leaves, you will be automatically promoted from the waitlist and notified.'
      },
      {
        q: 'How does the host complete a class and settle credits?',
        a: 'After the class ends, the host clicks "Complete" on the class card. Credits from all attendees transfer to the host automatically at that point.'
      }
    ]
  },
  {
    id: 'leaderboard',
    emoji: '🏆',
    title: 'Leaderboard and Badges',
    color: '#ffd166',
    bg: 'rgba(255,209,102,0.1)',
    border: 'rgba(255,209,102,0.3)',
    items: [
      {
        q: 'How does the leaderboard work?',
        a: 'The leaderboard ranks users by how much they help others. You can view rankings for This Week, This Month, or All Time. The more sessions you complete as a helper, the higher you rank.'
      },
      {
        q: 'How do I earn badges?',
        a: 'Badges are earned automatically based on your real activity — number of sessions completed, streaks, and more. You cannot manually request or buy badges.'
      },
      {
        q: 'What are the premium badges?',
        a: 'Top rankers on the leaderboard earn Gold, Silver, and Bronze premium badges displayed on their profile.'
      }
    ]
  },
  {
    id: 'calendar',
    emoji: '🗓️',
    title: 'Calendar',
    color: '#ff6fb0',
    bg: 'rgba(255,111,176,0.1)',
    border: 'rgba(255,111,176,0.3)',
    items: [
      {
        q: 'What does the Calendar show?',
        a: 'The Calendar shows all your upcoming and past sessions and classes in one place. You can filter by Today, Upcoming, or Past.'
      },
      {
        q: 'Can I sync with Google Calendar?',
        a: 'Yes! In each session card, click "Add to Google Calendar" to sync that session. A future update will add full automatic calendar sync.'
      }
    ]
  },
  {
    id: 'wallet',
    emoji: '💰',
    title: 'Time Wallet',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.1)',
    border: 'rgba(124,111,255,0.3)',
    items: [
      {
        q: 'How does the Time Wallet work?',
        a: 'Your Time Wallet shows your current Time Credits balance, every credit you have earned and spent, and your full transaction history.'
      },
      {
        q: 'How do I earn Time Credits?',
        a: 'Help someone in a 1-on-1 session or host a class. After mutual confirmation, credits transfer automatically to your wallet. You also earn 2 credits for each successful referral.'
      },
      {
        q: 'How do I spend Time Credits?',
        a: 'Credits are deducted automatically when you receive help in a session or join a class that gets completed by the host.'
      }
    ]
  },
  {
    id: 'profile',
    emoji: '👤',
    title: 'Profile',
    color: '#6fffd4',
    bg: 'rgba(111,255,212,0.1)',
    border: 'rgba(111,255,212,0.3)',
    items: [
      {
        q: 'How do I edit my profile?',
        a: 'Go to Profile → click Edit Profile → update your name, bio (max 90 words), avatar, and other details → save.'
      },
      {
        q: 'Can I view someone else\'s profile?',
        a: 'Yes! Click on any user\'s name or avatar anywhere in the app to see their public profile — their skills, ratings, reviews, badges, and session count.'
      },
      {
        q: 'How do I find my referral code?',
        a: 'Go to Profile → scroll down to find your unique Referral Code. Share it with friends — when they sign up using your code, both of you earn 2 Time Credits!'
      }
    ]
  },
  {
    id: 'safety',
    emoji: '🛡️',
    title: 'Block and Report',
    color: '#ff5050',
    bg: 'rgba(255,80,80,0.08)',
    border: 'rgba(255,80,80,0.3)',
    items: [
      {
        q: 'How do I block someone?',
        a: 'Go to the person\'s profile → click the 3 dots menu (⋯) → click Block. Blocked users cannot message you, see your skills, or find your conversations. You can manage blocked users from your Profile settings.'
      },
      {
        q: 'How do I report someone?',
        a: 'Go to the person\'s profile → click the 3 dots menu (⋯) → click Report → select a reason and add details → submit. The report goes directly to admin for review.'
      },
      {
        q: 'What happens after I report someone?',
        a: 'Our admin team reviews every report. Accounts that violate our community guidelines may be suspended. Your report is completely confidential.'
      }
    ]
  },
  {
    id: 'pwa',
    emoji: '📱',
    title: 'Install the App',
    color: '#7c6fff',
    bg: 'rgba(124,111,255,0.1)',
    border: 'rgba(124,111,255,0.3)',
    items: [
      {
        q: 'How do I install TimeBank on iPhone or iPad?',
        a: 'Open timebank-app.vercel.app in Safari → tap the Share button (box with arrow) → tap "Add to Home Screen" → tap Add. TimeBank will appear on your home screen just like a native app!'
      },
      {
        q: 'How do I install TimeBank on Android?',
        a: 'Open timebank-app.vercel.app in Chrome → tap the 3 dots menu → tap "Add to Home Screen" → tap Add. Or look for the install icon in the address bar.'
      },
      {
        q: 'How do I install TimeBank on Laptop or Desktop?',
        a: 'Open timebank-app.vercel.app in Chrome → look for the install icon in the address bar (right side) → click it → click Install. TimeBank will open as a standalone app!'
      },
      {
        q: 'Does the installed app work like a real app?',
        a: 'Yes! Once installed, TimeBank opens just like a native app — full screen, no browser bar. You also get real push notifications even when the app is closed.'
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Help and FAQ</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Everything you need to know about TimeBank</p>
          </div>
        </div>

        {/* Contact banner */}
        <div style={{
          background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--text-secondary)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#7c6fff" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span>Still need help? Email us at <strong style={{ color: '#7c6fff' }}>hello.timebankapp@gmail.com</strong></span>
        </div>

        {/* FAQ Sections */}
        {FAQ_SECTIONS.map((section) => (
          <div key={section.id} style={{ marginBottom: '10px' }}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                width: '100%', textAlign: 'left', background: openSection === section.id ? section.bg : 'var(--card)',
                border: `1px solid ${openSection === section.id ? section.border : 'var(--border)'}`,
                borderRadius: openSection === section.id ? '14px 14px 0 0' : '14px',
                padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{section.emoji}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: openSection === section.id ? section.color : 'var(--text)' }}>
                  {section.title}
                </span>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                style={{ transform: openSection === section.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: section.color }}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Section items */}
            {openSection === section.id && (
              <div style={{
                background: 'var(--card)', border: `1px solid ${section.border}`,
                borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden'
              }}>
                {section.items.map((item, idx) => {
                  const key = `${section.id}-${idx}`
                  return (
                    <div key={key} style={{ borderBottom: idx < section.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <button
                        onClick={() => toggleItem(key)}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          padding: '12px 16px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{item.q}</span>
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0,
                          transform: openItem === key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                        >
                          <path d="M6 9l6 6 6-6" stroke={section.color} strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {openItem === key && (
                        <div style={{ padding: '0 16px 14px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', padding: '16px', background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Still have questions?</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Email us at <span style={{ color: '#7c6fff', fontWeight: 600 }}>hello.timebankapp@gmail.com</span>
          </div>
        </div>

      </main>
      <MobileNav />
    </div>
  )
}

export default HelpPage