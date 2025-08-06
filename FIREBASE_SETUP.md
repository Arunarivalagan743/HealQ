# 🔥 Firebase Setup Instructions for HealQ

## Quick Setup Steps:

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name: `HealQ-New` (or any name)
4. Enable Google Analytics (optional)

### 2. Enable Authentication
1. In Firebase Console → Authentication
2. Click "Get started"
3. Go to Sign-in method tab
4. Enable "Email/Password"

### 3. Get Android Configuration
1. Click "Add app" → Android
2. Package name: `com.healqmobileapp`
3. Download `google-services.json`
4. Replace the file in: `android/app/google-services.json`

### 4. Get Web Configuration
1. Click "Add app" → Web
2. Copy the config object
3. Replace values in: `src/config/firebase.js`

### 5. Update Backend
Update your backend `.env` file with the new Firebase project details:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

## Alternative: Use Firebase Emulator for Development

If you want to test without setting up Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start --only auth
```

Then update your React Native app to use the emulator.
