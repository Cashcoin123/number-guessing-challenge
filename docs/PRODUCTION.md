PORT=5000
JWT_SECRET=your-secret-key-change-me
CLIENT_URL=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info

# Production database choices
# Postgres
DATABASE_URL=postgres://user:password@localhost:5432/number_guessing

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Optional feature toggles
USE_FIREBASE=false
USE_POSTGRES=false
