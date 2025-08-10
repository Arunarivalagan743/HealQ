const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const notificationService = require('./notificationService');

class AppointmentScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Appointment scheduler is already running');
      return;
    }

    console.log('Starting appointment scheduler...');
    
    // Run every 15 minutes to check for appointments to finish
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.autoFinishAppointments();
        await this.updateQueuePositions();
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    });

    // Run every hour to send reminders
    cron.schedule('0 * * * *', async () => {
      try {
        await this.sendAppointmentReminders();
      } catch (error) {
        console.error('Reminder scheduler error:', error);
      }
    });

    // Run at 11:30 PM daily to auto-cancel non-approved appointments
    cron.schedule('30 23 * * *', async () => {
      try {
        await this.autoCancelNonApprovedAppointments();
      } catch (error) {
        console.error('Auto-cancel scheduler error:', error);
      }
    });

    this.isRunning = true;
    console.log('Appointment scheduler started successfully');
  }

  // Stop the scheduler
  stop() {
    this.isRunning = false;
    console.log('Appointment scheduler stopped');
  }

  // Auto-finish appointments that are past their time slot
  async autoFinishAppointments() {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Find appointments that should be finished
      const appointmentsToFinish = await Appointment.find({
        appointmentDate: { $lte: new Date(currentDate) },
        status: 'processing',
        $expr: {
          $and: [
            { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } }, currentDate] },
            { $lt: ['$timeSlot.end', currentTime] }
          ]
        }
      });

      let finishedCount = 0;

      for (const appointment of appointmentsToFinish) {
        try {
          appointment.status = 'finished';
          appointment.queueStatus = 'completed';
          appointment.completedAt = new Date(); // Set completion time
          await appointment.save();

          console.log(`Auto-finished appointment ${appointment.appointmentId}`);
          finishedCount++;

          // Send notification to doctor that appointment is finished
          // and they can add prescription
          
        } catch (error) {
          console.error(`Error auto-finishing appointment ${appointment.appointmentId}:`, error);
        }
      }

      if (finishedCount > 0) {
        console.log(`Auto-finished ${finishedCount} appointments`);
      }

      return finishedCount;
    } catch (error) {
      console.error('Error in autoFinishAppointments:', error);
      throw error;
    }
  }

  // Update queue positions for waiting appointments
  async updateQueuePositions() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all doctors with appointments today
      const doctorsWithAppointments = await Appointment.distinct('doctorId', {
        appointmentDate: { $gte: new Date(today), $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) },
        status: { $in: ['approved', 'in_queue', 'processing'] }
      });

      for (const doctorId of doctorsWithAppointments) {
        // Get appointments for this doctor today, sorted by queue token
        const appointments = await Appointment.find({
          doctorId: doctorId,
          appointmentDate: { $gte: new Date(today), $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) },
          status: { $in: ['approved', 'in_queue', 'processing'] }
        }).sort({ queueToken: 1 });

        // Update queue positions
        for (let i = 0; i < appointments.length; i++) {
          const appointment = appointments[i];
          const newPosition = i + 1;
          
          if (appointment.queuePosition !== newPosition) {
            appointment.queuePosition = newPosition;
            await appointment.save();
          }
        }
      }
    } catch (error) {
      console.error('Error updating queue positions:', error);
    }
  }

  // Send appointment reminders
  async sendAppointmentReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      // Find appointments for tomorrow that haven't been reminded yet
      const appointmentsToRemind = await Appointment.find({
        appointmentDate: { 
          $gte: new Date(tomorrowDate), 
          $lt: new Date(new Date(tomorrowDate).getTime() + 24 * 60 * 60 * 1000) 
        },
        status: { $in: ['approved', 'in_queue'] },
        remindersSent: { $lt: 1 }
      }).populate('patientId', 'userId');

      let remindersSent = 0;

      for (const appointment of appointmentsToRemind) {
        try {
          // Send reminder notification
          if (appointment.patientId && appointment.patientId.userId) {
            notificationService.sendToUser(appointment.patientId.userId.toString(), {
              type: 'appointment_reminder',
              title: 'Appointment Reminder',
              message: `You have an appointment tomorrow with Dr. ${appointment.doctorName} at ${appointment.timeSlot.start}`,
              data: {
                appointmentId: appointment.appointmentId,
                doctorName: appointment.doctorName,
                appointmentDate: appointment.appointmentDate,
                timeSlot: appointment.timeSlot,
                queueToken: appointment.queueToken
              }
            });
          }

          // Update reminder count
          appointment.remindersSent += 1;
          appointment.lastReminderSent = new Date();
          await appointment.save();

          remindersSent++;
        } catch (error) {
          console.error(`Error sending reminder for appointment ${appointment.appointmentId}:`, error);
        }
      }

      if (remindersSent > 0) {
        console.log(`Sent ${remindersSent} appointment reminders`);
      }

      return remindersSent;
    } catch (error) {
      console.error('Error sending appointment reminders:', error);
      throw error;
    }
  }

  // Estimate wait times for appointments in queue
  async updateEstimatedWaitTimes() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all doctors with appointments today
      const doctorsWithAppointments = await Appointment.distinct('doctorId', {
        appointmentDate: { $gte: new Date(today), $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) },
        status: { $in: ['approved', 'in_queue', 'processing'] }
      });

      for (const doctorId of doctorsWithAppointments) {
        // Get doctor's slot duration (default 30 minutes)
        const doctorProfile = await DoctorProfile.findById(doctorId);
        const slotDuration = doctorProfile?.slotDuration || 30;

        // Get appointments for this doctor today, sorted by queue position
        const appointments = await Appointment.find({
          doctorId: doctorId,
          appointmentDate: { $gte: new Date(today), $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) },
          status: { $in: ['approved', 'in_queue', 'processing'] }
        }).sort({ queuePosition: 1 });

        // Calculate estimated wait times
        for (let i = 0; i < appointments.length; i++) {
          const appointment = appointments[i];
          let estimatedWaitTime = 0;

          if (appointment.status === 'in_queue') {
            // Count appointments ahead in queue
            const appointmentsAhead = i;
            estimatedWaitTime = appointmentsAhead * slotDuration;
          } else if (appointment.status === 'processing') {
            estimatedWaitTime = 0; // Currently being seen
          }

          if (appointment.estimatedWaitTime !== estimatedWaitTime) {
            appointment.estimatedWaitTime = estimatedWaitTime;
            await appointment.save();
          }
        }
      }
    } catch (error) {
      console.error('Error updating estimated wait times:', error);
    }
  }

  // Auto-cancel non-approved appointments at end of day
  async autoCancelNonApprovedAppointments() {
    try {
      console.log('🔄 Starting auto-cancellation of non-approved appointments...');
      
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      // Find appointments for today that are still in 'requested' status
      const appointmentsToCancel = await Appointment.find({
        appointmentDate: { $gte: startOfToday, $lte: endOfToday },
        status: 'requested'
      }).populate('patientId', 'email name userId');
      
      console.log(`Found ${appointmentsToCancel.length} non-approved appointments for today to cancel`);
      
      let cancelledCount = 0;
      for (const appointment of appointmentsToCancel) {
        try {
          appointment.status = 'cancelled';
          appointment.cancellationReason = 'Automatically cancelled - Doctor did not approve by end of day';
          appointment.cancelledBy = 'system';
          appointment.cancelledAt = new Date();
          
          await appointment.save();
          cancelledCount++;
          
          // Send notification to patient
          try {
            const patientUser = await User.findById(appointment.patientId.userId);
            if (patientUser) {
              notificationService.sendAppointmentCancelledNotification(patientUser._id.toString(), {
                appointmentId: appointment.appointmentId,
                doctorName: appointment.doctorName,
                reason: 'Doctor did not approve the appointment by end of day',
                appointmentDate: appointment.appointmentDate
              });
            }
          } catch (notificationError) {
            console.error('Failed to send auto-cancellation notification:', notificationError);
          }
          
          console.log(`✅ Auto-cancelled appointment ${appointment.appointmentId}`);
        } catch (error) {
          console.error(`❌ Failed to cancel appointment ${appointment.appointmentId}:`, error);
        }
      }
      
      console.log(`🎯 Auto-cancellation completed: ${cancelledCount} appointments cancelled`);
      return cancelledCount;

    } catch (error) {
      console.error('Auto-cancel appointments error:', error);
      throw error;
    }
  }

  // Manual trigger for testing
  async runManualCheck() {
    console.log('Running manual appointment check...');
    await this.autoFinishAppointments();
    await this.updateQueuePositions();
    await this.updateEstimatedWaitTimes();
    console.log('Manual check completed');
  }
}

// Singleton instance
const appointmentScheduler = new AppointmentScheduler();

module.exports = appointmentScheduler;
