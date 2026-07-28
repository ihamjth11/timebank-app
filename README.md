# ⏰ TimeBank

**Sri Lanka's first time-exchange platform** — trade skills, not money. One hour of help given equals one Time Credit, redeemable for one hour of help from anyone else in the community.

🔗 **Live app:** [timebank-app.vercel.app](https://timebank-app.vercel.app)

---

## 💡 What is TimeBank?

TimeBank is a skill-exchange community where everyone's time is valued equally. A doctor's hour and a student's hour are worth the same: **1 Time Credit**. Help a neighbor fix their bike, get help learning Spanish — credits flow based on time given, not money or status.

## ✨ Features

**Core exchange**
- Skill Feed — post offers/requests, filter by category, search with autocomplete
- 1-on-1 messaging with text, photos, files, and voice notes (record → preview → send)
- Session scheduling with recurring weekly sessions and Google Calendar sync
- Mutual completion confirmation with automatic credit transfer

**Community & growth**
- Classes & Workshops — host group sessions with capacity limits and an automatic waitlist
- Leaderboard — weekly / monthly / all-time top helpers
- Badges & streaks for consistent participation
- Referral system — invite friends, both sides earn credits
- Ratings & reviews on completed sessions

**Trust & safety**
- Report and block other members
- Admin moderation panel with account suspension
- Terms of Service & Privacy Policy

**Notifications**
- In-app notification center
- Browser push notifications (VAPID) for session reminders
- Session reminders 15 minutes before and at start time

**Experience**
- Dark / light theme with smooth transitions
- Installable as a PWA on mobile and desktop
- Multi-language ready (i18next)
- Fully responsive, mobile-first design

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + Google OAuth |
| Hosting | Vercel (frontend), Render (backend) |
| Push | web-push / VAPID |

## 📦 Project Structure

```
timebank-app/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/       # Route-level pages
│       ├── components/  # Shared UI components
│       ├── context/     # Auth & theme context
│       └── styles/      # CSS
└── server/          # Express backend
    ├── models/          # Mongoose schemas
    ├── routes/          # API routes
    └── utils/           # Reminder checker, etc.
```

## 🚀 Getting Started

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

Create a `.env` in `server/` with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## 📄 License

All rights reserved.

---

Built with ❤️ in Sri Lanka.
