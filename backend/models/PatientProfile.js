const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  patientId: {
    type: String,
    unique: true,
  },
  // Basic Info (auto-filled from User/UserRequest models)
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
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
  },
  // Additional Profile Info
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
  },
  address: {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  // Medical Information
  medicalHistory: [{
    condition: {
      type: String,
      required: true,
      trim: true,
    },
    diagnosedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Chronic'],
      default: 'Active',
    },
  }],
  allergies: [{
    allergen: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'],
      required: true,
    },
    reaction: {
      type: String,
      trim: true,
    },
  }],
  currentMedications: [{
    medicationName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    prescribedBy: {
      type: String,
      trim: true,
    },
  }],
  pastSurgeries: [{
    surgeryName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hospital: {
      type: String,
      trim: true,
    },
    surgeon: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  }],
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  // Profile
  profilePicture: {
    type: String,
    default: null,
  },
  // Insurance Information (Optional)
  insurance: {
    provider: {
      type: String,
      trim: true,
    },
    policyNumber: {
      type: String,
      trim: true,
    },
    groupNumber: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
  },
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  // Statistics
  totalAppointments: {
    type: Number,
    default: 0,
  },
  lastVisit: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
patientProfileSchema.index({ userId: 1 });
patientProfileSchema.index({ patientId: 1 });
patientProfileSchema.index({ email: 1 });
patientProfileSchema.index({ bloodGroup: 1 });
patientProfileSchema.index({ isActive: 1 });

// Auto-generate patient ID
patientProfileSchema.pre('save', function(next) {
  if (!this.patientId) {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.patientId = `PT${timestamp}${randomNum}`;
  }
  next();
});

// Virtual for age calculation
patientProfileSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for full address
patientProfileSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode } = this.address;
  return [street, city, state, zipCode].filter(Boolean).join(', ');
});

// Method to check if profile is complete
patientProfileSchema.methods.checkProfileCompletion = function() {
  const requiredFields = [
    'name', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 
    'bloodGroup', 'address.city', 'address.state', 'address.zipCode',
    'emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phoneNumber'
  ];
  
  for (let field of requiredFields) {
    const fieldValue = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj && obj[key], this) : 
      this[field];
    
    if (!fieldValue) {
      this.profileCompleted = false;
      return false;
    }
  }
  
  this.profileCompleted = true;
  return true;
};

// Method to get active medical conditions
patientProfileSchema.methods.getActiveMedicalConditions = function() {
  return this.medicalHistory.filter(condition => condition.status === 'Active');
};

// Method to get current medications list
patientProfileSchema.methods.getCurrentMedicationsList = function() {
  return this.currentMedications.map(med => 
    `${med.medicationName} - ${med.dosage} (${med.frequency})`
  );
};

// Auto-check profile completion and generate patientId before saving
patientProfileSchema.pre('save', async function(next) {
  // Generate patientId if not provided
  if (!this.patientId) {
    try {
      // Find the latest patient to determine the next ID
      const lastPatient = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
      let nextNumber = 1;
      
      if (lastPatient && lastPatient.patientId) {
        // Extract number from existing patientId (format: PAT000001)
        const match = lastPatient.patientId.match(/PAT(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // Generate new patientId with zero-padding
      this.patientId = `PAT${nextNumber.toString().padStart(6, '0')}`;
      
      console.log(`🆔 Generated patientId: ${this.patientId} for patient: ${this.name}`);
    } catch (error) {
      console.error('Error generating patientId:', error);
      return next(error);
    }
  }
  
  this.checkProfileCompletion();
  next();
});

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
