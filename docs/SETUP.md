# Quick Setup Guide

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Expected output:**
```
✅ Server running on http://localhost:5000
📊 Health check: http://localhost:5000/api/health
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
  VITE v5.4.10  ready in 123 ms
  ➜  Local:   http://localhost:5173/
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Test the Game

1. Open http://localhost:5173
2. Enter a username
3. Guess a number between 1-100
4. Send a chat message
5. View the leaderboard

## Troubleshooting

**Backend won't start:**
- Check if port 5000 is free: `lsof -i :5000`
- Kill process: `kill -9 <PID>`

**Frontend won't connect to backend:**
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check vite proxy in `vite.config.js`

**Chat not working:**
- Ensure Socket.IO is installed: `npm install socket.io`
- Check browser console for errors

## File Structure

```
backend/
├── data/
│   ├── game_data.json
│   ├── chat_messages.json
│   ├── users.json
│   └── leaderboard.json
├── src/
│   └── server.js
└── package.json

frontend/
├── src/
│   ├── App.jsx
│   └── main.jsx
└── package.json

mobile/
├── App.js
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/game/stats` | Get game statistics |
| POST | `/api/game/start` | Start new game round |
| POST | `/api/game/guess` | Submit a guess |
| POST | `/api/game/bonus` | Claim daily bonus |
| GET | `/api/chat/messages` | Get chat history |
| POST | `/api/chat/send` | Send chat message |
| POST | `/api/users/register` | Register player |
| GET | `/api/users/:id` | Get player profile |
| GET | `/api/leaderboard` | Get global leaderboard |

## Next Steps

- [ ] Read DEPLOYMENT.md for production setup
- [ ] Replace JSON storage with Firebase/Postgres
- [ ] Add user authentication
- [ ] Deploy to production
