const { body, validationResult } = require('express-validator');

// Common validation error handler
const handleValidationErrors = (req, res, next) => {
  console.log('🔍 [VALIDATION] Checking validation errors...');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ [VALIDATION] Validation failed:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  console.log('✅ [VALIDATION] Validation passed');
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  // Conditional validation for Doctor role (checked server-side)
  body('specialization')
    .optional({ values: 'falsy' }) // This will treat empty strings as optional
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),

  body('idToken')
    .notEmpty()
    .withMessage('Firebase ID token is required'),

  handleValidationErrors,
];

// Validation rules for backend-only registration (includes password)
const validateBackendRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  // Conditional validation for Doctor role (checked server-side)
  body('specialization')
    .optional({ values: 'falsy' }) // This will treat empty strings as optional
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),

  handleValidationErrors,
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('idToken')
    .notEmpty()
    .withMessage('Firebase ID token is required'),

  handleValidationErrors,
];

// Validation rules for backend-only login
const validateBackendLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  (req, res, next) => {
    console.log('🔍 [BACKEND LOGIN VALIDATION] Checking request:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      timestamp: new Date().toISOString()
    });
    next();
  },

  handleValidationErrors,
];

// Validation rules for forgot password
const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  handleValidationErrors,
];

// Validation rules for OTP verification
const validateOTPVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),

  handleValidationErrors,
];

// Validation rules for password reset
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  handleValidationErrors,
];

// Validation rules for adding users (Admin only)
const validateAddUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('role')
    .isIn(['Patient', 'Doctor'])
    .withMessage('Role must be Patient or Doctor'),
  
  // Conditional validation for Doctor role
  body('specialization')
    .if(body('role').equals('Doctor'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization is required for doctors and must be between 2 and 100 characters'),

  handleValidationErrors,
];

// Validation rules for updating user profile
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),

  handleValidationErrors,
];

// Validation rules for checking email role
const validateCheckEmailRole = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  handleValidationErrors,
];

module.exports = {
  validateCheckEmailRole,
  validateRegistration,
  validateBackendRegistration,
  validateLogin,
  validateBackendLogin,
  validateForgotPassword,
  validateOTPVerification,
  validatePasswordReset,
  validateAddUser,
  validateUpdateProfile,
};
