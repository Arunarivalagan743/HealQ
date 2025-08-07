const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const onboardingController = require('../controllers/onboardingController');

// @route   POST /api/onboarding/request
// @desc    Submit a new user request (for new users)
// @access  Public
router.post(
  '/request',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('phone')
      .isMobilePhone()
      .withMessage('Please enter a valid phone number'),
    body('role')
      .isIn(['Doctor', 'Patient'])
      .withMessage('Role must be either Doctor or Patient'),
    body('address')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Address must be between 10 and 500 characters'),
    body('specialization')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Specialization must be between 2 and 100 characters'),
    body('problem')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Problem description must be between 5 and 1000 characters'),
  ],
  onboardingController.submitUserRequest
);

// @route   POST /api/onboarding/verify-existing
// @desc    Check if user exists and send OTP (for existing users)
// @access  Public
router.post(
  '/verify-existing',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
  ],
  onboardingController.verifyExistingUser
);

// @route   POST /api/onboarding/verify-otp
// @desc    Verify OTP for existing user
// @access  Public
router.post(
  '/verify-otp',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be a 6-digit number'),
  ],
  onboardingController.verifyOTP
);

module.exports = router;
