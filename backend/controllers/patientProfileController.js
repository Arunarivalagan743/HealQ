const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const UserRequest = require('../models/UserRequest');

// Create patient profile with smart pre-filling
const createPatientProfile = async (req, res) => {
  try {
    const { 
      phoneNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      medicalHistory,
      allergies,
      currentMedications,
      pastSurgeries,
      emergencyContact,
      insurance
    } = req.body;    // Get user info from authenticated user
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'Patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only patients can create patient profiles.'
      });
    }

    // Check if profile already exists
    const existingProfile = await PatientProfile.findOne({ userId: user._id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile already exists. Use update endpoint to modify.'
      });
    }

    // Try to get additional info from UserRequest if available
    let userRequest = null;
    try {
      userRequest = await UserRequest.findOne({ 
        email: user.email,
        role: 'Patient',
        status: 'approved'
      });
    } catch (error) {
      console.log('No user request found, proceeding with user data only');
    }

    // Smart pre-filling: Use data from UserRequest if available, otherwise from User
    const profileData = {
      userId: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: phoneNumber || userRequest?.phone || user.phoneNumber || '',
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      gender,
      bloodGroup,
      emergencyContact
    };

    // Handle address - use from request body, fallback to user request, then user
    if (address) {
      profileData.address = address;
    } else if (userRequest?.address) {
      // Parse address from UserRequest (which is a string) into components
      const addressParts = userRequest.address.split(',').map(part => part.trim());
      profileData.address = {
        street: addressParts.length > 3 ? addressParts[0] : '',
        city: addressParts.length > 2 ? addressParts[addressParts.length - 3] : addressParts[0] || '',
        state: addressParts.length > 1 ? addressParts[addressParts.length - 2] : '',
        zipCode: addressParts.length > 0 ? addressParts[addressParts.length - 1] : ''
      };
    } else if (user.address) {
      profileData.address = user.address;
    }

    // Add optional medical information
    if (medicalHistory && medicalHistory.length > 0) {
      profileData.medicalHistory = medicalHistory;
    }
    if (allergies && allergies.length > 0) {
      profileData.allergies = allergies;
    }
    if (currentMedications && currentMedications.length > 0) {
      profileData.currentMedications = currentMedications;
    }
    if (pastSurgeries && pastSurgeries.length > 0) {
      profileData.pastSurgeries = pastSurgeries;
    }
    if (insurance) {
      profileData.insurance = insurance;
    }

    // Create patient profile
    const patientProfile = new PatientProfile(profileData);
    await patientProfile.save();

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: {
        profile: patientProfile,
        preFilledFrom: {
          userAccount: true,
          userRequest: !!userRequest
        }
      }
    });

  } catch (error) {
    console.error('Create patient profile error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create patient profile',
      error: error.message
    });
  }
};

// Get pre-filled data for profile creation
const getPreFilledData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'Patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only patients can access this endpoint.'
      });
    }

    // Get user request data if available
    let userRequest = null;
    try {
      userRequest = await UserRequest.findOne({ 
        email: user.email,
        role: 'Patient',
        status: 'approved'
      });
    } catch (error) {
      console.log('No user request found');
    }

    // Prepare pre-filled data
    const preFilledData = {
      // Always from user account (read-only)
      name: user.name,
      email: user.email,
      
      // From user request or user account
      phoneNumber: userRequest?.phone || user.phoneNumber || '',
      
      // From user account if available
      dateOfBirth: user.dateOfBirth || null,
      
      // Address processing
      address: null
    };

    // Process address
    if (user.address) {
      preFilledData.address = user.address;
    } else if (userRequest?.address) {
      // Parse address string into components
      const addressParts = userRequest.address.split(',').map(part => part.trim());
      preFilledData.address = {
        street: addressParts.length > 3 ? addressParts[0] : '',
        city: addressParts.length > 2 ? addressParts[addressParts.length - 3] : addressParts[0] || '',
        state: addressParts.length > 1 ? addressParts[addressParts.length - 2] : '',
        zipCode: addressParts.length > 0 ? addressParts[addressParts.length - 1] : ''
      };
    }

    // Additional info from user request
    if (userRequest) {
      preFilledData.userRequestInfo = {
        age: userRequest.age,
        problem: userRequest.problem,
        fullName: userRequest.fullName
      };
    }

    res.json({
      success: true,
      data: {
        preFilledData,
        readOnlyFields: ['name', 'email'],
        sources: {
          userAccount: true,
          userRequest: !!userRequest
        }
      }
    });

  } catch (error) {
    console.error('Get pre-filled data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pre-filled data',
      error: error.message
    });
  }
};

// Get patient profile
const getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    let profile;
    if (patientId) {
      // Admin or doctor viewing patient profile
      profile = await PatientProfile.findOne({ 
        $or: [
          { _id: patientId },
          { patientId: patientId }
        ],
        isActive: true
      }).populate('userId', 'name email');
    } else {
      // Patient viewing their own profile
      profile = await PatientProfile.findOne({ userId: req.user.id })
        .populate('userId', 'name email');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile
      }
    });

  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient profile',
      error: error.message
    });
  }
};

// Update patient profile
const updatePatientProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Get current patient profile
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Prevent updating certain fields
    const protectedFields = ['userId', 'patientId', 'email'];
    protectedFields.forEach(field => delete updates[field]);

    // Update profile
    Object.assign(profile, updates);
    await profile.save();

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: {
        profile
      }
    });

  } catch (error) {
    console.error('Update patient profile error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update patient profile',
      error: error.message
    });
  }
};

// Get all patients (for admin)
const getAllPatients = async (req, res) => {
  try {
    const {
      minAge,
      maxAge,
      bloodGroup,
      city,
      search,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {
      isActive: true
    };

    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get patients with pagination
    let patients = await PatientProfile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

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

    // Get total count for pagination (approximate for age filtering)
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
    console.error('Get all patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
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

    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
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

// Get patient medical summary
const getPatientMedicalSummary = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const summary = {
      basicInfo: {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup
      },
      activeConditions: profile.getActiveMedicalConditions(),
      currentMedications: profile.getCurrentMedicationsList(),
      allergies: profile.allergies,
      emergencyContact: profile.emergencyContact
    };

    res.json({
      success: true,
      data: {
        summary
      }
    });

  } catch (error) {
    console.error('Get patient medical summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical summary',
      error: error.message
    });
  }
};

module.exports = {
  createPatientProfile,
  getPreFilledData,
  getPatientProfile,
  updatePatientProfile,
  getAllPatients,
  uploadProfilePicture,
  getPatientMedicalSummary
};
