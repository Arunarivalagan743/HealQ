const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Book appointment
const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      timeSlot,
      consultationType,
      appointmentType,
      reasonForVisit,
      symptoms,
      notes,
      preferredCommunication
    } = req.body;

    // Handle both appointmentTime (string) and timeSlot (object) formats
    let finalTimeSlot;
    if (appointmentTime) {
      // Convert appointmentTime string to timeSlot object
      const startTime = appointmentTime;
      const endHour = parseInt(startTime.split(':')[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${startTime.split(':')[1]}`;
      finalTimeSlot = { start: startTime, end: endTime };
    } else if (timeSlot) {
      finalTimeSlot = timeSlot;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Appointment time is required'
      });
    }

    // Map appointmentType to consultationType - Always In-person for offline system
    const finalConsultationType = 'In-person';

    // Set default reason for visit
    const finalReasonForVisit = reasonForVisit || symptoms || 'General consultation';

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

    // Doctor profile validation for offline appointments only
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

    // All appointments are offline/in-person only
    // Remove online consultation restrictions
    if (doctorProfile.consultationMode === 'Online') {
      return res.status(400).json({
        success: false,
        message: 'This system only supports offline consultations. Please contact the doctor directly for online consultations.'
      });
    }

    // Check if appointment date is in the future
    // Parse appointment date properly to avoid timezone issues
    const appointmentDateTime = new Date(appointmentDate + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log('Date validation:', {
      appointmentDate,
      appointmentDateTime: appointmentDateTime.toISOString(),
      now: now.toISOString(),
      today: today.toISOString(),
      comparison: appointmentDateTime >= today
    });
    
    if (appointmentDateTime < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be today or in the future.'
      });
    }
    
    // If the appointment is for today, check if the time slot has already passed
    if (appointmentDateTime.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [hours, minutes] = finalTimeSlot.start.split(':').map(Number);
      
      console.log('Time slot validation for today:', {
        timeSlot: finalTimeSlot.start,
        currentTime: `${currentHour}:${currentMinute}`,
        slotHours: hours,
        slotMinutes: minutes,
        isPast: (hours < currentHour || (hours === currentHour && minutes <= currentMinute))
      });
      
      if (hours < currentHour || (hours === currentHour && minutes <= currentMinute)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book a time slot that has already passed. Please select a future time slot.'
        });
      }
    }

    // Check if doctor is available on the requested day
    const dayName = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctorProfile.isAvailableOnDay(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayName}. Available days: ${doctorProfile.availableDaysString}`
      });
    }

    // Check for time slot conflicts - only approved appointments block slots
    const conflicts = await Appointment.find({
      doctorId: doctorProfile._id,
      appointmentDate: appointmentDate,
      'timeSlot.start': finalTimeSlot.start,
      status: 'approved' // Only approved appointments block the slot
    });
    
    if (conflicts.length >= (doctorProfile.maxAppointmentsPerSlot || 1)) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available. Please choose a different time.'
      });
    }

    // Generate queue token number for the day and set tokenNumber for same-day appointments
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointmentsToday = await Appointment.countDocuments({
      doctorId: doctorProfile._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['queued', 'approved'] }
    });
    
    const queueTokenNumber = appointmentsToday + 1;
    
    // Check if appointment is for today to assign token number
    const todayDate = new Date().setHours(0, 0, 0, 0);
    const appointmentDateOnly = new Date(appointmentDate).setHours(0, 0, 0, 0);
    const isToday = appointmentDateOnly === todayDate;
    
    let tokenNumber = null;
    if (isToday) {
      // Find the highest token number for this doctor today
      const lastTokenAppointment = await Appointment.find({
        doctorId: doctorProfile._id,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        tokenNumber: { $ne: null }
      }).sort({ tokenNumber: -1 }).limit(1);
      
      tokenNumber = lastTokenAppointment.length > 0 ? lastTokenAppointment[0].tokenNumber + 1 : 1;
    }

    // Create appointment with 'queued' status (waiting for doctor approval)
    const appointment = new Appointment({
      appointmentId: `APT${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      patientId: patientProfile._id,
      patientName: patientProfile.name,
      patientEmail: patientProfile.email,
      patientPhone: patientProfile.phoneNumber,
      doctorId: doctorProfile._id,
      doctorName: doctorProfile.name,
      doctorSpecialization: doctorProfile.specialization,
      appointmentDate,
      timeSlot: finalTimeSlot,
      consultationType: finalConsultationType,
      consultationFee: doctorProfile.consultationFee,
      reasonForVisit: finalReasonForVisit,
      symptoms: Array.isArray(symptoms) ? symptoms : (symptoms ? [symptoms] : []),
      queueToken: queueTokenNumber,
      queuePosition: queueTokenNumber,
      tokenNumber: tokenNumber, // Only set for same-day appointments
      status: 'queued', // Initial status for doctor approval
      notes: notes || ''
    });

    await appointment.save();

    // Update statistics
    patientProfile.totalAppointments += 1;
    await patientProfile.save();

    doctorProfile.totalAppointments += 1;
    await doctorProfile.save();

    // Send real-time notification to doctor
    try {
      const doctorUser = await User.findById(doctorProfile.userId);
      if (doctorUser) {
        notificationService.sendAppointmentBookedNotification(doctorUser._id.toString(), {
          appointmentId: appointment.appointmentId,
          patientName: appointment.patientName,
          queueToken: appointment.queueToken,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot
        });
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the appointment booking if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully. Waiting for doctor approval.',
      data: {
        appointment: {
          id: appointment._id,
          appointmentId: appointment.appointmentId,
          patientName: appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot,
          queueToken: appointment.queueToken,
          queuePosition: appointment.queuePosition,
          tokenNumber: appointment.tokenNumber,
          isToday: isToday,
          status: appointment.status,
          consultationType: appointment.consultationType,
          consultationFee: appointment.consultationFee
        }
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
    console.log('getPatientAppointments called with query:', req.query);
    console.log('User ID:', req.user.id);
    
    const {
      status,
      upcoming,
      page = 1,
      limit = 10
    } = req.query;

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
    console.log('Patient profile found:', patientProfile ? `ID: ${patientProfile._id}, Name: ${patientProfile.name}` : 'NOT FOUND');
    
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
      filter.status = { $in: ['queued', 'approved'] };
    }

    console.log('Patient appointment filter:', filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('doctorId', 'name specialization consultationFee clinicAddress');

    const total = await Appointment.countDocuments(filter);
    
    console.log(`Patient appointments query result: ${appointments.length} found, total: ${total}`);
    if (appointments.length > 0) {
      console.log('First appointment:', {
        id: appointments[0].appointmentId,
        status: appointments[0].status,
        date: appointments[0].appointmentDate
      });
    }

    // Map appointments to include frontend-compatible fields
    const mappedAppointments = appointments.map(appointment => ({
      ...appointment.toObject(),
      appointmentTime: appointment.timeSlot ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}` : null,
      appointmentType: appointment.consultationType || 'In-person',
      preferredCommunication: appointment.consultationType || 'In-person'
    }));

    res.json({
      success: true,
      data: {
        appointments: mappedAppointments,
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
    console.log('getDoctorAppointments called with query:', req.query);
    console.log('User ID:', req.user.id);
    
    const {
      status,
      date,
      upcoming,
      page = 1,
      limit = 10
    } = req.query;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    console.log('Doctor profile found:', doctorProfile ? `ID: ${doctorProfile._id}, Name: ${doctorProfile.name}` : 'NOT FOUND');
    
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
      // Handle status as comma-separated string
      if (typeof status === 'string' && status.includes(',')) {
        filter.status = { $in: status.split(',') };
        console.log('Status filter converted to array:', filter.status);
      } else {
        filter.status = status;
      }
      console.log('Final status filter:', filter.status);
    }

    if (date) {
      console.log('Filtering by date:', date);
      // Create a new Date object to avoid modifying the original date variable
      const selectedDate = new Date(date);
      
      // Fix: Normalize the date string to YYYY-MM-DD format to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log('Normalized date string:', dateString);
      
      // Create UTC-aligned start/end of day to ensure proper date matching
      const startOfDay = new Date(dateString + 'T00:00:00.000Z');
      const endOfDay = new Date(dateString + 'T23:59:59.999Z');
      
      console.log('Date range filter:', { 
        startOfDay: startOfDay.toISOString(), 
        endOfDay: endOfDay.toISOString() 
      });
      
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (upcoming === 'true') {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = { $in: ['queued', 'approved'] };
    }

    console.log('Doctor appointment filter:', filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patientId', 'name email phoneNumber age gender bloodGroup');

    const total = await Appointment.countDocuments(filter);
    
    console.log(`Doctor appointments query result: ${appointments.length} found, total: ${total}`);
    if (appointments.length > 0) {
      console.log('First appointment:', {
        id: appointments[0].appointmentId,
        status: appointments[0].status,
        date: appointments[0].appointmentDate,
        patient: appointments[0].patientName
      });
    }

    // Sort appointments for doctor dashboard
    // Priority: 'queued' → 'approved' → 'completed' → 'cancelled' → 'rejected'
    const sortedAppointments = appointments.sort((a, b) => {
      const order = { queued: 1, approved: 2, completed: 3, cancelled: 4, rejected: 5 };
      
      if (a.status === b.status) {
        if (a.status === 'queued' && a.tokenNumber && b.tokenNumber) {
          // Sort queued appointments by token number for same day
          return a.tokenNumber - b.tokenNumber;
        }
        if (a.status === 'approved') {
          // Sort approved appointments by time slot
          const aTime = new Date(`1970-01-01T${a.timeSlot.start}:00`);
          const bTime = new Date(`1970-01-01T${b.timeSlot.start}:00`);
          return aTime - bTime;
        }
        // Default sort by appointment date and time
        const dateComparison = new Date(a.appointmentDate) - new Date(b.appointmentDate);
        if (dateComparison === 0 && a.timeSlot && b.timeSlot) {
          const aTime = new Date(`1970-01-01T${a.timeSlot.start}:00`);
          const bTime = new Date(`1970-01-01T${b.timeSlot.start}:00`);
          return aTime - bTime;
        }
        return dateComparison;
      }
      
      return order[a.status] - order[b.status];
    });

    // Map appointments to include frontend-compatible fields
    const mappedAppointments = sortedAppointments.map(appointment => ({
      ...appointment.toObject(),
      appointmentTime: appointment.timeSlot ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}` : null,
      appointmentType: appointment.consultationType || 'In-person',
      preferredCommunication: appointment.consultationType || 'In-person',
      isToday: appointment.tokenNumber ? true : false // Indicates if appointment has token (same day)
    }));

    res.json({
      success: true,
      data: {
        appointments: mappedAppointments,
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

// Get patient appointment history (for doctors to view patient's past appointments)
const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Verify that the requesting user is a doctor
    if (req.user.role !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can view patient history.'
      });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Build filter for patient's appointments with this doctor
    const filter = {
      patientId: patientId,
      doctorId: doctorProfile._id
    };

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get patient's appointment history
    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1, createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patientId', 'name email phoneNumber age gender bloodGroup')
      .populate('doctorId', 'name specialization');

    const total = await Appointment.countDocuments(filter);

    // Get patient profile for additional information
    const patientProfile = await PatientProfile.findById(patientId);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Map appointments to include frontend-compatible fields
    const mappedAppointments = appointments.map(appointment => ({
      ...appointment.toObject(),
      appointmentTime: appointment.timeSlot ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}` : null,
      appointmentType: appointment.consultationType || 'In-person',
      preferredCommunication: appointment.consultationType || 'In-person'
    }));

    res.json({
      success: true,
      data: {
        patient: {
          id: patientProfile._id,
          name: patientProfile.name,
          email: patientProfile.email,
          phoneNumber: patientProfile.phoneNumber,
          age: patientProfile.age,
          gender: patientProfile.gender,
          bloodGroup: patientProfile.bloodGroup
        },
        appointments: mappedAppointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalVisits: total,
          completedVisits: mappedAppointments.filter(apt => apt.status === 'finished').length,
          cancelledVisits: mappedAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'rejected').length,
          lastVisit: mappedAppointments.length > 0 ? mappedAppointments[0].appointmentDate : null
        }
      }
    });

  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient history',
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
        appointment: {
          ...appointment.toObject(),
          // Add frontend-compatible fields
          appointmentTime: appointment.timeSlot ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}` : null,
          appointmentType: appointment.consultationType || 'In-person',
          preferredCommunication: appointment.consultationType || 'In-person'
        }
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

// Approve appointment (doctor action)
const approveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;

    console.log('Approving appointment:', appointmentId, 'by user:', req.user.id);

    // Find appointment
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

    console.log('Found appointment with doctorId:', appointment.doctorId);

    // Verify doctor authorization
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      console.log('Doctor profile not found for user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    console.log('Found doctor profile with _id:', doctorProfile._id);

    // Check if this doctor owns this appointment
    if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      console.log('Authorization failed. Appointment doctorId:', appointment.doctorId.toString(), 'Doctor profile _id:', doctorProfile._id.toString());
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only approve your own appointments'
      });
    }

    // Check if appointment is in correct status for approval
    console.log(`Current appointment status: ${appointment.status}`);
    
    // Accept any status except those that are clearly invalid for approval
    const invalidStatuses = ['approved', 'rejected', 'cancelled', 'completed', 'finished'];
    
    if (invalidStatuses.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve appointment with status: ${appointment.status}`
      });
    }

    // Check if the time slot has already passed
    const appointmentStartTime = appointment.timeSlot.start;
    const [hours, minutes] = appointmentStartTime.split(':').map(Number);
    
    const appointmentDateTime = new Date(appointment.appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    console.log('Time validation:', {
      appointmentTime: appointmentDateTime.toISOString(),
      currentTime: now.toISOString(),
      isPast: appointmentDateTime < now
    });
    
    if (appointmentDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve an appointment for a time slot that has already passed.'
      });
    }
    
    // Check for time slot conflicts before approving
    const conflicts = await Appointment.find({
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      'timeSlot.start': appointment.timeSlot.start,
      status: 'approved',
      _id: { $ne: appointment._id }
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is no longer available. Another appointment has been approved for this time.'
      });
    }

    // Update appointment status to approved (this blocks the time slot)
    console.log(`Updating appointment status from ${appointment.status} to 'approved'`);
    appointment.status = 'approved';
    
    // Set queueStatus to 'waiting' (lowercase matches the schema enum)
    if (!appointment.queueStatus) {
      appointment.queueStatus = 'waiting';
    } else {
      console.log(`Current queueStatus is ${appointment.queueStatus}, updating to 'waiting'`);
      appointment.queueStatus = 'waiting';
    }
    
    // Assign queue token if not already assigned
    if (!appointment.queueToken) {
      // Generate a simple token based on current date
      const today = new Date();
      const tokenDate = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      appointment.queueToken = Math.floor(Math.random() * 100) + 1; // Simple number from 1-100
      console.log(`Assigned queue token: ${appointment.queueToken}`);
    }
    
    if (notes) {
      appointment.notes = appointment.notes ? `${appointment.notes}\n\nDoctor Notes: ${notes}` : `Doctor Notes: ${notes}`;
    }

    console.log('Saving appointment with updated status:', {
      id: appointment._id,
      status: appointment.status,
      queueStatus: appointment.queueStatus,
      queueToken: appointment.queueToken
    });
    
    try {
      await appointment.save();
      console.log('Appointment saved successfully with new status:', appointment.status);
    } catch (saveError) {
      console.error('Error saving appointment:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error updating appointment status'
      });
    }

    // Send notification to patient
    try {
      const patientProfile = await PatientProfile.findById(appointment.patientId);
      if (patientProfile) {
        const patientUser = await User.findById(patientProfile.userId);
        if (patientUser) {
          notificationService.sendAppointmentApprovedNotification(patientUser._id.toString(), {
            appointmentId: appointment.appointmentId,
            doctorName: appointment.doctorName,
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot,
            queueToken: appointment.queueToken
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Appointment approved successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Approve appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve appointment',
      error: error.message
    });
  }
};

// Reject appointment (doctor action)
const rejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    // Find appointment
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

    // Verify doctor authorization
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Check if this doctor owns this appointment
    if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment is in correct status for rejection
    if (!['queued', 'requested'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject appointment with status: ${appointment.status}`
      });
    }

    // Update appointment status to rejected
    appointment.status = 'rejected';
    appointment.cancellationReason = reason || 'Rejected by doctor';
    appointment.cancelledBy = 'doctor';
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Send notification to patient
    try {
      const patientProfile = await PatientProfile.findById(appointment.patientId);
      if (patientProfile) {
        const patientUser = await User.findById(patientProfile.userId);
        if (patientUser) {
          notificationService.sendAppointmentRejectedNotification(patientUser._id.toString(), {
            appointmentId: appointment.appointmentId,
            doctorName: appointment.doctorName,
            reason: appointment.cancellationReason
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Appointment rejected successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject appointment',
      error: error.message
    });
  }
};

// Move appointment to in_queue status
const moveToQueue = async (req, res) => {
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

    // Verify authorization (doctor, admin, or patient)
    const userRole = req.user.role;
    if (userRole === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if appointment is approved
    if (appointment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved appointments can be moved to queue'
      });
    }

    // Update queue status to indicate patient is now in the active queue
    // Status remains 'approved' but queueStatus changes to 'waiting'
    appointment.queueStatus = 'waiting';

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment moved to queue successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Move to queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move appointment to queue',
      error: error.message
    });
  }
};

// Start processing appointment
const startProcessing = async (req, res) => {
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

    // Verify doctor authorization
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment is in queue
    if (appointment.status !== 'in_queue') {
      return res.status(400).json({
        success: false,
        message: 'Only queued appointments can be started'
      });
    }

    // Update status to processing
    appointment.status = 'processing';
    appointment.queueStatus = 'in_progress';
    appointment.calledAt = new Date();

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment processing started',
      data: { appointment }
    });

  } catch (error) {
    console.error('Start processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start processing appointment',
      error: error.message
    });
  }
};

// Complete appointment (doctor action)
const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { medicalRecord } = req.body;

    // Find appointment
    const appointment = await Appointment.findOne({
      $or: [
        { _id: appointmentId },
        { appointmentId: appointmentId }
      ]
    }).populate('patientId', 'userId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify authorization (doctor or patient)
    let isAuthorized = false;
    let userType = '';
    
    // Check if user is the doctor
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (doctorProfile && appointment.doctorId.toString() === doctorProfile._id.toString()) {
      isAuthorized = true;
      userType = 'doctor';
    }
    
    // Check if user is the patient
    if (!isAuthorized) {
      const patientProfile = await PatientProfile.findOne({ userId: req.user.id });
      if (patientProfile && appointment.patientId.toString() === patientProfile._id.toString()) {
        isAuthorized = true;
        userType = 'patient';
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only complete your own appointments'
      });
    }

    // Allow completing appointments in queued status as well (auto-approve and complete)
    console.log(`Current appointment status: ${appointment.status}`);
    
    // For queued appointments, approve them first
    if (appointment.status === 'queued') {
      console.log('Auto-approving appointment before completing');
      appointment.status = 'approved';
      // Generate a queue token if needed
      if (!appointment.queueToken) {
        appointment.queueToken = Math.floor(Math.random() * 100) + 1;
      }
    }
    
    // Additional validation - make sure statuses are valid
    if (!['approved', 'processing', 'queued'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete appointment with status: ${appointment.status}`
      });
    }

    try {
      // Update appointment status to completed
      appointment.status = 'completed';
      
      // Make sure queueStatus is valid based on enum
      if (appointment.queueStatus) {
        console.log(`Current queueStatus is ${appointment.queueStatus}, updating to 'completed'`);
        appointment.queueStatus = 'completed';
      }
      
      appointment.completedAt = new Date();
      console.log('Setting appointment as completed:', {
        id: appointment._id,
        status: appointment.status,
        queueStatus: appointment.queueStatus,
        completedAt: appointment.completedAt
      });
    } catch (err) {
      console.error('Error updating appointment properties:', err);
      return res.status(400).json({
        success: false,
        message: `Error updating appointment: ${err.message}`
      });
    }

    // Add medical record if provided
    if (medicalRecord) {
      try {
        // Check if appointment.medicalRecord exists before calling toObject()
        const existingRecord = appointment.medicalRecord ? 
          appointment.medicalRecord.toObject() : {};
          
        appointment.medicalRecord = {
          ...existingRecord,
          ...medicalRecord
        };
      } catch (err) {
        console.error('Error updating medical record:', err);
        // If there's an error with medical record, set it directly
        appointment.medicalRecord = medicalRecord;
      }
    }

    // Save the appointment with exception handling
    try {
      await appointment.save();
      console.log('Appointment saved successfully');
    } catch (saveError) {
      console.error('Error saving appointment:', saveError);
      return res.status(500).json({
        success: false,
        message: `Failed to save appointment: ${saveError.message}`
      });
    }

    // Update patient statistics
    try {
      const patientProfile = await PatientProfile.findById(appointment.patientId);
      if (patientProfile) {
        patientProfile.completedAppointments += 1;
        patientProfile.lastVisit = new Date();
        await patientProfile.save();
      }
    } catch (statsError) {
      console.error('Failed to update patient statistics:', statsError);
      // Don't fail the completion if stats update fails
    }

    // Send notification to patient
    try {
      const patientProfile = await PatientProfile.findById(appointment.patientId);
      if (patientProfile) {
        const patientUser = await User.findById(patientProfile.userId);
        if (patientUser) {
          notificationService.sendAppointmentCompletedNotification(patientUser._id.toString(), {
            appointmentId: appointment.appointmentId,
            doctorName: appointment.doctorName,
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send completion notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: error.message
    });
  }
};

// Finish appointment
const finishAppointment = async (req, res) => {
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

    // Verify doctor authorization
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment is processing
    if (appointment.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Only processing appointments can be finished'
      });
    }

    // Update status to finished
    appointment.status = 'finished';
    appointment.queueStatus = 'completed';
    appointment.completedAt = new Date(); // Set completion time

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment finished successfully. You can now add prescription.',
      data: { appointment }
    });

  } catch (error) {
    console.error('Finish appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finish appointment',
      error: error.message
    });
  }
};

