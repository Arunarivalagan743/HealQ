# 🏥 HealQ - Mobile Clinic Management System

HealQ is a comprehensive mobile-based clinic token management system built with React Native, designed to streamline patient appointments, manage doctor availability, and maintain secure medical records through role-based access control.

## 📱 Application Overview

HealQ is a full-featured healthcare management platform that connects patients with doctors, streamlines appointment booking, and facilitates secure medical record management. The application is built using React Native CLI for the mobile interface and is supported by a robust Node.js/Express backend with MongoDB database.

## 🚀 Key Features

### 🔐 Authentication & Security
- Firebase Authentication integration
- JWT token-based authorization
- Role-based access control (Patient, Doctor, Admin)
- Pre-authorized email registration system
- OTP-based password recovery

### 👤 Patient Features
- Seamless registration and login
- Intuitive appointment booking
- Real-time token queue status
- Access to medical records and prescriptions
- Comprehensive profile management
- Doctor search and selection

### 👨‍⚕️ Doctor Features
- Specialized doctor profiles
- Patient queue management
- Access to patient medical histories
- Appointment scheduling and management
- Prescription creation and tracking
- Availability management

### 👑 Admin Features
- User management (approve/reject registrations)
- System analytics and monitoring
- Doctor specialization management
- Comprehensive reporting tools

### 📊 Queue Management
- Real-time queue position updates
- Estimated wait time calculations
- Priority-based scheduling
- Offline appointment capability

## 🛠️ Technology Stack

### Mobile Application (React Native)
- **Framework**: React Native 0.80.2
- **Navigation**: React Navigation 7.x
- **State Management**: Context API
- **Authentication**: Firebase Auth
- **UI Components**: React Native Paper
- **Data Fetching**: Axios
- **Local Storage**: AsyncStorage
- **Date Handling**: date-fns

### Backend Server (Node.js)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Authentication**: Firebase Admin SDK, JWT
- **Database**: MongoDB with Mongoose
- **Email Service**: Nodemailer
- **Security**: Helmet.js, Express Rate Limit, CORS protection
- **Validation**: Express Validator
- **Scheduling**: node-cron

## 📦 Project Structure

```
HealQ/
├── HealQMobile/ (React Native App)
│   ├── android/ (Android specific files)
│   ├── ios/ (iOS specific files)
│   ├── src/
│   │   ├── components/ (Reusable UI components)
│   │   ├── config/ (App configuration)
│   │   ├── screens/ (App screens/pages)
│   │   ├── services/ (API and business logic)
│   │   └── utils/ (Helper functions)
│   ├── App.tsx (Main application component)
│   └── index.js (Entry point)
│
├── backend/ (Node.js Server)
    ├── config/ (Server configuration)
    ├── controllers/ (Request handlers)
    ├── middleware/ (Express middleware)
    ├── models/ (Database models)
    ├── routes/ (API routes)
    ├── services/ (Business logic)
    └── server.js (Server entry point)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or newer
- React Native CLI
- MongoDB
- Firebase project

### Installation

#### Mobile App Setup
1. Navigate to the HealQMobile directory:
   ```
   cd HealQMobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. For iOS, install Pods:
   ```
   cd ios && pod install && cd ..
   ```

4. Start the Metro server:
   ```
   npm start
   ```

5. Run on Android:
   ```
   npm run android
   ```

6. Run on iOS:
   ```
   npm run ios
   ```

#### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   FIREBASE_SERVICE_ACCOUNT=path_to_firebase_credentials
   ```

4. Initialize the database:
   ```
   npm run init-db
   ```

5. Start the server:
   ```
   npm run dev
   ```

## 📋 Usage Workflows

### Patient Journey
1. Registration with pre-approved email
2. Profile completion
3. Doctor search and selection
4. Appointment booking
5. Queue position tracking
6. Appointment attendance
7. Prescription and record viewing

### Doctor Journey
1. Secure login
2. Profile management
3. Appointment schedule viewing
4. Patient queue management
5. Patient record access
6. Prescription creation

### Admin Journey
1. User approval
2. System monitoring
3. Doctor profile verification
4. Queue management oversight

## 🔒 Security Features
- Pre-approved email registration only
- Firebase Admin SDK for server-side validation
- Rate limiting to prevent brute-force attacks
- Input validation and sanitization
- CORS protection and security headers

## 🌐 Offline Functionality
- Local data caching
- Appointment scheduling during network outages
- Sync upon reconnection

## 📚 Additional Resources

For more information about specific features, please refer to the documentation files:
- User Approval Workflow: [USER_APPROVAL_FLOW_FIXED.md](./USER_APPROVAL_FLOW_FIXED.md)
- Appointment Workflow: [APPOINTMENT_WORKFLOW_IMPLEMENTATION.md](./APPOINTMENT_WORKFLOW_IMPLEMENTATION.md)
- Offline Appointment System: [OFFLINE_APPOINTMENT_SYSTEM.md](./OFFLINE_APPOINTMENT_SYSTEM.md)
- Time Slot Improvements: [TIME_SLOT_IMPROVEMENTS.md](./TIME_SLOT_IMPROVEMENTS.md)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Arunarivalagan743 - Developer and Project Owner

---

Built with ❤️ for better healthcare management.
