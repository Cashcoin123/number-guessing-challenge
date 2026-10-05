# Number Guessing Challenge

A global multiplayer number guessing game with live chat, scoring, daily bonuses, and social sharing. Available on web, iPhone, and Android.

## Features

- Guess a random number between 1 and 100
- 10 attempts per round
- Score and streak tracking
- Daily +50 point bonus
- Real-time global chat
- Global leaderboard
- Local JSON persistence for development
- Production-ready architecture for Firebase/Postgres migration

## Local development

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Production roadmap

- Replace JSON persistence with Firebase or Postgres
- Add Firebase Auth or JWT auth
- Deploy backend to Render/Railway
- Deploy frontend to Vercel
- Build mobile apps with Expo EAS
- Add push notifications and analytics

## Docs

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Docs](docs/API.md)
- [Production Upgrade Plan](docs/PRODUCTION.md)

## License

MIT
