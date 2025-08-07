const express = require('express');
const router = express.Router();

const {
  checkEmailRole,
  register,
  registerBackendOnly,
  login,
  loginBackendOnly,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
} = require('../controllers/authController');

const { verifyToken } = require('../middleware/auth');
const {
  validateCheckEmailRole,
  validateRegistration,
  validateBackendRegistration,
  validateLogin,
  validateBackendLogin,
  validateForgotPassword,
  validateOTPVerification,
  validatePasswordReset,
  validateUpdateProfile,
} = require('../middleware/validation');

// Public routes
router.post('/check-email-role', validateCheckEmailRole, checkEmailRole);
router.post('/register', validateRegistration, register);
router.post('/register-backend-only', validateBackendRegistration, registerBackendOnly);
router.post('/login', validateLogin, login);
router.post('/login-backend-only', validateBackendLogin, loginBackendOnly);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-otp', validateOTPVerification, verifyOTP);
router.post('/reset-password', validatePasswordReset, resetPassword);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, validateUpdateProfile, updateProfile);

module.exports = router;
