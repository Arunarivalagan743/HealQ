# HealQ Offline Appointment System

## Overview
HealQ is now a fully offline appointment management system designed for clinic-based consultations with a comprehensive queue management system.

## Appointment Flow

### 1. Patient Request (Status: `requested`)
- Patient submits appointment request through the app
- System assigns a queue token number
- Doctor receives notification about new request

### 2. Doctor Approval (Status: `approved`)
- Doctor reviews appointment request
- Can approve or reject the appointment
- Patient receives notification of approval/rejection
- Approved appointments are automatically added to the queue

### 3. Queue Management (Status: `in_queue`)
- Approved appointments wait in queue based on time slots
- Real-time queue position updates
- Estimated wait time calculations
- Doctor can move approved appointments to active queue

### 4. Active Consultation (Status: `processing`)
- Doctor starts the consultation
- Patient receives notification when called
- Real-time status updates

### 5. Consultation Complete (Status: `finished`)
- System automatically finishes appointments after time slot ends
- Doctor can manually finish appointments
- Doctor can add prescription and medical records

### 6. Prescription Management
- Doctor adds medications, dosages, duration
- Lab tests recommendations
- Follow-up instructions
- Prescription automatically emailed to patient
- Patient receives notification when prescription is ready

## Key Features

### Offline-Only System
- All consultations are in-person only
- No online/video consultation options
- Physical clinic presence required

### Real-Time Updates
- Live appointment status changes
- Queue position updates
- Notification system for all stakeholders

### Automatic Workflows
- Auto-finish appointments after time slots
- Queue position management
- Reminder notifications
- Prescription email delivery

### Admin Visibility
- Complete oversight of all appointments
- Status tracking across all doctors
- Prescription and medical record access
- Comprehensive reporting

## Status Definitions

| Status | Description | Available Actions |
|--------|-------------|-------------------|
| `requested` | Patient submitted request | Doctor: Approve/Reject |
| `approved` | Doctor approved request | Doctor: Move to Queue |
| `in_queue` | Patient waiting in queue | Doctor: Start Consultation |
| `processing` | Active consultation | Doctor: Finish |
| `finished` | Consultation completed | Doctor: Add Prescription |
| `rejected` | Doctor declined request | - |
| `cancelled` | Appointment cancelled | - |
| `no_show` | Patient didn't show up | - |

## Doctor Workflow

1. **Review Requests**: Check new appointment requests in dashboard
2. **Approve/Reject**: Decide on each request based on availability
3. **Manage Queue**: Move approved appointments to active queue
4. **Conduct Consultation**: Start and finish consultations
5. **Add Prescription**: Add medical records and prescriptions
6. **Email Patient**: System automatically sends prescription via email

## Patient Workflow

1. **Submit Request**: Book appointment through doctor finder
2. **Wait for Approval**: Receive notification when doctor responds
3. **Queue Monitoring**: Track queue position and estimated wait time
4. **Attend Consultation**: Receive notification when called
5. **Receive Prescription**: Get prescription via email after consultation

## Automatic Features

### Appointment Scheduler
- Runs every 15 minutes to finish expired appointments
- Updates queue positions automatically
- Sends appointment reminders
- Calculates estimated wait times

### Email System
- Prescription delivery with formatted medical details
- Appointment confirmations and updates
- Reminder notifications

### Real-Time Notifications
- WebSocket-based live updates
- Status change notifications
- Queue position updates
- Prescription ready alerts

## Technical Implementation

### Backend
- Node.js with Express framework
- MongoDB for data persistence
- Real-time notifications via WebSocket
- Scheduled tasks with node-cron
- Email service with nodemailer
- Firebase for additional services

### Frontend
- React Native mobile application
- Real-time UI updates
- Offline-first design
- Comprehensive appointment management

### Security
- JWT-based authentication
- Role-based access control
- API rate limiting
- Data validation and sanitization

## Installation & Setup

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd HealQMobile
npm install
npx react-native start
npx react-native run-android  # or run-ios
```

### Required Environment Variables
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Email Service
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# Firebase (optional)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## API Endpoints

### Appointment Management
- `POST /api/appointments/book` - Submit appointment request
- `PUT /api/appointments/approve/:id` - Approve appointment
- `PUT /api/appointments/reject/:id` - Reject appointment
- `PUT /api/appointments/queue/:id` - Move to queue
- `PUT /api/appointments/start/:id` - Start consultation
- `PUT /api/appointments/finish/:id` - Finish consultation
- `PUT /api/appointments/prescription/:id` - Add prescription

### Queue Management
- `GET /api/queue/doctor/:doctorId` - Get doctor's queue
- `GET /api/queue/patient/:appointmentId` - Get patient queue position

### Admin Functions
- `GET /api/appointments/admin/all` - Get all appointments
- `POST /api/appointments/auto-finish` - Manually trigger auto-finish

## Database Schema Updates

### Appointment Model
```javascript
{
  status: ['requested', 'approved', 'in_queue', 'processing', 'finished', 'rejected', 'cancelled', 'no_show'],
  consultationType: ['In-person'], // Only offline
  medicalRecord: {
    diagnosis: String,
    prescription: [medicationSchema],
    labTests: [testSchema],
    treatmentDuration: Number,
    prescriptionSentToPatient: Boolean
  }
}
```

### Doctor Profile Model
```javascript
{
  consultationMode: ['In-person'], // Only offline
  slotDuration: Number, // For queue management
  maxAppointmentsPerSlot: Number
}
```

## Future Enhancements

1. **SMS Integration**: Send SMS notifications for critical updates
2. **Payment Integration**: Handle consultation fee payments
3. **Analytics Dashboard**: Comprehensive reporting and analytics
4. **Multi-language Support**: Localization for different regions
5. **Insurance Integration**: Insurance claim management
6. **Telemedicine Module**: Optional online consultation add-on

## Support

For technical support or feature requests, please contact the development team or create an issue in the repository.

---

**Note**: This system is designed specifically for offline clinic operations. All features are optimized for in-person consultations and physical clinic workflows.
