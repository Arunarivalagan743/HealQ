class NotificationService {
  constructor() {
    this.clients = new Map(); // Store SSE connections
  }

  // Add client connection for real-time updates
  addClient(userId, response) {
    this.clients.set(userId, response);
    
    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    response.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Connected to notification service'
    })}\n\n`);

    // Handle client disconnect
    response.on('close', () => {
      this.clients.delete(userId);
    });
  }

  // Remove client connection
  removeClient(userId) {
    const client = this.clients.get(userId);
    if (client) {
      client.end();
      this.clients.delete(userId);
    }
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
      } catch (error) {
        console.error('Error sending notification to user:', userId, error);
        this.clients.delete(userId);
      }
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.sendToUser(userId, notification);
    });
  }

  // Send appointment booking notification
  sendAppointmentBookedNotification(doctorUserId, appointment) {
    const notification = {
      type: 'appointment_booked',
      message: `New appointment booked by ${appointment.patientName}`,
      data: {
        appointmentId: appointment.appointmentId,
        patientName: appointment.patientName,
        queueToken: appointment.queueToken,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(doctorUserId, notification);
  }

  // Send queue position update notification
  sendQueueUpdateNotification(patientUserId, queueData) {
    const notification = {
      type: 'queue_update',
      message: `Your queue position has been updated`,
      data: {
        queueToken: queueData.queueToken,
        queuePosition: queueData.queuePosition,
        patientsAhead: queueData.patientsAhead,
        estimatedWaitTime: queueData.estimatedWaitTime,
        queueStatus: queueData.queueStatus,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send patient called notification
  sendPatientCalledNotification(patientUserId, appointment) {
    const notification = {
      type: 'patient_called',
      message: `You have been called for your appointment`,
      data: {
        appointmentId: appointment.appointmentId,
        queueToken: appointment.queueToken,
        doctorName: appointment.doctorName,
        calledAt: appointment.calledAt,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send appointment approved notification
  sendAppointmentApprovedNotification(patientUserId, appointment) {
    const notification = {
      type: 'appointment_approved',
      message: `Your appointment has been confirmed`,
      data: {
        appointmentId: appointment.appointmentId,
        queueToken: appointment.queueToken,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send appointment approved notification
  sendAppointmentApprovedNotification(patientUserId, appointmentData) {
    const notification = {
      type: 'appointment_approved',
      title: 'Appointment Approved! 🎉',
      message: `Dr. ${appointmentData.doctorName} has approved your appointment. You're now in the queue.`,
      data: {
        appointmentId: appointmentData.appointmentId,
        queueToken: appointmentData.queueToken,
        doctorName: appointmentData.doctorName,
        appointmentDate: appointmentData.appointmentDate,
        timeSlot: appointmentData.timeSlot,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send appointment rejected notification
  sendAppointmentRejectedNotification(patientUserId, appointmentData) {
    const notification = {
      type: 'appointment_rejected',
      title: 'Appointment Declined',
      message: `Dr. ${appointmentData.doctorName} has declined your appointment request. ${appointmentData.reason || 'Please try booking another slot.'}`,
      data: {
        appointmentId: appointmentData.appointmentId,
        doctorName: appointmentData.doctorName,
        reason: appointmentData.reason,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send queue status update notification
  sendQueueStatusNotification(patientUserId, appointmentData) {
    const notification = {
      type: 'queue_status_update',
      title: 'Queue Status Updated',
      message: `Your appointment status: ${appointmentData.status}. Queue position: ${appointmentData.queuePosition}`,
      data: {
        appointmentId: appointmentData.appointmentId,
        status: appointmentData.status,
        queuePosition: appointmentData.queuePosition,
        estimatedWaitTime: appointmentData.estimatedWaitTime,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send appointment called notification (patient turn)
  sendAppointmentCalledNotification(patientUserId, appointmentData) {
    const notification = {
      type: 'appointment_called',
      title: 'Your Turn! 🔔',
      message: `Token ${appointmentData.queueToken}: Please proceed to Dr. ${appointmentData.doctorName}'s consultation room.`,
      data: {
        appointmentId: appointmentData.appointmentId,
        queueToken: appointmentData.queueToken,
        doctorName: appointmentData.doctorName,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send appointment completed notification
  sendAppointmentCompletedNotification(patientUserId, appointmentData) {
    const notification = {
      type: 'appointment_completed',
      title: 'Appointment Completed ✅',
      message: `Your appointment with Dr. ${appointmentData.doctorName} has been completed. Thank you for your visit!`,
      data: {
        appointmentId: appointmentData.appointmentId,
        doctorName: appointmentData.doctorName,
        appointmentDate: appointmentData.appointmentDate,
        timeSlot: appointmentData.timeSlot,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Send prescription ready notification
  sendPrescriptionReadyNotification(patientUserId, appointmentData) {
    const notification = {
      type: 'prescription_ready',
      title: 'Prescription Ready 📋',
      message: `Dr. ${appointmentData.doctorName} has added your prescription. Check your email for details.`,
      data: {
        appointmentId: appointmentData.appointmentId,
        doctorName: appointmentData.doctorName,
        timestamp: new Date().toISOString()
      }
    };

    this.sendToUser(patientUserId, notification);
  }

  // Get connected clients count
  getConnectedClientsCount() {
    return this.clients.size;
  }

  // Get connected user IDs
  getConnectedUserIds() {
    return Array.from(this.clients.keys());
  }

  // Send broadcast message to all connected clients
  broadcast(notification) {
    const userIds = this.getConnectedUserIds();
    this.sendToUsers(userIds, notification);
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
