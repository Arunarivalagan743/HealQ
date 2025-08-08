# 📱 HealQ Mobile - Real Device Network Setup Guide

## 🌐 Network Configuration Issues

### The Problem
- You're getting network errors on real mobile devices
- The app works in emulator but fails on physical devices
- This is because the app is configured for localhost/emulator IPs

## 🔧 Solutions for Real Device Testing

### Option 1: Use Your Computer's IP Address (Recommended for Testing)

1. **Find Your Computer's IP Address:**
   ```bash
   # Windows
   ipconfig
   
   # Look for "IPv4 Address" under your active network adapter
   # Example: 192.168.1.100
   ```

2. **Update the Mobile App Configuration:**
   Edit `HealQMobile/src/services/api.js`:
   ```javascript
   const getBaseURL = () => {
     if (__DEV__) {
       if (Platform.OS === 'android') {
         // Replace with your actual computer IP
         return 'http://192.168.1.100:5000/api'; // ⚠️ CHANGE THIS IP
       } else {
         return 'http://localhost:5000/api';
       }
     } else {
       return 'https://your-production-server.com/api';
     }
   };
   ```

3. **Ensure Both Devices Are on Same Network:**
   - Your computer and mobile device must be on the same WiFi network
   - Disable any firewalls that might block port 5000

4. **Start Your Backend Server:**
   ```bash
   cd backend
   npm start
   # Server should be accessible at http://YOUR_IP:5000
   ```

### Option 2: Use ngrok (Easiest for Testing)

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/
   # Or install via npm
   npm install -g ngrok
   ```

2. **Start Your Backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Expose Your Local Server:**
   ```bash
   ngrok http 5000
   ```

4. **Update Mobile App:**
   ```javascript
   const getBaseURL = () => {
     if (__DEV__) {
       // Use ngrok URL for real device testing
       return 'https://abcd1234.ngrok.io/api'; // ⚠️ REPLACE WITH YOUR NGROK URL
     } else {
       return 'https://your-production-server.com/api';
     }
   };
   ```

### Option 3: Deploy to Production Server

1. **Deploy Backend to Cloud Provider:**
   - Heroku, AWS, DigitalOcean, etc.
   - Update environment variables
   - Configure production database

2. **Update Mobile App:**
   ```javascript
   const getBaseURL = () => {
     return 'https://your-actual-production-url.com/api';
   };
   ```

## 🚨 Security Issues Fixed

### 1. Removed Development Routes
- Removed `-dev` endpoints that bypass authentication
- All routes now require proper authentication

### 2. Removed Temporary Password System Issues
The temporary password system is working as designed:
- Admin approves user → generates temporary password
- User receives email with temporary password
- User must change password on first login

### 3. Added Proper Authentication
- All admin routes now require valid JWT tokens
- Proper error handling for authentication failures

## 🛠️ Steps to Fix Your App

### 1. Update API Configuration
```bash
# Find your computer's IP
ipconfig

# Update the IP in src/services/api.js
# Replace 10.0.2.2 with your actual IP for real device testing
```

### 2. Test Network Connectivity
```bash
# From your mobile device browser, try:
http://YOUR_COMPUTER_IP:5000/health

# Should return: {"status":"OK","message":"Server is running"}
```

### 3. Rebuild and Test
```bash
cd HealQMobile
npx react-native run-android
# or
npx react-native run-ios
```

## 📝 Environment Variables Needed

Create `.env` in backend folder:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://your-frontend-url.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Admin Configuration
ADMIN_EMAILS=admin@yourcompany.com
```

## 🔍 Debugging Tips

1. **Check Server Logs:**
   ```bash
   cd backend
   npm start
   # Look for any error messages
   ```

2. **Check Mobile App Logs:**
   ```bash
   npx react-native log-android
   # or
   npx react-native log-ios
   ```

3. **Test API Endpoints:**
   ```bash
   # Test health endpoint
   curl http://YOUR_IP:5000/health
   
   # Test login
   curl -X POST http://YOUR_IP:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

## ⚠️ Important Notes

1. **For Real Device Testing:** Use your computer's actual IP address
2. **For Production:** Deploy to a cloud server with HTTPS
3. **Security:** Never use development routes in production
4. **Firewall:** Ensure port 5000 is not blocked by firewall
5. **Network:** Both devices must be on the same WiFi network for local testing
