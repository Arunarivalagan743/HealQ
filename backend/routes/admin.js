const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAllUserRequests,
  approveUserRequest,
  rejectUserRequest,
  getAllDoctorProfiles,
  getAllPatientProfiles,
  updateDoctorVerification,
  updatePatientStatus,
  getComprehensiveDashboardStats,
  getDoctorsInQueue,
  getDoctorProfileById,
  getDoctorAppointments,
  getDoctorPatientHistory
} = require('../controllers/adminController');

const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateAddUser } = require('../middleware/validation');

// ⚠️ DEVELOPMENT ROUTES - REMOVE IN PRODUCTION
// These routes bypass authentication and should ONLY be used in development
if (process.env.NODE_ENV === 'development') {
  console.log('🚨 WARNING: Development routes are enabled. These bypass authentication!');
  
  // Temporary route for development - dashboard stats without auth
  router.get('/dashboard/stats-dev', getDashboardStats);

  // Temporary route for development - user requests without auth
  router.get('/requests-dev', getAllUserRequests);

  // Temporary routes for development - approve/reject without auth
  router.put('/requests-dev/:requestId/approve', approveUserRequest);
  router.put('/requests-dev/:requestId/reject', rejectUserRequest);

  // Temporary route for development - get users without auth
  router.get('/users-dev', getAllUsers);
  
  // Temporary route for development - comprehensive dashboard stats without auth
  router.get('/dashboard/comprehensive-dev', getComprehensiveDashboardStats);

  // Temporary routes for development - doctor profile management without auth
  router.get('/doctors-dev', getAllDoctorProfiles);
  router.get('/doctors-dev/queue', getDoctorsInQueue);
  router.get('/doctors-dev/:doctorId', getDoctorProfileById);
  router.get('/doctors-dev/:doctorId/appointments', getDoctorAppointments);
  router.get('/doctors-dev/:doctorId/patients', getDoctorPatientHistory);
  router.put('/doctors-dev/:doctorId/verification', updateDoctorVerification);

  // Temporary route to check specific user
  router.get('/users-dev/check/:email', async (req, res) => {
    try {
      const User = require('../models/User');
      const user = await User.findOne({ email: req.params.email.toLowerCase() });
      res.json({
        success: true,
        data: user ? {
          id: user._id,
          email: user.email,
          name: user.name,
          approved: user.approved,
          isActive: user.isActive,
          role: user.role
        } : null
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User management
router.post('/users', validateAddUser, addUser);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// User request management
router.get('/requests', getAllUserRequests);
router.put(
  '/requests/:requestId/approve',
  [
    body('adminResponse')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Admin response must not exceed 500 characters'),
  ],
  approveUserRequest
);
router.put(
  '/requests/:requestId/reject',
  [
    body('adminResponse')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Admin response must not exceed 500 characters'),
  ],
  rejectUserRequest
);

// Profile Management Routes
router.get('/doctors', getAllDoctorProfiles);
router.get('/doctors/queue', getDoctorsInQueue); // New queue route
router.get('/doctors/:doctorId', getDoctorProfileById); // Get specific doctor profile
router.get('/doctors/:doctorId/appointments', getDoctorAppointments); // Get doctor appointments
router.get('/doctors/:doctorId/patients', getDoctorPatientHistory); // Get doctor patient history
router.get('/patients', getAllPatientProfiles);
router.put('/doctors/:doctorId/verification', updateDoctorVerification);
router.put('/patients/:patientId/status', updatePatientStatus);

// Enhanced dashboard stats
router.get('/dashboard/comprehensive', getComprehensiveDashboardStats);

module.exports = router;
