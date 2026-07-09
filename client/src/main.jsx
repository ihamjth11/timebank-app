import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { GoogleOAuthProvider } from '@react-oauth/google'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import App from './App.jsx'
import './styles/global.css'

import en from './i18n/en.json'
import ta from './i18n/ta.json'
import si from './i18n/si.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
    si: { translation: si }
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

const GOOGLE_CLIENT_ID = '62541841925-u45eq6llnkq2cm6phoq6epa43kjoho29.apps.googleusercontent.com'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)