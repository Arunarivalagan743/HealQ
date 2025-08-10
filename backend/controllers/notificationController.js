const notificationService = require('../services/notificationService');

// Connect to notification stream (SSE)
const connectToNotifications = (req, res) => {
  const userId = req.user.id;
  
  // Add client to notification service
  notificationService.addClient(userId, res);
  
  console.log(`🔔 User ${userId} connected to notifications`);
};

// Send test notification
const sendTestNotification = (req, res) => {
  const { userId, message } = req.body;
  
  const notification = {
    type: 'test',
    message: message || 'Test notification',
    timestamp: new Date().toISOString()
  };
  
  if (userId) {
    notificationService.sendToUser(userId, notification);
  } else {
    notificationService.broadcast(notification);
  }
  
  res.json({
    success: true,
    message: 'Test notification sent'
  });
};

// Get notification service stats
const getNotificationStats = (req, res) => {
  res.json({
    success: true,
    data: {
      connectedClients: notificationService.getConnectedClientsCount(),
      connectedUsers: notificationService.getConnectedUserIds()
    }
  });
};

module.exports = {
  connectToNotifications,
  sendTestNotification,
  getNotificationStats
};
