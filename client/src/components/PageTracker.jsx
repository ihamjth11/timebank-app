import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../utils/analytics'

// Google Analytics only tracks the very first page load automatically —
// since this is a single-page app, every route change afterwards needs
// to be tracked manually. Render this once, anywhere inside <BrowserRouter>.
function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return null
}

export default PageTracker