const express = require('express');
const router = express.Router();

const {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
} = require('../controllers/adminController');

const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateAddUser } = require('../middleware/validation');

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

module.exports = router;
