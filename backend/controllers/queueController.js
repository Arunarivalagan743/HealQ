const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Get doctor's queue for today
const getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    console.log('getDoctorQueue called with:', { doctorId, userId: req.user.id });

    // Use today's date if not provided
    const queueDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queueDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queueDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get doctor profile to verify access
    // If doctorId is 'undefined', 'current' or missing, try to find by userId
    let doctorProfile;
    if (doctorId && doctorId !== 'undefined' && doctorId !== 'current' && doctorId.length === 24) {
      // Valid ObjectId format, try to find by doctorId or userId
      doctorProfile = await DoctorProfile.findOne({
        $or: [
          { _id: doctorId },
          { userId: req.user.id }
        ]
      });
    } else {
      // If no valid doctorId, find by current user's ID
      doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    }

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get queue appointments for the day
    const queueAppointments = await Appointment.find({
      doctorId: doctorProfile._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['requested', 'approved', 'in_queue', 'processing'] }
    })
    .sort({ queuePosition: 1 })
    .populate('patientId', 'name phoneNumber bloodGroup age')
    .select('appointmentId patientName patientPhone queueToken queuePosition queueStatus timeSlot reasonForVisit symptoms estimatedWaitTime calledAt status');

    // Calculate estimated wait times
    const avgConsultationTime = 15; // minutes per patient
    let cumulativeWaitTime = 0;

    const queueWithWaitTimes = queueAppointments.map((appointment, index) => {
      if (appointment.queueStatus === 'Waiting') {
        appointment.estimatedWaitTime = cumulativeWaitTime;
        cumulativeWaitTime += avgConsultationTime;
      }
      
      return {
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        queueToken: appointment.queueToken,
        queuePosition: appointment.queuePosition,
        queueStatus: appointment.queueStatus,
        timeSlot: appointment.timeSlot,
        reasonForVisit: appointment.reasonForVisit,
        symptoms: appointment.symptoms,
        estimatedWaitTime: appointment.estimatedWaitTime,
        calledAt: appointment.calledAt,
        status: appointment.status,
        patientInfo: appointment.patientId
      };
    });

    // Get queue statistics
    const queueStats = {
      totalPatients: queueAppointments.length,
      waiting: queueAppointments.filter(a => a.queueStatus === 'Waiting').length,
      inProgress: queueAppointments.filter(a => a.queueStatus === 'In-Progress').length,
      completed: queueAppointments.filter(a => a.queueStatus === 'Completed').length,
      averageWaitTime: avgConsultationTime,
      currentToken: queueAppointments.find(a => a.queueStatus === 'In-Progress')?.queueToken || 0
    };

    res.json({
      success: true,
      data: {
        date: queueDate.toISOString().split('T')[0],
        doctor: {
          name: doctorProfile.name,
          specialization: doctorProfile.specialization
        },
        queue: queueWithWaitTimes,
        stats: queueStats
      }
    });

  } catch (error) {
    console.error('Get doctor queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue',
      error: error.message
    });
  }
};

// Get patient's queue position
const getPatientQueuePosition = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
      $or: [
        { _id: appointmentId },
        { appointmentId: appointmentId }
      ]
    })
    .populate('doctorId', 'name specialization clinicAddress')
    .populate('patientId', 'name phoneNumber');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify patient access
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
    if (!patientProfile || appointment.patientId._id.toString() !== patientProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get queue position and ahead count
    const startOfDay = new Date(appointment.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(appointment.appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const aheadCount = await Appointment.countDocuments({
      doctorId: appointment.doctorId._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      queuePosition: { $lt: appointment.queuePosition },
      status: { $in: ['Scheduled', 'Confirmed', 'In-Progress'] },
      queueStatus: { $in: ['Waiting', 'In-Progress'] }
    });

    // Calculate estimated wait time
    const avgConsultationTime = 15; // minutes
    const estimatedWaitTime = aheadCount * avgConsultationTime;

    res.json({
      success: true,
      data: {
        appointmentId: appointment.appointmentId,
        queueToken: appointment.queueToken,
        queuePosition: appointment.queuePosition,
        queueStatus: appointment.queueStatus,
        patientsAhead: aheadCount,
        estimatedWaitTime: estimatedWaitTime,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        doctor: appointment.doctorId,
        status: appointment.status,
        calledAt: appointment.calledAt
      }
    });

  } catch (error) {
    console.error('Get patient queue position error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue position',
      error: error.message
    });
  }
};

// Call next patient in queue
const callNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Verify doctor access
    const doctorProfile = await DoctorProfile.findOne({
      $or: [
        { _id: doctorId },
        { userId: req.user.id }
      ]
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get today's date
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Mark current patient as completed if any
    await Appointment.updateMany({
      doctorId: doctorProfile._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      queueStatus: 'In-Progress'
    }, {
      queueStatus: 'Completed',
      status: 'Completed'
    });

    // Find next waiting patient
    const nextPatient = await Appointment.findOne({
      doctorId: doctorProfile._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      queueStatus: 'Waiting',
      status: { $in: ['Scheduled', 'Confirmed'] }
    })
    .sort({ queuePosition: 1 })
    .populate('patientId', 'name phoneNumber');

    if (!nextPatient) {
      return res.json({
        success: true,
        message: 'No more patients in queue',
        data: null
      });
    }

    // Update patient status
    nextPatient.queueStatus = 'Called';
    nextPatient.status = 'In-Progress';
    nextPatient.calledAt = new Date();
    await nextPatient.save();

    // Send real-time notification to patient
    try {
      const patientUser = await User.findById(nextPatient.patientId.userId);
      if (patientUser) {
        notificationService.sendPatientCalledNotification(patientUser._id.toString(), {
          appointmentId: nextPatient.appointmentId,
          queueToken: nextPatient.queueToken,
          doctorName: nextPatient.doctorName,
          calledAt: nextPatient.calledAt
        });
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Next patient called successfully',
      data: {
        appointmentId: nextPatient.appointmentId,
        patientName: nextPatient.patientName,
        queueToken: nextPatient.queueToken,
        queuePosition: nextPatient.queuePosition,
        timeSlot: nextPatient.timeSlot,
        reasonForVisit: nextPatient.reasonForVisit,
        symptoms: nextPatient.symptoms,
        calledAt: nextPatient.calledAt,
        patientInfo: nextPatient.patientId
      }
    });

  } catch (error) {
    console.error('Call next patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call next patient',
      error: error.message
    });
  }
};

// Mark patient as completed
const markPatientCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
      $or: [
        { _id: appointmentId },
        { appointmentId: appointmentId }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment status
    appointment.queueStatus = 'Completed';
    appointment.status = 'Completed';
    await appointment.save();

    res.json({
      success: true,
      message: 'Patient marked as completed',
      data: {
        appointmentId: appointment.appointmentId,
        queueToken: appointment.queueToken,
        status: appointment.status,
        queueStatus: appointment.queueStatus
      }
    });

  } catch (error) {
    console.error('Mark patient completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark patient as completed',
      error: error.message
    });
  }
};

module.exports = {
  getDoctorQueue,
  getPatientQueuePosition,
  callNextPatient,
  markPatientCompleted
};
