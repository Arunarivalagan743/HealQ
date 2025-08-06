const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../config/firebase');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// Middleware to verify Firebase token
const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const idToken = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No Firebase token provided.',
      });
    }

    const decodedToken = await verifyFirebaseToken(idToken);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Firebase token.',
    });
  }
};

// Middleware to check user role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized for this action.`,
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

// Middleware to get user from database
const getUserFromDB = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const user = await User.findById(req.user.id).select('-otp');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Error fetching user from database:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user.',
    });
  }
};

module.exports = {
  verifyToken,
  verifyFirebaseAuth,
  authorizeRoles,
  requireAdmin,
  getUserFromDB,
};
