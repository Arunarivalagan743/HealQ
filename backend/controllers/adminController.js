const User = require('../models/User');
const UserRequest = require('../models/UserRequest');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const Appointment = require('../models/Appointment');
const { createFirebaseUser } = require('../config/firebase');
const emailService = require('../services/emailService');

// Add new user (Admin only)
const addUser = async (req, res) => {
  try {
    const { email, name, role, specialization } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Create user data
    const userData = {
      email: email.toLowerCase(),
      name,
      role,
      approved: true,
      isActive: true,
    };

    // Add specialization for doctors
    if (role === 'Doctor' && specialization) {
      userData.specialization = specialization;
    }

    // Create user in database
    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${role} added successfully. They can now register using this email.`,
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          specialization: newUser.specialization,
          approved: newUser.approved,
        },
      },
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user',
      error: error.message,
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-otp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, role, specialization, isActive, phoneNumber, address } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (specialization !== undefined) user.specialization = specialization;
    if (isActive !== undefined) user.isActive = isActive;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
          isActive: user.isActive,
          phoneNumber: user.phoneNumber,
          address: user.address,
        },
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account.',
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

// Get dashboard stats (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalPatients, totalDoctors, totalAdmins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Patient' }),
      User.countDocuments({ role: 'Doctor' }),
      User.countDocuments({ role: 'Admin' }),
    ]);

    const activeUsers = await User.countDocuments({ isActive: true });
    const registeredUsers = await User.countDocuments({ firebaseUid: { $exists: true } });
    const pendingUsers = await User.countDocuments({ firebaseUid: { $exists: false } });

    // Get request stats
    const [pendingRequests, totalRequests, doctorRequests, patientRequests] = await Promise.all([
      UserRequest.countDocuments({ status: 'pending' }),
      UserRequest.countDocuments(),
      UserRequest.countDocuments({ role: 'Doctor' }),
      UserRequest.countDocuments({ role: 'Patient' }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalAdmins,
          activeUsers,
          registeredUsers,
          pendingUsers,
        },
        requests: {
          pendingRequests,
          totalRequests,
          doctorRequests,
          patientRequests,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};

// Get all user requests (Admin only)
const getAllUserRequests = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get requests with pagination
    const requests = await UserRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await UserRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get all user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user requests',
      error: error.message,
    });
  }
};

// Approve user request (Admin only)
const approveUserRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminResponse } = req.body;

    const userRequest = await UserRequest.findById(requestId);
    if (!userRequest) {
      return res.status(404).json({
        success: false,
        message: 'User request not found.',
      });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed.',
      });
    }

    // Create or update user in the system
    let newUser;
    const existingUser = await User.findOne({ email: userRequest.email });
    
    if (existingUser) {
      // Update existing user (in case of reapproval after rejection)
      existingUser.name = userRequest.fullName;
      existingUser.role = userRequest.role;
      existingUser.approved = true;
      existingUser.isActive = true;
      existingUser.phoneNumber = userRequest.phone;
      existingUser.address = userRequest.address;
      
      // Add role-specific data
      if (userRequest.role === 'Doctor' && userRequest.specialization) {
        existingUser.specialization = userRequest.specialization;
      }
      
      newUser = await existingUser.save();
    } else {
      // Create new user
      const userData = {
        email: userRequest.email,
        name: userRequest.fullName,
        role: userRequest.role,
        approved: true,
        isActive: true,
        phoneNumber: userRequest.phone,
        address: userRequest.address,
      };

      // Add role-specific data
      if (userRequest.role === 'Doctor' && userRequest.specialization) {
        userData.specialization = userRequest.specialization;
      }

      newUser = new User(userData);
      await newUser.save();
    }

    // Generate temporary password for the user
    const temporaryPassword = Math.random().toString(36).slice(-8).toUpperCase();

    // If approved user is a doctor, create doctor profile with sequential ID
    if (newUser.role === 'Doctor') {
      try {
        const existingDoctorProfile = await DoctorProfile.findOne({ userId: newUser._id });
        
        if (!existingDoctorProfile) {
          const doctorProfileData = {
            userId: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber || userRequest.phone,
            specialization: userRequest.specialization || 'General Medicine',
            experience: 0, // Default, can be updated later
            qualifications: [],
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            consultationHours: {
              start: '09:00',
              end: '17:00'
            },
            consultationDuration: 30,
            consultationFee: 500, // Default fee
            isActive: true,
            isVerified: false, // Admin needs to verify later
            address: newUser.address || '',
            about: `Dr. ${newUser.name} - ${userRequest.specialization || 'General Medicine'} Specialist`
          };
          
          const newDoctorProfile = new DoctorProfile(doctorProfileData);
          await newDoctorProfile.save();
          
          console.log(`👨‍⚕️ [ADMIN] Doctor profile created with ID: ${newDoctorProfile.doctorId} for ${newUser.name}`);
        }
      } catch (profileError) {
        console.error('❌ [ADMIN] Failed to create doctor profile:', profileError);
        // Don't fail the approval process if profile creation fails
      }
    }

    // Update request status
    userRequest.status = 'approved';
    userRequest.adminResponse = adminResponse || 'Your request has been approved. You can now register.';
    if (req.user?.id) {
      userRequest.processedBy = req.user.id; // Only set if we have an authenticated user
    }
    userRequest.processedAt = new Date();
    await userRequest.save();

    // Send approval email to user
    try {
      await emailService.sendUserApprovalNotification(newUser, temporaryPassword);
      console.log('📧 [ADMIN] Approval email sent to:', userRequest.email);
    } catch (emailError) {
      console.error('❌ [ADMIN] Failed to send approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'User request approved successfully',
      data: {
        request: userRequest,
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Approve user request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user request',
      error: error.message,
    });
  }
};

// Reject user request (Admin only)
const rejectUserRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminResponse } = req.body;

    const userRequest = await UserRequest.findById(requestId);
    if (!userRequest) {
      return res.status(404).json({
        success: false,
        message: 'User request not found.',
      });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed.',
      });
    }

    // Update request status
    userRequest.status = 'rejected';
    userRequest.adminResponse = adminResponse || 'Your request has been rejected. Please contact clinic for more information.';
    if (req.user?.id) {
      userRequest.processedBy = req.user.id; // Only set if we have an authenticated user
    }
    userRequest.processedAt = new Date();
    await userRequest.save();

    // Send rejection email to user
    try {
      await emailService.sendUserRejectionNotification(userRequest, userRequest.adminResponse);
      console.log('📧 [ADMIN] Rejection email sent to:', userRequest.email);
    } catch (emailError) {
      console.error('❌ [ADMIN] Failed to send rejection email:', emailError);
    }

    res.json({
      success: true,
      message: 'User request rejected',
      data: {
        request: userRequest,
      },
    });
  } catch (error) {
    console.error('Reject user request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user request',
      error: error.message,
    });
  }
};

// Admin Profile Management Functions

// Get all doctor profiles with filters
const getAllDoctorProfiles = async (req, res) => {
  try {
    const {
      specialization,
      isVerified,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (specialization) filter.specialization = specialization;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { doctorId: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const doctors = await DoctorProfile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'registeredAt lastLogin');

    const total = await DoctorProfile.countDocuments(filter);

    // Get filter options
    const specializations = await DoctorProfile.distinct('specialization');

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
    console.error('Get all doctor profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor profiles',
      error: error.message
    });
  }
};

// Get all patient profiles with filters
const getAllPatientProfiles = async (req, res) => {
  try {
    const {
      minAge,
      maxAge,
      bloodGroup,
      city,
      profileCompleted,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (profileCompleted !== undefined) filter.profileCompleted = profileCompleted === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let patients = await PatientProfile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'registeredAt lastLogin');

    // Filter by age if specified (done after query due to virtual field)
    if (minAge || maxAge) {
      patients = patients.filter(patient => {
        const age = patient.age;
        if (!age) return false;
        if (minAge && age < parseInt(minAge)) return false;
        if (maxAge && age > parseInt(maxAge)) return false;
        return true;
      });
    }

    const total = await PatientProfile.countDocuments(filter);

    // Get filter options
    const bloodGroups = await PatientProfile.distinct('bloodGroup', { isActive: true });
    const cities = await PatientProfile.distinct('address.city', { isActive: true });

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPatients: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          bloodGroups: bloodGroups.filter(Boolean).sort(),
          cities: cities.filter(Boolean).sort()
        }
      }
    });

  } catch (error) {
    console.error('Get all patient profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient profiles',
      error: error.message
    });
  }
};

// Update doctor profile verification status
const updateDoctorVerification = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isVerified, isActive, adminNotes } = req.body;

    const doctor = await DoctorProfile.findOne({
      $or: [{ _id: doctorId }, { doctorId: doctorId }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Update verification status
    if (isVerified !== undefined) doctor.isVerified = isVerified;
    if (isActive !== undefined) doctor.isActive = isActive;

    await doctor.save();

    // Log admin action
    console.log(`👨‍⚕️ [ADMIN] Doctor ${doctor.name} verification updated by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Doctor verification status updated successfully',
      data: {
        doctor
      }
    });

  } catch (error) {
    console.error('Update doctor verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor verification',
      error: error.message
    });
  }
};

