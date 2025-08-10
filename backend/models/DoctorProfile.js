const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  doctorId: {
    type: String,
    unique: true,
  },
  // Basic Info (auto-filled from User model)
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  // Professional Info
  specialization: {
    type: String,
    required: true,
    enum: [
      'General Medicine',
      'Cardiology',
      'Dermatology',
      'Pediatrics',
      'Orthopedics',
      'Neurology',
      'Psychiatry',
      'Gynecology',
      'Ophthalmology',
      'ENT',
      'Dentistry',
      'Physiotherapy',
    ],
  },
  experience: {
    type: Number,
    required: true,
    min: 0,
    max: 50,
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // Working Schedule
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  }],
  workingHours: {
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
  breakTimes: [{
    start: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
  }],
  maxAppointmentsPerSlot: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  slotDuration: {
    type: Number,
    default: 30, // minutes
    enum: [15, 30, 45, 60],
  },
  // Clinic Details
  clinicAddress: {
    type: String,
    required: true,
    trim: true,
  },
  consultationMode: {
    type: String,
    enum: ['In-person'],
    default: 'In-person',
  },
  // Profile
  profilePicture: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Statistics
  totalAppointments: {
    type: Number,
    default: 0,
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes
doctorProfileSchema.index({ userId: 1 });
doctorProfileSchema.index({ doctorId: 1 });
doctorProfileSchema.index({ specialization: 1 });
doctorProfileSchema.index({ isActive: 1, isVerified: 1 });
doctorProfileSchema.index({ consultationFee: 1 });

// Auto-generate doctor ID in sequential order (queue-based)
doctorProfileSchema.pre('save', async function(next) {
  if (!this.doctorId) {
    try {
      // Find the highest existing doctorId number for sequential assignment
      const lastDoctor = await this.constructor.findOne(
        { doctorId: { $regex: /^DOC\d+$/ } },
        { doctorId: 1 }
      ).sort({ doctorId: -1 }).lean().exec();
      
      let nextNumber = 1;
      if (lastDoctor && lastDoctor.doctorId) {
        const currentNumber = parseInt(lastDoctor.doctorId.replace('DOC', ''));
        nextNumber = currentNumber + 1;
      }
      
      // Generate sequential doctor ID (queue-based: first approved, first numbered)
      this.doctorId = `DOC${nextNumber.toString().padStart(4, '0')}`;
      
      console.log(`🆔 [DOCTOR] Generated Doctor ID: ${this.doctorId} for ${this.name}`);
    } catch (error) {
      console.error('❌ [DOCTOR] Error generating sequential doctorId:', error);
      // Fallback to timestamp method if sequential fails
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.doctorId = `DR${timestamp}${randomNum}`;
      console.log(`🆔 [DOCTOR] Fallback Doctor ID: ${this.doctorId} for ${this.name}`);
    }
  }
  next();
});

// Virtual for available days string
doctorProfileSchema.virtual('availableDaysString').get(function() {
  if (!this.workingDays || this.workingDays.length === 0) return 'Not specified';
  return this.workingDays.join(', ');
});

// Method to check if doctor is available on a specific day
doctorProfileSchema.methods.isAvailableOnDay = function(dayName) {
  return this.workingDays.includes(dayName);
};

// Method to get available time slots for a day
doctorProfileSchema.methods.getAvailableSlots = function() {
  const slots = [];
  const startTime = this.workingHours.start;
  const endTime = this.workingHours.end;
  const slotDuration = this.slotDuration;
  
  // Convert time strings to minutes
  const startMinutes = this.timeToMinutes(startTime);
  const endMinutes = this.timeToMinutes(endTime);
  
  for (let current = startMinutes; current < endMinutes; current += slotDuration) {
    const slotStart = this.minutesToTime(current);
    const slotEnd = this.minutesToTime(current + slotDuration);
    
    // Check if slot conflicts with break time
    const isBreakTime = this.breakTimes.some(breakTime => {
      const breakStart = this.timeToMinutes(breakTime.start);
      const breakEnd = this.timeToMinutes(breakTime.end);
      return current >= breakStart && current < breakEnd;
    });
    
    if (!isBreakTime) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        available: true,
      });
    }
  }
  
  return slots;
};

// Helper method to convert time string to minutes
doctorProfileSchema.methods.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper method to convert minutes to time string
doctorProfileSchema.methods.minutesToTime = function(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
