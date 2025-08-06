# 🏥 HealQ - Clinic Token Management System

A comprehensive full-stack clinic token management system built with **React Native CLI**, **Node.js/Express**, **Firebase Authentication**, and **MongoDB**. HealQ streamlines patient appointments, manages doctor availability, and maintains secure medical records through role-based access control.

## 🚀 Features

### 🔐 **Secure Authentication**
- Firebase Email/Password authentication
- JWT token-based authorization
- Role-based access control (Patient, Doctor, Admin)
- Pre-authorized email registration system
- OTP-based password recovery with Nodemailer

### 👥 **User Roles**

#### **Patient Features:**
- ✅ Register and login with pre-approved email
- 📅 Book appointments
- 🎫 View token queue status
- 📋 Access medical records
- 👤 Profile management

#### **Doctor Features:**
- ✅ Secure login with specialization details
- 👥 Manage patient queue
- 📋 Access patient medical records
- 📅 View appointment schedule
- 💊 Create and manage prescriptions

#### **Admin Features:**
- ✅ Add new Patient/Doctor emails to system
- 👥 Manage all user accounts
- 📊 View system analytics and statistics
- ⚙️ System configuration
- 🔧 User account management (activate/deactivate)

### 🛡️ **Security Features**
- Only pre-approved emails can register
- Firebase Admin SDK for server-side user management
- Rate limiting on authentication endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization

## 🛠️ Tech Stack

### **Frontend (React Native CLI)**
- React Native 0.80.2
- React Navigation 6
- Firebase Auth SDK
- Axios for HTTP requests
- AsyncStorage for local data
- React Native Paper for UI components

### **Backend (Node.js)**
- Express.js 4.18+
- Firebase Admin SDK
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for emails
- Express Rate Limit
- Helmet.js for security
- Express Validator

### **Database**
- MongoDB Atlas
- User management
- Role-based data structure
- OTP storage with expiration

### **Services**
- Firebase Authentication
- Gmail SMTP for email delivery
- MongoDB Atlas cloud database

## 📁 Project Structure

```
HealQ/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── firebase.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── admin.js
│   ├── services/
│   │   └── emailService.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── HealQMobile/
    ├── src/
    │   ├── config/
    │   │   └── firebase.js
    │   ├── services/
    │   │   ├── api.js
    │   │   └── authService.js
    │   └── screens/
    │       ├── LoginScreen.js
    │       ├── RegisterScreen.js
    │       ├── ForgotPasswordScreen.js
    │       ├── PatientDashboard.js
    │       ├── DoctorDashboard.js
    │       └── AdminDashboard.js
    ├── android/
    ├── ios/
    ├── App.tsx
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio / Xcode
- MongoDB Atlas account
- Firebase project
- Gmail account for SMTP

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd HealQ
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGODB_URI=your-mongodb-atlas-connection-string

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail-address
EMAIL_PASS=your-gmail-app-password

# Admin Configuration
ADMIN_EMAILS=admin@yourcompany.com

# Client URL
CLIENT_URL=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

### 3. Mobile App Setup

```bash
cd HealQMobile
npm install
```

Update Firebase configuration in `src/config/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Run the Mobile App

For Android:
```bash
npx react-native run-android
```

For iOS:
```bash
npx react-native run-ios
```

## 📱 App Flow

### **Registration Flow**
1. Admin adds Patient/Doctor email to system
2. User receives invitation (optional email notification)
3. User registers with pre-approved email
4. Firebase creates authentication account
5. Backend validates and stores user role
6. User gets role-specific dashboard

### **Login Flow**
1. User enters email/password
2. Firebase authenticates user
3. Backend validates role and returns JWT
4. User redirected to role-specific dashboard

### **Password Recovery Flow**
1. User requests password reset
2. Backend generates 6-digit OTP
3. OTP sent via email (5-minute expiry)
4. User verifies OTP
5. User sets new password via Firebase

## 🔧 API Endpoints

### **Authentication Routes**
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - User login
POST /api/auth/forgot-password - Request password reset
POST /api/auth/verify-otp   - Verify OTP
POST /api/auth/reset-password - Reset password
GET  /api/auth/profile      - Get user profile
PUT  /api/auth/profile      - Update user profile
```

### **Admin Routes**
```
POST /api/admin/users       - Add new user (Admin only)
GET  /api/admin/users       - Get all users (Admin only)
GET  /api/admin/users/:id   - Get user by ID (Admin only)
PUT  /api/admin/users/:id   - Update user (Admin only)
DELETE /api/admin/users/:id - Delete user (Admin only)
GET  /api/admin/dashboard/stats - Get dashboard statistics
```

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# Register (requires pre-approved email)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "Password123",
    "name": "John Doe",
    "role": "Patient",
    "idToken": "firebase-id-token"
  }'
```

## 🔒 Security Considerations

1. **Email Pre-approval**: Only admin-added emails can register
2. **Rate Limiting**: API endpoints have rate limiting
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS Protection**: Configured for specific origins
5. **JWT Expiration**: Tokens expire in 24 hours
6. **OTP Expiration**: OTPs expire in 5 minutes
7. **Firebase Security**: Server-side user management

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Vercel)
1. Set environment variables
2. Deploy from `backend/` directory
3. Update CORS settings for production

### Mobile App Deployment
1. Build release APK/IPA
2. Update API URLs to production
3. Submit to Play Store/App Store

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💡 Upcoming Features

- [ ] Real-time token queue updates
- [ ] Video consultation integration
- [ ] Medical record file uploads
- [ ] Appointment scheduling calendar
- [ ] Push notifications
- [ ] Prescription management
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme

## 📞 Support

For support, email support@healq.com or create an issue in this repository.

---

**Built with ❤️ for better healthcare management**
# HealQ
