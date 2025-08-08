const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');

// Book appointment
const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      timeSlot,
      consultationType,
      reasonForVisit,
      symptoms
    } = req.body;

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please create your profile first.'
      });
    }

    if (!patientProfile.profileCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before booking appointments.'
      });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({
      $or: [
        { _id: doctorId },
        { doctorId: doctorId }
      ],
      isActive: true,
      isVerified: true
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not available.'
      });
    }

    // Check if consultation type is supported by doctor
    if (consultationType === 'Online' && doctorProfile.consultationMode === 'In-person') {
      return res.status(400).json({
        success: false,
        message: 'Doctor does not offer online consultations.'
      });
    }

    if (consultationType === 'In-person' && doctorProfile.consultationMode === 'Online') {
      return res.status(400).json({
        success: false,
        message: 'Doctor only offers online consultations.'
      });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    const now = new Date();
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future.'
      });
    }

    // Check if doctor is available on the requested day
    const dayName = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctorProfile.isAvailableOnDay(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayName}. Available days: ${doctorProfile.availableDaysString}`
      });
    }

    // Check for time slot conflicts
    const conflicts = await Appointment.findConflicts(doctorProfile._id, appointmentDate, timeSlot);
    if (conflicts.length >= doctorProfile.maxAppointmentsPerSlot) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available. Please choose a different time.'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patientProfile._id,
      patientName: patientProfile.name,
      patientEmail: patientProfile.email,
      patientPhone: patientProfile.phoneNumber,
      doctorId: doctorProfile._id,
      doctorName: doctorProfile.name,
      doctorSpecialization: doctorProfile.specialization,
      appointmentDate,
      timeSlot,
      consultationType,
      consultationFee: doctorProfile.consultationFee,
      reasonForVisit,
      symptoms: symptoms || []
    });

    await appointment.save();

    // Update statistics
    patientProfile.totalAppointments += 1;
    await patientProfile.save();

    doctorProfile.totalAppointments += 1;
    await doctorProfile.save();

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
};

// Get patient appointments
const getPatientAppointments = async (req, res) => {
  try {
    const {
      status,
      upcoming,
      page = 1,
      limit = 10
    } = req.query;

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Build filter
    const filter = {
      patientId: patientProfile._id
    };

    if (status) {
      filter.status = status;
    }

    if (upcoming === 'true') {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = { $in: ['Scheduled', 'Confirmed'] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('doctorId', 'name specialization consultationFee clinicAddress');

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Get doctor appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const {
      status,
      date,
      upcoming,
      page = 1,
      limit = 10
    } = req.query;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Build filter
    const filter = {
      doctorId: doctorProfile._id
    };

    if (status) {
      filter.status = status;
    }

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (upcoming === 'true') {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = { $in: ['Scheduled', 'Confirmed'] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: 1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patientId', 'name email phoneNumber age gender bloodGroup');

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Get single appointment details
const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
      $or: [
        { _id: appointmentId },
        { appointmentId: appointmentId }
      ]
    })
    .populate('patientId', 'name email phoneNumber age gender bloodGroup address emergencyContact')
    .populate('doctorId', 'name specialization consultationFee clinicAddress');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has access to this appointment
    const userRole = req.user.role;
    if (userRole === 'Patient') {
      const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
      if (!patientProfile || appointment.patientId._id.toString() !== patientProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (userRole === 'Doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (!doctorProfile || appointment.doctorId._id.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    // Admin can see all appointments

    res.json({
      success: true,
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment details',
      error: error.message
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

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

    // Check if user can cancel this appointment
    const userRole = req.user.role;
    let canCancel = false;

    if (userRole === 'Admin') {
      canCancel = true;
    } else if (userRole === 'Patient') {
      const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
      canCancel = patientProfile && appointment.patientId.toString() === patientProfile._id.toString();
    } else if (userRole === 'Doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
      canCancel = doctorProfile && appointment.doctorId.toString() === doctorProfile._id.toString();
    }

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled. Cancellation is only allowed 24+ hours before the appointment.'
      });
    }

    // Cancel appointment
    await appointment.cancelAppointment(userRole, reason);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

// Update appointment status (for doctors and admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, medicalRecord } = req.body;

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

    // Check permissions
    const userRole = req.user.role;
    if (userRole === 'Patient') {
      return res.status(403).json({
        success: false,
        message: 'Patients cannot update appointment status'
      });
    }

    if (userRole === 'Doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Update appointment
    appointment.status = status;
    if (medicalRecord) {
      appointment.medicalRecord = medicalRecord;
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

// Get all appointments (for admin)
const getAllAppointments = async (req, res) => {
  try {
    const {
      status,
      consultationType,
      dateFrom,
      dateTo,
      doctorId,
      patientId,
      page = 1,
      limit = 10,
      sortBy = 'appointmentDate',
      sortOrder = 'desc'
    } = req.query;

    // Only allow admin access
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (consultationType) filter.consultationType = consultationType;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;

    if (dateFrom || dateTo) {
      filter.appointmentDate = {};
      if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.appointmentDate.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get appointments
    const appointments = await Appointment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patientId', 'name email phoneNumber patientId')
      .populate('doctorId', 'name specialization doctorId');

    const total = await Appointment.countDocuments(filter);

    // Get statistics
    const stats = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentDetails,
  cancelAppointment,
  updateAppointmentStatus,
  getAllAppointments
};
