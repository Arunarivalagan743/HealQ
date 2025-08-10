const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getPatientHistory,
  getAppointmentDetails,
  cancelAppointment,
  updateAppointmentStatus,
  getAllAppointments,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  moveToQueue,
  startProcessing,
  finishAppointment,
  addPrescription,
  autoFinishAppointments
} = require('../controllers/appointmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Book appointment
router.post('/book', verifyToken, bookAppointment);

// Get patient appointments
router.get('/patient', verifyToken, getPatientAppointments);

// Get doctor appointments
router.get('/doctor', verifyToken, getDoctorAppointments);

// Get patient history for a specific patient (doctor only)
router.get('/patient-history/:patientId', verifyToken, getPatientHistory);

// Get appointment details
router.get('/:appointmentId', verifyToken, getAppointmentDetails);

// Cancel appointment
router.put('/cancel/:appointmentId', verifyToken, cancelAppointment);

// Update appointment status (for doctors and admin)
router.put('/status/:appointmentId', verifyToken, updateAppointmentStatus);

// Get all appointments (admin only)
router.get('/admin/all', verifyToken, requireAdmin, getAllAppointments);

// Approve appointment (doctor only)
router.put('/approve/:appointmentId', verifyToken, approveAppointment);

// Reject appointment (doctor only)
router.put('/reject/:appointmentId', verifyToken, rejectAppointment);

// Complete appointment (doctor only)
router.put('/complete/:appointmentId', verifyToken, completeAppointment);

// Move appointment to queue
router.put('/queue/:appointmentId', verifyToken, moveToQueue);

// Start processing appointment (doctor only)
router.put('/start/:appointmentId', verifyToken, startProcessing);

// Finish appointment (doctor only)
router.put('/finish/:appointmentId', verifyToken, finishAppointment);

// Add prescription to finished appointment (doctor only)
router.put('/prescription/:appointmentId', verifyToken, addPrescription);

// Auto-finish appointments (system/admin)
router.post('/auto-finish', verifyToken, requireAdmin, autoFinishAppointments);

module.exports = router;
