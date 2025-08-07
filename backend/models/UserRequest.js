const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Doctor', 'Patient'],
  },
  // Role-specific fields
  specialization: {
    type: String,
    trim: true,
    // Required only for doctors
  },
  problem: {
    type: String,
    trim: true,
    // Required only for patients
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminResponse: {
    type: String,
    trim: true,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
userRequestSchema.index({ email: 1 });
userRequestSchema.index({ status: 1 });
userRequestSchema.index({ role: 1 });
userRequestSchema.index({ createdAt: -1 });

// Update timestamp on save
userRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for request age
userRequestSchema.virtual('requestAge').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
});

// Ensure virtual fields are serialized
userRequestSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserRequest', userRequestSchema);
