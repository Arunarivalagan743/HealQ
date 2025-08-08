const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentDetails,
  cancelAppointment,
  updateAppointmentStatus,
  getAllAppointments
} = require('../controllers/appointmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Book appointment
router.post('/book', verifyToken, bookAppointment);

// Get patient appointments
router.get('/patient', verifyToken, getPatientAppointments);

// Get doctor appointments
router.get('/doctor', verifyToken, getDoctorAppointments);

// Get appointment details
router.get('/:appointmentId', verifyToken, getAppointmentDetails);

// Cancel appointment
router.put('/cancel/:appointmentId', verifyToken, cancelAppointment);

// Update appointment status (for doctors and admin)
router.put('/status/:appointmentId', verifyToken, updateAppointmentStatus);

// Get all appointments (admin only)
router.get('/admin/all', verifyToken, requireAdmin, getAllAppointments);

module.exports = router;
