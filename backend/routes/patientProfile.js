const express = require('express');
const router = express.Router();
const {
  createPatientProfile,
  getPreFilledData,
  getPatientProfile,
  updatePatientProfile,
  getAllPatients,
  uploadProfilePicture,
  getPatientMedicalSummary
} = require('../controllers/patientProfileController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get pre-filled data for profile creation
router.get('/prefill-data', verifyToken, getPreFilledData);

// Create patient profile
router.post('/create', verifyToken, createPatientProfile);

// Get patient profile (own profile if no ID provided)
router.get('/profile/:patientId?', verifyToken, getPatientProfile);

// Update patient profile
router.put('/update', verifyToken, updatePatientProfile);

// Get all patients (admin only)
router.get('/all', verifyToken, requireAdmin, getAllPatients);

// Upload profile picture
router.post('/upload-picture', verifyToken, uploadProfilePicture);

// Get medical summary
router.get('/medical-summary', verifyToken, getPatientMedicalSummary);

module.exports = router;