// Add prescription to finished appointment
const addPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { 
      diagnosis, 
      medications, // From frontend as medications
      labTests, 
      followUp, 
      doctorNotes,
      treatmentDuration,
      treatmentDescription
    } = req.body;

    const appointment = await Appointment.findOne({
      $or: [
        { _id: appointmentId },
        { appointmentId: appointmentId }
      ]
    }).populate('patientId', 'email name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor authorization
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment is finished or completed
    if (appointment.status !== 'finished' && appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Prescription can only be added to finished or completed appointments'
      });
    }

    // Add or update medical record
    // First, check if medical record exists and preserve the prescriptionSentToPatient status if present
    const existingPrescriptionSent = appointment.medicalRecord ? 
      appointment.medicalRecord.prescriptionSentToPatient : false;
    
    // Debug incoming data
    console.log('Adding/updating prescription data:', {
      appointmentId: appointmentId,
      diagnosis: diagnosis,
      medicationsFromFrontend: medications,
      labTests: labTests,
      existingPrescriptionSent: existingPrescriptionSent,
      appointmentStatus: appointment.status
    });
    
    appointment.medicalRecord = {
      diagnosis: diagnosis || '',
      prescription: medications || [], // Map medications to prescription in the DB
      labTests: labTests || [],
      followUp: followUp || { required: false },
      doctorNotes: doctorNotes || '',
      treatmentDuration: treatmentDuration || null,
      treatmentDescription: treatmentDescription || '',
      prescriptionSentToPatient: existingPrescriptionSent // Preserve existing status
    };

    await appointment.save();

    // Send prescription to patient via email
    try {
      if (appointment.patientId && appointment.patientId.email) {
        const emailService = require('../services/emailService');
        await emailService.sendPrescriptionEmail(
          appointment.patientId.email,
          appointment.patientId.name || appointment.patientName,
          {
            appointmentId: appointment.appointmentId,
            doctorName: appointment.doctorName,
            appointmentDate: appointment.appointmentDate,
            diagnosis: appointment.medicalRecord.diagnosis,
            prescription: appointment.medicalRecord.prescription,
            labTests: appointment.medicalRecord.labTests,
            followUp: appointment.medicalRecord.followUp,
            treatmentDuration: appointment.medicalRecord.treatmentDuration,
            treatmentDescription: appointment.medicalRecord.treatmentDescription,
            doctorNotes: appointment.medicalRecord.doctorNotes
          }
        );
        
        appointment.medicalRecord.prescriptionSentToPatient = true;
        appointment.medicalRecord.prescriptionSentAt = new Date();
        await appointment.save();
      }
    } catch (emailError) {
      console.error('Failed to send prescription email:', emailError);
      // Don't fail the prescription addition if email fails
    }

    res.json({
      success: true,
      message: 'Prescription added successfully and sent to patient',
      data: { 
        appointment,
        prescriptionSent: appointment.medicalRecord.prescriptionSentToPatient
      }
    });

  } catch (error) {
    console.error('Add prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add prescription',
      error: error.message
    });
  }
};

