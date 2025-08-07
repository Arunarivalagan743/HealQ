const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyFirebaseToken, createFirebaseUser, admin } = require('../config/firebase');
const emailService = require('../services/emailService');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// Check email role (security endpoint)
const checkEmailRole = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is pre-approved
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!existingUser) {
      return res.status(403).json({
        success: false,
        message: 'Email not authorized. Please contact admin to add your email first.',
      });
    }

    if (existingUser.firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'User already registered with this email.',
      });
    }

    res.json({
      success: true,
      data: {
        role: existingUser.role,
        email: existingUser.email,
        requiresSpecialization: existingUser.role === 'Doctor',
      },
    });
  } catch (error) {
    console.error('Check email role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email authorization',
      error: error.message,
    });
  }
};

// Register user (only pre-approved emails)
const register = async (req, res) => {
  try {
    const { email, name, specialization, idToken } = req.body;

    // Verify Firebase ID token
    const firebaseUser = await verifyFirebaseToken(idToken);
    
    if (firebaseUser.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Email mismatch between Firebase token and request.',
      });
    }

    // Check if email is pre-approved
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!existingUser) {
      return res.status(403).json({
        success: false,
        message: 'Email not authorized. Please contact admin to add your email first.',
      });
    }

    if (existingUser.firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'User already registered with this email.',
      });
    }

    // Update user with Firebase UID and additional info
    existingUser.firebaseUid = firebaseUser.uid;
    existingUser.name = name;
    
    if (existingUser.role === 'Doctor' && specialization) {
      existingUser.specialization = specialization;
    }
    
    existingUser.lastLogin = new Date();
    await existingUser.save();

    // Generate JWT token
    const token = generateToken({
      id: existingUser._id,
      email: existingUser.email,
      role: existingUser.role,
      firebaseUid: firebaseUser.uid,
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name, existingUser.role);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          specialization: existingUser.specialization,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Backend-only registration (fallback for Firebase network issues)
const registerBackendOnly = async (req, res) => {
  try {
    const { email, password, name, specialization } = req.body;

    // Check if email is pre-approved
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!existingUser) {
      return res.status(403).json({
        success: false,
        message: 'Email not authorized. Please contact admin to add your email first.',
      });
    }

    if (existingUser.firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'User already registered with this email.',
      });
    }

    // Update user with backend-only registration (no Firebase UID)
    existingUser.name = name;
    existingUser.password = password; // Store password hash in a real app
    
    if (existingUser.role === 'Doctor' && specialization) {
      existingUser.specialization = specialization;
    }
    
    existingUser.lastLogin = new Date();
    await existingUser.save();

    // Generate JWT token
    const token = generateToken({
      id: existingUser._id,
      email: existingUser.email,
      role: existingUser.role,
      backendOnly: true, // Flag to indicate backend-only auth
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name, existingUser.role);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully (backend-only mode)',
      data: {
        token,
        user: {
          id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          specialization: existingUser.specialization,
          approved: existingUser.approved,
          backendOnly: true,
        },
      },
    });
  } catch (error) {
    console.error('Backend registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, idToken } = req.body;

    // Verify Firebase ID token
    const firebaseUser = await verifyFirebaseToken(idToken);
    
    if (firebaseUser.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Email mismatch between Firebase token and request.',
      });
    }

    // Find user in database
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      firebaseUid: firebaseUser.uid 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      firebaseUid: user.firebaseUid,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
          lastLogin: user.lastLogin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Backend-only login (for users who reset password and lost Firebase UID)
