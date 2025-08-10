const express = require('express');
const router = express.Router();
const {
  connectToNotifications,
  sendTestNotification,
  getNotificationStats
} = require('../controllers/notificationController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Connect to notification stream (SSE)
router.get('/stream', verifyToken, connectToNotifications);

// Send test notification (admin only)
router.post('/test', verifyToken, requireAdmin, sendTestNotification);

// Get notification service stats (admin only)
router.get('/stats', verifyToken, requireAdmin, getNotificationStats);

module.exports = router;
