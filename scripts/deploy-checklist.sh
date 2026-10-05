#!/bin/bash

# Production Deployment Checklist

echo "=== Firebase Project Configuration ==="
echo "1. Create Firebase project at https://console.firebase.google.com"
echo "2. Enable Firestore Database (Start in production mode)"
echo "3. Enable Firebase Authentication"
echo "   - Enable Email/Password provider"
echo "   - Enable Google Sign-In provider"
echo "4. Create service account:"
echo "   - Go to Project Settings > Service Accounts"
echo "   - Click 'Generate New Private Key'"
echo "   - Save the JSON file securely"
echo ""

echo "=== Backend Configuration ==="
echo "Set these environment variables in Render:"
echo "  USE_FIREBASE=true"
echo "  ENABLE_AUTH=true"
echo "  FIREBASE_PROJECT_ID=<your-project-id>"
echo "  GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json"
echo "  NODE_ENV=production"
echo "  PORT=5000"
echo ""

echo "=== Frontend Configuration ==="
echo "Set these environment variables in Vercel:"
echo "  REACT_APP_API_URL=https://your-backend-url.render.com"
echo "  REACT_APP_FIREBASE_PROJECT_ID=<your-project-id>"
echo ""

echo "=== Firestore Security Rules ==="
echo "Update Firestore rules to:"
echo ""
cat << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    match /chat_messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    match /leaderboard/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /game/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
EOF
echo ""

echo "=== Deploy Steps ==="
echo "1. Push code to main branch"
echo "2. GitHub Actions will trigger automatic deployment"
echo "3. Verify /api/health endpoint returns 200"
echo "4. Test auth flow with Firebase token"
echo "5. Monitor Firestore for data writes"
echo ""

echo "=== Verification Checklist ==="
echo "□ Backend health check passes"
echo "□ Frontend loads and connects to backend"
echo "□ Firebase Auth login works"
echo "□ Chat messages save to Firestore"
echo "□ Leaderboard updates persist"
echo "□ User profiles save with auth UID"
echo "□ Mobile app builds with Expo EAS"
echo "□ End-to-end auth flow verified"
echo ""

echo "✅ Deployment checklist complete!"
