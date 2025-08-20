# 🚀 HealQ Setup Guide - New Appointment Workflow

## Quick Start Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd HealQMobile
npm install
npx react-native run-android
# or
npx react-native run-ios
```

### 3. Test the Implementation
```bash
cd backend
node testAppointmentWorkflow.js
```

## 🔧 Key Configuration

### Environment Variables
Make sure your `backend/.env` includes:
```
MONGODB_URI=mongodb://localhost:27017/healq
PORT=5000
JWT_SECRET=your_jwt_secret
```

### Database Requirements
- MongoDB running on localhost:27017
- Database name: `healq`
- Collections: `appointments`, `doctorprofiles`, `patientprofiles`, `users`

## 📱 Testing the Workflow

### Patient Flow
1. Register/Login as Patient
2. Book appointment → Status: "Pending Approval"
3. Wait for doctor approval
4. Check status updates in real-time

### Doctor Flow
1. Login as Doctor
2. View appointment requests (sorted by priority)
3. Approve/Reject pending appointments
4. Mark appointments as complete

### API Testing
Use the following endpoints to test:

```bash
# Book appointment
POST http://localhost:5000/api/appointments/book
{
  "doctorId": "doctor_id",
  "appointmentDate": "2025-08-10",
  "timeSlot": { "start": "10:00", "end": "11:00" },
  "reasonForVisit": "General checkup"
}

# Approve appointment (Doctor)
PUT http://localhost:5000/api/appointments/approve/appointment_id

# Complete appointment (Doctor)
PUT http://localhost:5000/api/appointments/complete/appointment_id
```

## 🎯 What to Expect

### Patient Experience
- Immediate confirmation with queue position
- Token numbers for same-day appointments
- Real-time status updates
- Clear action buttons based on status

### Doctor Experience
- Prioritized appointment list
- Same-day tokens displayed prominently
- Simple approve/reject workflow
- One-click completion marking

## 🔍 Verification Checklist

- [ ] Appointments created with "queued" status
- [ ] Token numbers assigned for same-day bookings
- [ ] Doctor dashboard shows proper sorting
- [ ] Approve/reject buttons work correctly
- [ ] Complete appointment functionality working
- [ ] Real-time notifications functioning
- [ ] Slot blocking prevents double-booking
- [ ] UI shows token numbers for today's appointments

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check if MongoDB is running
brew services start mongodb-community
# or
sudo systemctl start mongod
```

**2. Token Assignment Not Working**
- Ensure appointment date is today
- Check timezone settings
- Verify tokenNumber field in database

**3. Sorting Not Correct**
- Check appointment statuses in database
- Verify sorting logic in getDoctorAppointments()
- Clear app cache and restart

**4. Notifications Not Working**
- Check notification service connection
- Verify user IDs in notification calls
- Check browser/app permissions

### Debug Mode
Enable debug logging by setting:
```javascript
console.log('Debug mode enabled');
```

## 📞 Support

For issues or questions:
1. Check the implementation documentation
2. Run the test script to verify setup
3. Check console logs for specific errors
4. Verify database schema matches new requirements

---

**Ready to Go!** 🎉 Your appointment workflow system is now fully implemented and ready for production use.
