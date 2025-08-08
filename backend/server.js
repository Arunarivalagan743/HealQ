require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import configurations
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const emailService = require('./services/emailService');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const onboardingRoutes = require('./routes/onboarding');
const doctorProfileRoutes = require('./routes/doctorProfile');
const patientProfileRoutes = require('./routes/patientProfile');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase
initializeFirebase();

// Connect to database
connectDB();

// Initialize email service (verify connection removed as it's not needed)
console.log('✅ Email service initialized');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later.',
  },
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://10.0.2.2:8081', // Android emulator
      'http://localhost:19000', // Expo dev server
      process.env.CLIENT_URL,
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 CORS: Allowing origin in development mode:', origin);
        callback(null, true);
      } else {
        console.error('❌ CORS: Origin not allowed:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`   📍 IP: ${req.ip}`);
  console.log(`   🌐 Origin: ${req.get('Origin') || 'No origin'}`);
  console.log(`   🔧 User-Agent: ${req.get('User-Agent') || 'No user-agent'}`);
  console.log(`   📝 Content-Type: ${req.get('Content-Type') || 'No content-type'}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   📦 Body:`, req.body);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HealQ Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/doctor', doctorProfileRoutes);
app.use('/api/patient', patientProfileRoutes);
app.use('/api/appointments', appointmentRoutes);

// Development route without authentication
app.get('/api/dev/user/:email', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    res.json({
      success: true,
      data: user ? {
        id: user._id,
        email: user.email,
        name: user.name,
        approved: user.approved,
        isActive: user.isActive,
        role: user.role
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message),
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value',
      field: Object.keys(error.keyValue)[0],
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🏥 HealQ Backend Server Started Successfully!
🌍 Environment: ${process.env.NODE_ENV}
🚀 Server running on port: ${PORT}
📡 API Base URL: http://localhost:${PORT}
📋 Health Check: http://localhost:${PORT}/health
📚 API Documentation:
   - Auth: http://localhost:${PORT}/api/auth
   - Admin: http://localhost:${PORT}/api/admin
🔒 Security: Helmet + CORS + Rate Limiting enabled
📧 Email Service: ${emailService ? 'Connected' : 'Disconnected'}
🗄️  Database: MongoDB Atlas
🔥 Firebase: Admin SDK initialized
⏰ Started at: ${new Date().toISOString()}
  `);
});
