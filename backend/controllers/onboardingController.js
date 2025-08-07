const UserRequest = require('../models/UserRequest');
const User = require('../models/User');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// Submit new user request
const submitUserRequest = async (req, res) => {
  try {
    const { fullName, age, email, phone, address, role, specialization, problem } = req.body;

    console.log('📝 [USER REQUEST] New request received:', {
      fullName,
      age,
      email,
      role,
      timestamp: new Date().toISOString()
    });

    // Check if user already exists in the system
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.approved && existingUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered in our system. Please use the "I already have access" option.',
      });
    }

    // Check if there's already a pending request for this email
    const existingRequest = await UserRequest.findOne({ 
      email: email.toLowerCase(),
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request. Please wait for admin approval.',
      });
    }

    // Create new user request
    const requestData = {
      fullName,
      age,
      email: email.toLowerCase(),
      phone,
      address,
      role,
    };

    // Add role-specific fields
    if (role === 'Doctor' && specialization) {
      requestData.specialization = specialization;
    }
    if (role === 'Patient' && problem) {
      requestData.problem = problem;
    }

    const newRequest = new UserRequest(requestData);
    await newRequest.save();

    // Debug: Check what emailService contains
    console.log('🔍 [DEBUG] emailService object:', emailService);
    console.log('🔍 [DEBUG] emailService functions:', Object.getOwnPropertyNames(emailService));
    console.log('🔍 [DEBUG] emailService constructor:', emailService.constructor.name);

    // Send notification email to admin
    try {
      await emailService.sendNewUserRequestNotification(newRequest);
      console.log('📧 [USER REQUEST] Admin notification sent successfully');
    } catch (emailError) {
      console.error('❌ [USER REQUEST] Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      await emailService.sendUserRequestConfirmation(newRequest);
      console.log('📧 [USER REQUEST] User confirmation sent successfully');
    } catch (emailError) {
      console.error('❌ [USER REQUEST] Failed to send user confirmation:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Your request has been submitted successfully. You will receive a response within 2-3 days.',
      data: {
        requestId: newRequest._id,
        status: newRequest.status,
        submittedAt: newRequest.createdAt,
      },
    });

  } catch (error) {
    console.error('❌ [USER REQUEST] Submission failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit request',
      error: error.message,
    });
  }
};

// Verify existing user email and send OTP
const verifyExistingUser = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 [EMAIL VERIFY] Checking email:', email);

    // Check if user exists in the system
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered with our clinic. Please submit a new user request.',
      });
    }

    // Check if user is already fully registered (has firebaseUid or password)
    if (existingUser.firebaseUid || existingUser.password) {
      return res.status(400).json({
        success: false,
        message: 'This account is already active. Please use the login screen.',
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user document
    existingUser.otp = {
      code: otp,
      expiresAt: otpExpiry,
      createdAt: new Date(),
    };
    await existingUser.save();

    // Send OTP email
    try {
      await emailService.sendOTPVerification(email, otp, existingUser.name || 'User');
      console.log('📧 [EMAIL VERIFY] OTP sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ [EMAIL VERIFY] Failed to send OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      data: {
        email: email,
        otpExpiresAt: otpExpiry,
      },
    });

  } catch (error) {
    console.error('❌ [EMAIL VERIFY] Failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
};

// Verify OTP for existing user
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔐 [OTP VERIFY] Verifying OTP for:', email);

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.',
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    // Clear OTP after successful verification
    user.clearOTP();
    await user.save();

    console.log('✅ [OTP VERIFY] OTP verified successfully for:', email);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now complete your registration.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          requiresSpecialization: user.role === 'Doctor',
        },
      },
    });

  } catch (error) {
    console.error('❌ [OTP VERIFY] Failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

module.exports = {
  submitUserRequest,
  verifyExistingUser,
  verifyOTP,
};