// Auto-finish appointments (for scheduled tasks)
const autoFinishAppointments = async (req, res) => {
  try {
    const now = new Date();
    
    // Find appointments that should be automatically finished
    // (processing appointments where time slot has passed)
    const appointmentsToFinish = await Appointment.find({
      status: 'processing',
      appointmentDate: { $lt: now }
    });

    let finishedCount = 0;

    for (const appointment of appointmentsToFinish) {
      // Check if time slot has actually passed
      const appointmentEndTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.timeSlot.end.split(':');
      appointmentEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (now > appointmentEndTime) {
        appointment.status = 'finished';
        appointment.queueStatus = 'completed';
        await appointment.save();
        finishedCount++;
      }
    }

    res.json({
      success: true,
      message: `Auto-finished ${finishedCount} appointments`,
      data: { finishedCount }
    });

  } catch (error) {
    console.error('Auto-finish appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-finish appointments',
      error: error.message
    });
  }
};

// Auto-cancel non-approved appointments at end of day
const autoCancelNonApprovedAppointments = async (req, res) => {
  try {
    console.log('🔄 Starting auto-cancellation of non-approved appointments...');
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    // Find appointments for today that are still pending approval (queued/requested status)
    const appointmentsToCancel = await Appointment.find({
      appointmentDate: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: ['requested', 'queued'] }
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
    
    if (res) {
      res.json({
        success: true,
        message: `Auto-cancelled ${cancelledCount} non-approved appointments`,
        data: { cancelledCount }
      });
    }
    
    return { success: true, cancelledCount };

  } catch (error) {
    console.error('Auto-cancel appointments error:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Failed to auto-cancel appointments',
        error: error.message
      });
    }
    return { success: false, error: error.message };
  }
};

