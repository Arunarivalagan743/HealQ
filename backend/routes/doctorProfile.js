const express = require('express');
const router = express.Router();
const {
  createDoctorProfile,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
  getDoctorAvailability,
  uploadProfilePicture
} = require('../controllers/doctorProfileController');
const { getVerifiedDoctors } = require('../controllers/doctorController');
const { verifyToken } = require('../middleware/auth');

// Create doctor profile
router.post('/create', verifyToken, createDoctorProfile);

// Get doctor profile (own profile if no ID provided)
router.get('/profile/:doctorId?', verifyToken, getDoctorProfile);

// Update doctor profile
router.put('/update', verifyToken, updateDoctorProfile);

// Get all doctors (with filters)
router.get('/all', verifyToken, getAllDoctors);

// Get verified doctors for patients (no auth required for browsing)
router.get('/verified', getVerifiedDoctors);

// Get doctor availability
router.get('/availability/:doctorId', verifyToken, getDoctorAvailability);

// Upload profile picture
router.post('/upload-picture', verifyToken, uploadProfilePicture);

module.exports = router;
