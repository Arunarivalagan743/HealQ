const DoctorProfile = require('../models/DoctorProfile');

// Get all verified and active doctors for patients
const getVerifiedDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20, specialization } = req.query;
    const skip = (page - 1) * limit;

    // Build query for verified and active doctors
    const query = {
      isVerified: true,
      isActive: true
    };

    // Add specialization filter if provided
    if (specialization && specialization !== 'all') {
      query.specialization = new RegExp(specialization, 'i');
    }

    // Get doctors with pagination
    const doctors = await DoctorProfile.find(query)
      .populate('userId', 'name email')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDoctors = await DoctorProfile.countDocuments(query);

    // Format doctor data
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      doctorId: doctor.doctorId,
      name: doctor.name || doctor.userId?.name,
      email: doctor.email || doctor.userId?.email,
      specialization: doctor.specialization,
      experience: doctor.experience,
      consultationFee: doctor.consultationFee,
      rating: doctor.rating,
      clinicAddress: doctor.clinicAddress,
      workingHours: doctor.workingHours,
      workingDays: doctor.workingDays,
      consultationMode: doctor.consultationMode,
      isVerified: doctor.isVerified,
      isActive: doctor.isActive,
      bio: doctor.bio
    }));

    res.status(200).json({
      success: true,
      data: {
        doctors: formattedDoctors,
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
    console.error('Get verified doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors',
      error: error.message
    });
  }
};

module.exports = {
  getVerifiedDoctors
};
