# Deployment Guide

## Production Checklist

✅ Backend runs on Node.js  
✅ Web frontend runs on React + Vite  
✅ Local JSON persistence for development  
✅ Chat and leaderboard ready  
✅ Health check endpoint  
✅ CORS enabled  
✅ Socket.IO for real-time features  

## Production Pipeline

### 1) Backend Deployment (Render / Railway / Heroku)

```bash
# Push to production
git push origin main

# Set environment variables
PORT=5000
CLIENT_URL=https://yourdomain.com
NODE_ENV=production

# Service will auto-deploy and start
```

### 2) Web Frontend Deployment (Vercel / Netlify)

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

### 3) Mobile Deployment (Expo EAS)

```bash
cd mobile

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Database Migration (Firebase / Postgres)

Replace local JSON files with:

**Firebase Firestore:**
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

// Read
const doc = await db.collection('users').doc(username).get();

// Write
await db.collection('users').doc(username).set(userData);
```

**PostgreSQL:**
```bash
# Install
npm install pg

# Connect
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

## Next Steps

1. Replace JSON storage with Firebase or Postgres
2. Add authentication (JWT or Firebase Auth)
3. Deploy backend to production
4. Deploy web app to production
5. Build and submit mobile apps
6. Monitor performance and add analytics
