const User = require('../models/User');
const { createFirebaseUser } = require('../config/firebase');

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

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAdmins,
        activeUsers,
        registeredUsers,
        pendingUsers,
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

module.exports = {
  addUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
};