// Deactivate patient profile
const updatePatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { isActive, adminNotes } = req.body;

    const patient = await PatientProfile.findOne({
      $or: [{ _id: patientId }, { patientId: patientId }]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Update status
    if (isActive !== undefined) patient.isActive = isActive;

    await patient.save();

    // Log admin action
    console.log(`🧍 [ADMIN] Patient ${patient.name} status updated by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Patient status updated successfully',
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Update patient status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient status',
      error: error.message
    });
  }
};

// Get comprehensive dashboard statistics
const getComprehensiveDashboardStats = async (req, res) => {
  try {
    // Get basic user stats
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'Doctor', isActive: true });
    const totalPatients = await User.countDocuments({ role: 'Patient', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'Admin', isActive: true });

    // Get profile stats
    const totalDoctorProfiles = await DoctorProfile.countDocuments({ isActive: true });
    const verifiedDoctors = await DoctorProfile.countDocuments({ isActive: true, isVerified: true });
    const totalPatientProfiles = await PatientProfile.countDocuments({ isActive: true });
    const completedPatientProfiles = await PatientProfile.countDocuments({ 
      isActive: true, 
      profileCompleted: true 
    });

    // Get appointment stats
    const totalAppointments = await Appointment.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });

    const upcomingAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: new Date() },
      status: { $in: ['Scheduled', 'Confirmed'] }
    });

    // Get appointment status breakdown
    const appointmentStatusStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity
    const recentUserRequests = await UserRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email role createdAt');

    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('patientName doctorName appointmentDate status')
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization');

    // Get specialization breakdown
    const specializationStats = await DoctorProfile.aggregate([
      {
        $match: { isActive: true, isVerified: true }
      },
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDoctors,
          totalPatients,
          totalAdmins,
          totalAppointments,
          todaysAppointments,
          upcomingAppointments
        },
        profiles: {
          totalDoctorProfiles,
          verifiedDoctors,
          unverifiedDoctors: totalDoctorProfiles - verifiedDoctors,
          totalPatientProfiles,
          completedPatientProfiles,
          incompletePatientProfiles: totalPatientProfiles - completedPatientProfiles
        },
        appointments: {
          statusBreakdown: appointmentStatusStats,
          total: totalAppointments,
          today: todaysAppointments,
          upcoming: upcomingAppointments
        },
        specializations: specializationStats,
        recentActivity: {
          pendingRequests: recentUserRequests,
          recentAppointments: recentAppointments
        }
      }
    });

  } catch (error) {
    console.error('Get comprehensive dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
};

// Get doctors in queue order (sequential ID order)
const getDoctorsInQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get doctors sorted by their sequential doctorId
    const doctors = await DoctorProfile.find({})
      .sort({ doctorId: 1 }) // Sort by doctorId to maintain queue order
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email role approved isActive createdAt')
      .select('doctorId name email specialization isVerified isActive createdAt');

    const totalDoctors = await DoctorProfile.countDocuments();

    // Add queue position to each doctor
    const doctorsWithQueuePosition = doctors.map((doctor, index) => ({
      ...doctor.toObject(),
      queuePosition: skip + index + 1, // Position in the overall queue
      approvalDate: doctor.userId?.createdAt
    }));

    res.json({
      success: true,
      message: 'Doctors retrieved in queue order',
      data: {
        doctors: doctorsWithQueuePosition,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalDoctors / limit),
          totalDoctors,
          hasNext: skip + doctors.length < totalDoctors,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get doctors queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors queue',
      error: error.message
    });
  }
};

// Get doctor profile with detailed information
const getDoctorProfileById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Find doctor profile with user details
    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name email role createdAt');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...doctor.toObject(),
        name: doctor.userId?.name,
        email: doctor.userId?.email,
        createdAt: doctor.userId?.createdAt
      }
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor profile',
      error: error.message
    });
  }
};

// Get doctor's appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Find appointments for this doctor
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email')
      .sort({ appointmentDate: -1 })
      .limit(50); // Limit to recent 50 appointments

    const appointmentsWithPatientNames = appointments.map(appointment => ({
      ...appointment.toObject(),
      patientName: appointment.patientId?.name || 'Unknown Patient'
    }));

    res.status(200).json({
      success: true,
      data: appointmentsWithPatientNames
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor appointments',
      error: error.message
    });
  }
};

// Get doctor's patient history
const getDoctorPatientHistory = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get unique patients this doctor has treated
    const appointments = await Appointment.find({ 
      doctorId,
      status: 'completed'
    })
    .populate('patientId', 'name email')
    .sort({ appointmentDate: -1 });

    // Create unique patient list
    const uniquePatientsMap = new Map();
    appointments.forEach(appointment => {
      if (appointment.patientId) {
        const patientId = appointment.patientId._id.toString();
        if (!uniquePatientsMap.has(patientId)) {
          uniquePatientsMap.set(patientId, {
            _id: appointment.patientId._id,
            name: appointment.patientId.name,
            email: appointment.patientId.email,
            firstVisit: appointment.appointmentDate,
            lastVisit: appointment.appointmentDate,
            totalVisits: 1
          });
        } else {
          const patient = uniquePatientsMap.get(patientId);
          patient.totalVisits += 1;
          if (appointment.appointmentDate > patient.lastVisit) {
            patient.lastVisit = appointment.appointmentDate;
          }
          if (appointment.appointmentDate < patient.firstVisit) {
            patient.firstVisit = appointment.appointmentDate;
          }
        }
      }
    });

    const patientHistory = Array.from(uniquePatientsMap.values());

    res.status(200).json({
      success: true,
      data: patientHistory
    });
  } catch (error) {
    console.error('Get doctor patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor patient history',
      error: error.message
    });
  }
};

module.exports = {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAllUserRequests,
  approveUserRequest,
  rejectUserRequest,
  // New profile management functions
  getAllDoctorProfiles,
  getAllPatientProfiles,
  updateDoctorVerification,
  updatePatientStatus,
  getComprehensiveDashboardStats,
  getDoctorsInQueue,
  // Detailed doctor view functions
  getDoctorProfileById,
  getDoctorAppointments,
  getDoctorPatientHistory
};
