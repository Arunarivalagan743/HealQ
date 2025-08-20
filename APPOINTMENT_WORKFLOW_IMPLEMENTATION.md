# 🏥 HealQ - Complete Doctor-Patient Appointment Workflow Implementation

## 📋 Overview
This implementation provides a comprehensive appointment booking system with token queue management, status control, and real-time updates for both doctors and patients.

## 🔄 Appointment Status Flow

### New Status Enum
```javascript
status: {
  type: String,
  enum: ['queued', 'approved', 'rejected', 'cancelled', 'completed'],
  default: 'queued'
}
```

### Workflow Steps
1. **Patient Books** → Status: `queued` (waiting for doctor approval)
2. **Doctor Reviews** → Approve (`approved`) or Reject (`rejected`)
3. **Doctor Completes** → Status: `completed`
4. **Alternative** → Patient/Doctor can Cancel (`cancelled`)

## 🎫 Token Management System

### Token Assignment Logic
- **Same-day appointments** get a `tokenNumber` based on existing tokens for that doctor on that date
- **Future appointments** have `tokenNumber: null`
- Token numbers help manage same-day queue efficiently

```javascript
// Token assignment example
const today = new Date().setHours(0, 0, 0, 0);
const appointmentDateOnly = new Date(appointmentDate).setHours(0, 0, 0, 0);
const isToday = appointmentDateOnly === today;

if (isToday) {
  const lastTokenAppointment = await Appointment.find({
    doctorId: doctorProfile._id,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    tokenNumber: { $ne: null }
  }).sort({ tokenNumber: -1 }).limit(1);
  
  tokenNumber = lastTokenAppointment.length > 0 ? lastTokenAppointment[0].tokenNumber + 1 : 1;
}
```

## 🎯 Sorting Logic for Doctor Dashboard

### Priority Order
1. **`queued`** → Top priority, sorted by `tokenNumber` (same day first)
2. **`approved`** → Next, sorted by `timeSlot`
3. **`completed`** → Third priority
4. **`cancelled`** → Fourth priority
5. **`rejected`** → Lowest priority

```javascript
const sortedAppointments = appointments.sort((a, b) => {
  const order = { queued: 1, approved: 2, completed: 3, cancelled: 4, rejected: 5 };
  
  if (a.status === b.status) {
    if (a.status === 'queued' && a.tokenNumber && b.tokenNumber) {
      return a.tokenNumber - b.tokenNumber; // Same day appointments first
    }
    if (a.status === 'approved') {
      const aTime = new Date(`1970-01-01T${a.timeSlot.start}:00`);
      const bTime = new Date(`1970-01-01T${b.timeSlot.start}:00`);
      return aTime - bTime; // Sort by appointment time
    }
    return new Date(a.appointmentDate) - new Date(b.appointmentDate);
  }
  
  return order[a.status] - order[b.status];
});
```

## 🔒 Slot Blocking Mechanism

### How It Works
- **Only `approved` appointments** block time slots
- **`queued` appointments** can have overlapping time slots (multiple requests for same slot)
- **When doctor approves**, system checks for conflicts and blocks the slot

```javascript
// Conflict checking during approval
const conflicts = await Appointment.find({
  doctorId: appointment.doctorId,
  appointmentDate: appointment.appointmentDate,
  'timeSlot.start': appointment.timeSlot.start,
  status: 'approved',
  _id: { $ne: appointment._id }
});

if (conflicts.length > 0) {
  return { error: 'Time slot is no longer available' };
}
```

## 🚀 Backend API Endpoints

### Core Appointment APIs
- `POST /appointments/book` - Book new appointment (status: queued)
- `PUT /appointments/approve/:id` - Doctor approves appointment
- `PUT /appointments/reject/:id` - Doctor rejects appointment
- `PUT /appointments/complete/:id` - Doctor marks as completed
- `GET /appointments/patient` - Get patient's appointments
- `GET /appointments/doctor` - Get doctor's appointments (with sorting)

