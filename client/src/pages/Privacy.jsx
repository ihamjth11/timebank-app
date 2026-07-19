import { Link } from 'react-router-dom'
import '../styles/legal.css'

function Privacy() {
  return (
    <div className="legal">
      <div className="legal__container">
        <Link to="/" className="legal__back">← Back to TimeBank</Link>
        <h1 className="legal__title">Privacy Policy</h1>
        <p className="legal__updated">Last updated: July 2026</p>

        <section className="legal__section">
          <h2>1. Information We Collect</h2>
          <p>When you use TimeBank, we collect information you provide directly, such as your name, email address, profile photo, bio, location, skills, and messages. We also collect information automatically, such as device type, browser, and usage activity, to keep the platform running smoothly.</p>
        </section>

        <section className="legal__section">
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to operate TimeBank — creating and managing your account, matching you with skill-exchange opportunities, enabling messaging and scheduling, sending session reminders and notifications, and improving the platform.</p>
        </section>

        <section className="legal__section">
          <h2>3. What We Share</h2>
          <p>Your name, profile photo, bio, skills, location, and ratings are visible to other TimeBank members to facilitate skill exchanges. We do not sell your personal information to third parties.</p>
        </section>

        <section className="legal__section">
          <h2>4. Messages and Media</h2>
          <p>Messages, voice notes, photos, and files you send within TimeBank are stored to enable the messaging feature and are visible only to the participants of that conversation.</p>
        </section>

        <section className="legal__section">
          <h2>5. Google Sign-In</h2>
          <p>If you sign in with Google, we receive your name, email address, and profile photo from Google to create and authenticate your account. We do not access your Google contacts, calendar, or other Google data beyond this.</p>
        </section>

        <section className="legal__section">
          <h2>6. Notifications</h2>
          <p>With your permission, we send browser push notifications and in-app alerts for session reminders, new messages, and other account activity. You can disable these at any time through your device or browser settings.</p>
        </section>

        <section className="legal__section">
          <h2>7. Data Security</h2>
          <p>We use industry-standard measures, including encrypted passwords and secure connections, to protect your information. No system is completely secure, so we encourage you to use a strong, unique password.</p>
        </section>

        <section className="legal__section">
          <h2>8. Your Choices</h2>
          <p>You can update your profile information at any time from your account settings. You may request deletion of your account and associated data by contacting us through the app's support channel.</p>
        </section>

        <section className="legal__section">
          <h2>9. Children's Privacy</h2>
          <p>TimeBank is not intended for anyone under 18. We do not knowingly collect information from minors.</p>
        </section>

        <section className="legal__section">
          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify members of significant changes through the app.</p>
        </section>

        <section className="legal__section">
          <h2>11. Contact</h2>
          <p>Questions about this Privacy Policy? Reach out to us through the app's support channel.</p>
        </section>
      </div>
    </div>
  )
}

export default Privacy