import { useState, useEffect } from 'react'

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)

  useEffect(() => {
    // Detect if the app is already running as an installed PWA — if so,
    // never show the install banner.
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    if (localStorage.getItem('tb_install_dismissed')) return

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS Safari never fires beforeinstallprompt — show manual
    // "Add to Home Screen" instructions instead after a short delay.
    let iosTimer
    if (iOS) {
      iosTimer = setTimeout(() => setShowBanner(true), 1500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
    if (outcome === 'accepted') {
      localStorage.setItem('tb_install_dismissed', 'true')
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('tb_install_dismissed', 'true')
  }

  if (isStandalone || !showBanner) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', borderRadius: '16px', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', color: '#fff',
      boxShadow: '0 6px 20px rgba(124,111,255,0.3)'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Install TimeBank</div>
        <div style={{ fontSize: '11.5px', opacity: 0.9 }}>
          {isIOS ? 'Tap Share, then "Add to Home Screen"' : 'Add to your home screen for quick, app-like access'}
        </div>
      </div>
      {!isIOS && (
        <button onClick={handleInstall} style={{
          background: '#fff', color: '#7c6fff', border: 'none', borderRadius: '10px',
          padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
        }}>Install</button>
      )}
      <button onClick={handleDismiss} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
    </div>
  )
}

export default InstallPrompt