const loginBackendOnly = async (req, res) => {
  try {
    console.log('🔐 [BACKEND LOGIN] Request received:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      timestamp: new Date().toISOString()
    });
    
    const { email, password } = req.body;

    // Find user in database (backend-only users have no firebaseUid)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      $or: [
        { firebaseUid: { $exists: false } },
        { firebaseUid: null }
      ]
    });

    console.log('👤 [BACKEND LOGIN] User found:', user ? `Yes (${user.name})` : 'No');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not set up for backend authentication.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a backend password set.',
      });
    }

    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('🔍 [BACKEND LOGIN] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      backendOnly: true,
    });

    console.log('✅ [BACKEND LOGIN] Login successful');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
          lastLogin: user.lastLogin,
          backendOnly: true,
        },
        token,
      },
    });
  } catch (error) {
    console.error('❌ [BACKEND LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Forgot password - send OTP
const forgotPassword = async (req, res) => {
  try {
    console.log('🔍 [FORGOT PASSWORD] Request received:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    const { email } = req.body;
    console.log('📧 [FORGOT PASSWORD] Processing email:', email);

    // Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('👤 [FORGOT PASSWORD] User found:', user ? `Yes (${user.name})` : 'No');

    if (!user) {
      console.log('❌ [FORGOT PASSWORD] User not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address.',
      });
    }

    // Check if user has either Firebase UID or backend registration (name field)
    if (!user.firebaseUid && !user.name) {
      console.log('❌ [FORGOT PASSWORD] User not registered:', { firebaseUid: user.firebaseUid, name: user.name });
      return res.status(400).json({
        success: false,
        message: 'User has not completed registration. Please register first.',
      });
    }

    // Generate OTP
    console.log('🔢 [FORGOT PASSWORD] Generating OTP...');
    const otp = user.generateOTP();
    await user.save();
    console.log('✅ [FORGOT PASSWORD] OTP generated and saved');

    // Send OTP via email
    console.log('📧 [FORGOT PASSWORD] Sending OTP email...');
    await emailService.sendOTP(email, otp, user.name || 'User');
    console.log('✅ [FORGOT PASSWORD] OTP email sent successfully');

    const responseData = {
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.',
      data: {
        email: email,
        expiresIn: '5 minutes',
      },
    };
    
    console.log('📤 [FORGOT PASSWORD] Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('❌ [FORGOT PASSWORD] Error occurred:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address.',
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Save the verified state
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        email: email,
        otpVerified: true,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    console.log('🔐 [RESET PASSWORD] Request received:', { email: req.body.email, hasOTP: !!req.body.otp, hasNewPassword: !!req.body.newPassword });
    
    const { email, otp, newPassword } = req.body;

    // Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ [RESET PASSWORD] User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address.',
      });
    }

    // Verify OTP again for security
    if (!user.otp || !user.otp.verified || user.otp.code !== otp) {
      console.log('❌ [RESET PASSWORD] Invalid OTP:', { hasOTP: !!user.otp, verified: user.otp?.verified, codeMatch: user.otp?.code === otp });
      return res.status(400).json({
        success: false,
        message: 'Invalid or unverified OTP. Please verify OTP first.',
      });
    }

    console.log('✅ [RESET PASSWORD] OTP verified, proceeding with password reset');

    // Handle password reset based on user type
    if (user.firebaseUid) {
      console.log('🔥 [RESET PASSWORD] Firebase user - updating password via Firebase Admin');
      
      try {
        // Update password using Firebase Admin SDK
        const { admin } = require('../config/firebase');
        await admin.auth().updateUser(user.firebaseUid, {
          password: newPassword
        });
        console.log('✅ [RESET PASSWORD] Firebase password updated successfully');
      } catch (firebaseError) {
        console.error('❌ [RESET PASSWORD] Firebase password update failed:', firebaseError);
        
        // If Firebase update fails, fall back to backend-only mode
        console.log('🔄 [RESET PASSWORD] Falling back to backend-only mode');
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        user.firebaseUid = undefined; // Remove Firebase UID to use backend auth
        console.log('✅ [RESET PASSWORD] Switched to backend-only authentication');
      }
    } else {
      console.log('📧 [RESET PASSWORD] Backend-only user - updating password hash');
      
      // For backend-only users, hash and store the password
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
      console.log('✅ [RESET PASSWORD] Backend password hash updated');
    }

    // Clear OTP from database
    user.clearOTP();
    await user.save();
    console.log('✅ [RESET PASSWORD] User saved with new password');

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
      data: {
        email: email,
        resetCompletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [RESET PASSWORD] Error occurred:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message,
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          lastLogin: user.lastLogin,
          registeredAt: user.registeredAt,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, dateOfBirth, specialization, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (specialization && user.role === 'Doctor') user.specialization = specialization;
    if (address) user.address = address;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

module.exports = {
  checkEmailRole,
  register,
  registerBackendOnly,
  login,
  loginBackendOnly,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
};
