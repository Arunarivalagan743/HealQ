const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to be unique
  },
  password: {
    type: String,
    // Only required for backend-only users when explicitly setting firebaseUid to null
    // This prevents validation errors when updating existing users
    required: function() {
      // Only required when firebaseUid is explicitly set to null in this operation
      return this.isNew && this.firebaseUid === null;
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['Patient', 'Doctor', 'Admin'],
    required: true,
  },
  approved: {
    type: Boolean,
    default: true, // Since only pre-approved emails can register
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    required: function() {
      return this.role === 'Doctor';
    },
  },
  licenseNumber: {
    type: String,
    sparse: true,
  },
  // Patient-specific fields
  dateOfBirth: {
    type: Date,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  // OTP for password reset
  otp: {
    code: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  // Timestamps
  lastLogin: {
    type: Date,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ role: 1 });
// Note: Removed TTL index that was deleting entire user documents
// TTL should only be used for temporary documents, not for cleaning up subdocuments

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode } = this.address;
  return [street, city, state, zipCode].filter(Boolean).join(', ');
});

// Method to check if user is authorized to register
userSchema.statics.isAuthorizedEmail = async function(email) {
  const user = await this.findOne({ email: email.toLowerCase() });
  return user && user.approved;
};

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  this.otp = {
    code: otp,
    expiresAt,
    verified: false,
  };
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(inputOTP) {
  if (!this.otp || !this.otp.code) {
    return false;
  }
  
  // Check if OTP has expired
  if (this.otp.expiresAt < new Date()) {
    console.log('🕒 OTP expired, clearing it from user document');
    this.otp = undefined; // Clear expired OTP
    return false;
  }
  
  if (this.otp.code === inputOTP) {
    this.otp.verified = true;
    return true;
  }
  
  return false;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

module.exports = mongoose.model('User', userSchema);
