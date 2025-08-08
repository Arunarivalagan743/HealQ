const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true,
  },
  // Patient Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientProfile',
    required: true,
  },
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  patientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  // Doctor Information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile',
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
    trim: true,
  },
  doctorSpecialization: {
    type: String,
    required: true,
    trim: true,
  },
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: true,
  },
  timeSlot: {
    start: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
  },
  consultationType: {
    type: String,
    enum: ['In-person', 'Online'],
    required: true,
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0,
  },
  // Appointment Status
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'In-Progress', 'Completed', 'Cancelled', 'No-Show'],
    default: 'Scheduled',
  },
  // Reason for Visit
  reasonForVisit: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  symptoms: [{
    type: String,
    trim: true,
  }],
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Insurance'],
  },
  transactionId: {
    type: String,
    trim: true,
  },
  // Medical Records (filled after appointment)
  medicalRecord: {
    diagnosis: {
      type: String,
      trim: true,
    },
    prescription: [{
      medicationName: {
        type: String,
        trim: true,
      },
      dosage: {
        type: String,
        trim: true,
      },
      frequency: {
        type: String,
        trim: true,
      },
      duration: {
        type: String,
        trim: true,
      },
      instructions: {
        type: String,
        trim: true,
      },
    }],
    labTests: [{
      testName: {
        type: String,
        trim: true,
      },
      instructions: {
        type: String,
        trim: true,
      },
    }],
    followUp: {
      required: {
        type: Boolean,
        default: false,
      },
      afterDays: {
        type: Number,
        min: 1,
      },
      instructions: {
        type: String,
        trim: true,
      },
    },
    doctorNotes: {
      type: String,
      trim: true,
    },
  },
  // Cancellation Information
  cancellationReason: {
    type: String,
    trim: true,
  },
  cancelledBy: {
    type: String,
    enum: ['Patient', 'Doctor', 'Admin'],
  },
  cancelledAt: {
    type: Date,
  },
  // Rescheduling Information
  originalDate: {
    type: Date,
  },
  rescheduledBy: {
    type: String,
    enum: ['Patient', 'Doctor', 'Admin'],
  },
  rescheduledAt: {
    type: Date,
  },
  // Reminders
  remindersSent: {
    type: Number,
    default: 0,
  },
  lastReminderSent: {
    type: Date,
  },
  // Rating and Feedback (after completion)
  rating: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    patientFeedback: {
      type: String,
      trim: true,
    },
    doctorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    doctorFeedback: {
      type: String,
      trim: true,
    },
  },
}, {
  timestamps: true,
});

// Indexes
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ consultationType: 1 });
appointmentSchema.index({ paymentStatus: 1 });

// Compound indexes
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, 'timeSlot.start': 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

// Auto-generate appointment ID
appointmentSchema.pre('save', function(next) {
  if (!this.appointmentId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-4);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    this.appointmentId = `APT${dateStr}${timeStr}${randomNum}`;
  }
  next();
});

// Virtual for appointment date string
appointmentSchema.virtual('appointmentDateString').get(function() {
  return this.appointmentDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for appointment time string
appointmentSchema.virtual('appointmentTimeString').get(function() {
  return `${this.timeSlot.start} - ${this.timeSlot.end}`;
});

// Virtual for days until appointment
appointmentSchema.virtual('daysUntilAppointment').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  const diffTime = appointmentDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  
  // Add time slot to appointment date
  const [hours, minutes] = this.timeSlot.start.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);
  
  // Allow cancellation up to 24 hours before appointment
  const timeDiff = appointmentDateTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff > 24 && ['Scheduled', 'Confirmed'].includes(this.status);
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  return this.canBeCancelled(); // Same logic as cancellation
};

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  
  // Add time slot to appointment date
  const [hours, minutes] = this.timeSlot.start.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);
  
  return appointmentDateTime > now && ['Scheduled', 'Confirmed'].includes(this.status);
};

// Method to mark as completed
appointmentSchema.methods.markAsCompleted = function() {
  this.status = 'Completed';
  return this.save();
};

// Method to cancel appointment
appointmentSchema.methods.cancelAppointment = function(cancelledBy, reason) {
  this.status = 'Cancelled';
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

// Static method to find conflicts
appointmentSchema.statics.findConflicts = async function(doctorId, date, timeSlot) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await this.find({
    doctorId: doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    'timeSlot.start': timeSlot.start,
    status: { $in: ['Scheduled', 'Confirmed', 'In-Progress'] }
  });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
