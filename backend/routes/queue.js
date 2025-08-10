const express = require('express');
const router = express.Router();
const {
  getDoctorQueue,
  getPatientQueuePosition,
  callNextPatient,
  markPatientCompleted
} = require('../controllers/queueController');
const { verifyToken } = require('../middleware/auth');

// Get doctor's queue for the day
router.get('/doctor/:doctorId', verifyToken, getDoctorQueue);

// Get patient's queue position
router.get('/patient/:appointmentId', verifyToken, getPatientQueuePosition);

// Call next patient (doctor only)
router.post('/doctor/:doctorId/call-next', verifyToken, callNextPatient);

// Mark patient as completed (doctor only)
router.put('/appointment/:appointmentId/complete', verifyToken, markPatientCompleted);

module.exports = router;