// Auto-complete appointments with actual completion time
const autoCompleteAppointmentsWithTime = async (req, res) => {
  try {
    console.log('🔄 Starting auto-completion of finished appointments with completion time...');
    
    // Find appointments that are finished but don't have completedAt timestamp
    const appointmentsToComplete = await Appointment.find({
      status: 'finished',
      completedAt: { $exists: false }
    });
    
    console.log(`Found ${appointmentsToComplete.length} finished appointments to add completion time`);
    
    let completedCount = 0;
    for (const appointment of appointmentsToComplete) {
      try {
        appointment.completedAt = new Date();
        await appointment.save();
        completedCount++;
        console.log(`✅ Added completion time to appointment ${appointment.appointmentId}`);
      } catch (error) {
        console.error(`❌ Failed to update appointment ${appointment.appointmentId}:`, error);
      }
    }
    
    console.log(`🎯 Auto-completion time update completed: ${completedCount} appointments updated`);
    
    if (res) {
      res.json({
        success: true,
        message: `Updated completion time for ${completedCount} appointments`,
        data: { completedCount }
      });
    }
    
    return { success: true, completedCount };

  } catch (error) {
    console.error('Auto-complete appointments error:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Failed to auto-complete appointments',
        error: error.message
      });
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
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
  autoFinishAppointments,
  autoCancelNonApprovedAppointments,
  autoCompleteAppointmentsWithTime
};
