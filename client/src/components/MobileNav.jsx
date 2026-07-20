import { useLocation, useNavigate } from 'react-router-dom'

const ITEMS = [
  {
    path: '/dashboard', label: 'Home',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/></svg>)
  },
  {
    path: '/wallet', label: 'Wallet',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>)
  },
  {
    path: '/skills', label: 'Skills',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>)
  },
  {
    path: '/workshops', label: 'Classes',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>)
  },
  {
    path: '/leaderboard', label: 'Ranks',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M7 5H4a2 2 0 002 4M17 5h3a2 2 0 01-2 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>)
  },
  {
    path: '/messages', label: 'Chats',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>)
  },
  {
    path: '/profile', label: 'Profile',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>)
  },
]

function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="mobile-nav">
      {ITEMS.map(item => (
        <div
          key={item.path}
          className={`mobile-nav__item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          style={{ cursor: 'pointer' }}
        >
          <div className="mobile-nav__icon">{item.icon}</div>
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  )
}

export default MobileNav