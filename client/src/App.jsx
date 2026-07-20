import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SkillFeed from './pages/SkillFeed'
import Wallet from './pages/Wallet'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Leaderboard from './pages/Leaderboard'
import Workshops from './pages/Workshops'
import Calendar from './pages/Calendar'
import AdminModeration from './pages/AdminModeration'
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/skills" element={<SkillFeed />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/workshops" element={<Workshops />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/admin/moderation" element={<AdminModeration />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App