### API Response Example
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "677...",
      "appointmentId": "APT20250810...",
      "patientName": "John Doe",
      "doctorName": "Dr. Smith",
      "appointmentDate": "2025-08-10T00:00:00.000Z",
      "timeSlot": { "start": "10:00", "end": "11:00" },
      "tokenNumber": 3,
      "isToday": true,
      "status": "queued",
      "consultationType": "In-person",
      "consultationFee": 500
    }
  }
}
```

## 📱 Frontend Updates

### Patient Side Features
- **Status Display**: Shows current status with color coding
- **Token Numbers**: For same-day appointments, displays "Token #3 (Today)"
- **Real-time Updates**: Automatically refreshes when status changes
- **Action Buttons**: Cancel request (for queued appointments)

### Doctor Side Features
- **Priority Sorting**: Appointments sorted by workflow priority
- **Action Buttons**: 
  - Approve/Reject for `queued` appointments
  - Mark Complete for `approved` appointments
  - Add Prescription for `completed` appointments
- **Token Display**: Shows token numbers for easy queue management

### Status Color Coding
```javascript
const statusColors = {
  'queued': '#FFA500',    // Orange - Pending approval
  'approved': '#4CAF50',  // Green - Confirmed
  'completed': '#4CAF50', // Green - Finished
  'rejected': '#F44336',  // Red - Rejected
  'cancelled': '#FF5722'  // Red-orange - Cancelled
};
```

## 🔔 Real-time Notifications

### Notification Types
1. **Appointment Booked** → Notifies doctor of new request
2. **Appointment Approved** → Notifies patient of approval
3. **Appointment Rejected** → Notifies patient of rejection
4. **Appointment Completed** → Notifies patient of completion

### Implementation
```javascript
// Example: Completion notification
notificationService.sendAppointmentCompletedNotification(patientUserId, {
  appointmentId: appointment.appointmentId,
  doctorName: appointment.doctorName,
  appointmentDate: appointment.appointmentDate,
  timeSlot: appointment.timeSlot
});
```

## 📊 Patient Experience Flow

### Booking Process
1. **Patient books appointment** → Receives confirmation with queue position
2. **If same-day** → Gets token number for queue management
3. **Waits for doctor approval** → Status shows "Pending Approval"
4. **Doctor approves** → Status changes to "Approved", slot is blocked
5. **Doctor completes** → Status changes to "Completed"
6. **Optional** → Doctor adds prescription

### Status Messages
- **`queued`**: "Pending Approval" + Token number (if today)
- **`approved`**: "Approved" + Confirmation details
- **`rejected`**: "Rejected" + Reason (optional)
- **`completed`**: "Completed" + Thank you message

## 🔧 Technical Implementation Details

### Database Schema Updates
```javascript
const appointmentSchema = new mongoose.Schema({
  // ... existing fields ...
  status: {
    type: String,
    enum: ['queued', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'queued'
  },
  tokenNumber: {
    type: Number,
    default: null // Only set for same-day appointments
  },
  // ... other fields ...
});
```

### Key Functions Added
1. `completeAppointment()` - New controller function
2. Enhanced sorting logic in `getDoctorAppointments()`
3. Updated conflict checking in `bookAppointment()`
4. Token number assignment logic
5. New notification function for completion

## 🧪 Testing

### Test Script Features
- ✅ Creates sample appointments with new status flow
- ✅ Tests status transitions (queued → approved → completed)
- ✅ Validates sorting logic with multiple appointments
- ✅ Tests token number assignment for same-day appointments
- ✅ Verifies slot blocking mechanism
- ✅ Cleans up test data automatically

### Running Tests
```bash
cd backend
node testAppointmentWorkflow.js
```

## 🚀 Deployment Checklist

### Backend Deployment
- [ ] Update database with new schema
- [ ] Deploy updated appointment controller
- [ ] Deploy new API routes
- [ ] Update notification service
- [ ] Run migration script if needed

### Frontend Deployment
- [ ] Update appointment list screens
- [ ] Deploy new API service methods
- [ ] Update status handling
- [ ] Test real-time notifications
- [ ] Verify UI changes

## 📈 Benefits of New Implementation

### For Doctors
1. **Clearer Queue Management** - See pending approvals first
2. **Better Time Management** - Only approved appointments block slots
3. **Streamlined Workflow** - Simple approve/reject/complete actions
4. **Token-based Queue** - Easy same-day appointment management

### For Patients
1. **Clear Status Updates** - Always know appointment status
2. **Token Numbers** - Know queue position for same-day visits
3. **Real-time Notifications** - Instant updates on status changes
4. **Better Experience** - No confusion about appointment state

### For System
1. **Conflict Prevention** - Robust slot blocking mechanism
2. **Scalable Queue** - Token-based system scales well
3. **Clean Status Flow** - Simple, predictable status transitions
4. **Real-time Updates** - Immediate status synchronization

## 🔮 Future Enhancements

### Potential Additions
1. **Waiting Time Estimation** - Predict wait times based on queue
2. **Appointment Rescheduling** - Allow patients to reschedule approved appointments
3. **Doctor Availability Sync** - Real-time availability updates
4. **SMS Notifications** - Send SMS for critical status changes
5. **Analytics Dashboard** - Track appointment patterns and efficiency

---

**Implementation Status**: ✅ Complete and Ready for Deployment
**Last Updated**: August 10, 2025
**Version**: 1.0.0
