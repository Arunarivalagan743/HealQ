const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// Create doctor profile
const createDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      consultationFee,
      licenseNumber,
      workingDays,
      workingHours,
      breakTimes,
      maxAppointmentsPerSlot,
      slotDuration,
      clinicAddress,
      consultationMode,
      bio
    } = req.body;

    // Get user info from authenticated user
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can create doctor profiles.'
      });
    }

    // Check if profile already exists
    const existingProfile = await DoctorProfile.findOne({ userId: user._id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Doctor profile already exists. Use update endpoint to modify.'
      });
    }

    // Validate required phone number
    const phoneNumber = req.body.phoneNumber || user.phoneNumber || user.phone || '';
    if (!phoneNumber || phoneNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for doctor profile creation.'
      });
    }

    // Validate working hours format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!workingHours.start || !timeRegex.test(workingHours.start)) {
      return res.status(400).json({
        success: false,
        message: 'Working start time must be in HH:MM format (e.g., 09:00)'
      });
    }
    if (!workingHours.end || !timeRegex.test(workingHours.end)) {
      return res.status(400).json({
        success: false,
        message: 'Working end time must be in HH:MM format (e.g., 17:00)'
      });
    }

    // Create doctor profile with auto-filled data from user
    const doctorProfile = new DoctorProfile({
      userId: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: phoneNumber.trim(),
      specialization,
      experience,
      consultationFee,
      licenseNumber,
      workingDays,
      workingHours,
      breakTimes: breakTimes || [],
      maxAppointmentsPerSlot: maxAppointmentsPerSlot || 1,
      slotDuration: slotDuration || 30,
      clinicAddress,
      consultationMode: consultationMode || 'In-person',
      bio: bio || ''
    });

    await doctorProfile.save();

    // Update user's specialization if not set
    if (!user.specialization) {
      user.specialization = specialization;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: {
        profile: doctorProfile
      }
    });

  } catch (error) {
    console.error('Create doctor profile error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create doctor profile',
      error: error.message
    });
  }
};

// Get doctor profile
const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    console.log('🔍 [GET DOCTOR PROFILE] Request params:', req.params);
    console.log('🔍 [GET DOCTOR PROFILE] User from token:', req.user);
    console.log('🔍 [GET DOCTOR PROFILE] Doctor ID provided:', doctorId);
    
    let profile;
    if (doctorId) {
      // Get specific doctor profile (for patients viewing doctors)
      console.log('📋 [GET DOCTOR PROFILE] Searching by doctor ID:', doctorId);
      profile = await DoctorProfile.findOne({ 
        $or: [
          { _id: doctorId },
          { doctorId: doctorId }
        ],
        isActive: true,
        isVerified: true
      }).populate('userId', 'name email');
    } else {
      // Get current user's profile (for doctors viewing their own profile)
      console.log('📋 [GET DOCTOR PROFILE] Searching by user ID:', req.user?.id);
      profile = await DoctorProfile.findOne({ userId: req.user.id })
        .populate('userId', 'name email');
    }

    console.log('📋 [GET DOCTOR PROFILE] Profile found:', !!profile);
    if (profile) {
      console.log('📋 [GET DOCTOR PROFILE] Profile details:', {
        _id: profile._id,
        doctorId: profile.doctorId,
        userId: profile.userId?._id,
        name: profile.name,
        email: profile.email,
        isVerified: profile.isVerified,
        isActive: profile.isActive
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile
      }
    });

  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor profile',
      error: error.message
    });
  }
};

// Update doctor profile
const updateDoctorProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Get current doctor profile
    const profile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Prevent updating certain fields
    const protectedFields = ['userId', 'doctorId', 'email'];
    protectedFields.forEach(field => delete updates[field]);

    // Update profile
    Object.assign(profile, updates);
    await profile.save();

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: {
        profile
      }
    });

  } catch (error) {
    console.error('Update doctor profile error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile',
      error: error.message
    });
  }
};

// Get all doctors (for patients and admin)
const getAllDoctors = async (req, res) => {
  try {
    const {
      specialization,
      minFee,
      maxFee,
      consultationMode,
      search,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {
      isActive: true,
      isVerified: true
    };

    if (specialization) {
      filter.specialization = specialization;
    }

    if (minFee || maxFee) {
      filter.consultationFee = {};
      if (minFee) filter.consultationFee.$gte = parseFloat(minFee);
      if (maxFee) filter.consultationFee.$lte = parseFloat(maxFee);
    }

    if (consultationMode) {
      filter.consultationMode = { $in: [consultationMode, 'Both'] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { clinicAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get doctors with pagination
    const doctors = await DoctorProfile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    // Get total count for pagination
    const total = await DoctorProfile.countDocuments(filter);

    // Get unique specializations for filter options
    const specializations = await DoctorProfile.distinct('specialization', {
      isActive: true,
      isVerified: true
    });

    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalDoctors: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          specializations: specializations.sort()
        }
      }
    });

  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message
    });
  }
};

// Get doctor availability slots
const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const doctor = await DoctorProfile.findOne({
      $or: [
        { _id: doctorId },
        { doctorId: doctorId }
      ],
      isActive: true,
      isVerified: true
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if doctor is available on the requested day
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!doctor.isAvailableOnDay(dayName)) {
      return res.json({
        success: true,
        data: {
          available: false,
          message: `Doctor is not available on ${dayName}`,
          workingDays: doctor.workingDays
        }
      });
    }

    // Get available slots
    const availableSlots = doctor.getAvailableSlots();

    // TODO: Check against existing appointments to mark slots as booked
    // This would require importing the Appointment model and checking conflicts

    res.json({
      success: true,
      data: {
        available: true,
        date: date,
        dayName: dayName,
        slots: availableSlots,
        workingHours: doctor.workingHours,
        slotDuration: doctor.slotDuration
      }
    });

  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor availability',
      error: error.message
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const profile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Update profile picture path
    profile.profilePicture = req.file.path;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: profile.profilePicture
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};

module.exports = {
  createDoctorProfile,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
  getDoctorAvailability,
  uploadProfilePicture
};
