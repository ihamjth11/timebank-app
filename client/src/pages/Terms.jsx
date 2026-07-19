import { Link } from 'react-router-dom'
import '../styles/legal.css'

function Terms() {
  return (
    <div className="legal">
      <div className="legal__container">
        <Link to="/" className="legal__back">← Back to TimeBank</Link>
        <h1 className="legal__title">Terms of Service</h1>
        <p className="legal__updated">Last updated: July 2026</p>

        <section className="legal__section">
          <h2>1. About TimeBank</h2>
          <p>TimeBank is a skill-exchange platform where members trade time and skills using Time Credits instead of money. One hour of help given equals one Time Credit earned, which can be redeemed for one hour of help from another member.</p>
        </section>

        <section className="legal__section">
          <h2>2. Eligibility</h2>
          <p>You must be at least 18 years old to create a TimeBank account. By registering, you confirm that the information you provide is accurate and that you will keep it up to date.</p>
        </section>

        <section className="legal__section">
          <h2>3. Time Credits</h2>
          <p>Time Credits have no cash value and cannot be bought, sold, or exchanged for money. Credits are earned by helping other members and spent when receiving help. TimeBank is not a party to any agreement between members and does not guarantee the quality, safety, or legality of services exchanged.</p>
        </section>

        <section className="legal__section">
          <h2>4. Member Conduct</h2>
          <p>Members agree to treat each other with respect, communicate honestly about their skills and availability, and honor scheduled sessions. TimeBank reserves the right to suspend or remove accounts that engage in harassment, fraud, spam, or any illegal activity.</p>
        </section>

        <section className="legal__section">
          <h2>5. Safety</h2>
          <p>TimeBank does not conduct background checks on members. You are responsible for exercising your own judgment when meeting other members, whether online or in person. Consider meeting in public places for in-person exchanges and use the in-app messaging and video call links for remote sessions.</p>
        </section>

        <section className="legal__section">
          <h2>6. Content You Share</h2>
          <p>You retain ownership of any content (skill listings, messages, photos, files) you share on TimeBank. By posting content, you grant TimeBank a license to display it within the platform to facilitate skill exchanges.</p>
        </section>

        <section className="legal__section">
          <h2>7. Limitation of Liability</h2>
          <p>TimeBank is provided "as is" without warranties of any kind. TimeBank is not liable for disputes, damages, or losses arising from interactions or exchanges between members.</p>
        </section>

        <section className="legal__section">
          <h2>8. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Continued use of TimeBank after changes are posted means you accept the updated Terms.</p>
        </section>

        <section className="legal__section">
          <h2>9. Contact</h2>
          <p>Questions about these Terms? Reach out to us through the app's support channel.</p>
        </section>
      </div>
    </div>
  )
}

export default Terms