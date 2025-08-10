import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Base URL for your backend API
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator, your actual server IP for real device
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // For Android emulator use 10.0.2.2
      // For real Android device, use your computer's IP address
      // You can find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
      return 'http://10.0.2.2:5000/api'; // Change this to your actual IP for real device testing
    } else {
      return 'http://localhost:5000/api'; // iOS simulator
    }
  } else {
    // Production mode - replace with your actual production server URL
    return 'https://your-production-server.com/api'; // ⚠️ REPLACE WITH YOUR ACTUAL PRODUCTION URL
  }
};

const BASE_URL = getBaseURL();

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Import React Navigation for navigation handling
let navigationRef = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('🚨 Token expired, logging out user...');
      
      // Clear stored token and user data
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userData']);
      
      // Navigate to login screen if navigation ref is available
      if (navigationRef) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
      
      // Emit a custom event for components to handle token expiration
      // You can listen to this event in your screens if needed
      console.log('📢 User session expired, redirecting to login');
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Check email role before registration (security feature)
  checkEmailRole: async (email) => {
    try {
      const response = await api.post('/auth/check-email-role', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Register user with Firebase
  register: async (userData, idToken) => {
    try {
      const response = await api.post('/auth/register', {
        ...userData,
        idToken,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Backend-only registration (fallback for Firebase network issues)
  registerBackendOnly: async (userData) => {
    try {
      const response = await api.post('/auth/register-backend-only', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (email, idToken) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        idToken,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Backend-only login (for users who reset password)
  loginBackendOnly: async (email, password) => {
    try {
      console.log('🌐 API: Making POST request to /auth/login-backend-only');
      console.log('📧 API: Login payload:', { email, hasPassword: !!password });
      
      const response = await api.post('/auth/login-backend-only', {
        email,
        password,
      });
      console.log('✅ API: Backend login successful:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Backend login failed:', error.message);
      console.error('📊 API: Error response:', error.response?.data);
      throw error.response?.data || error.message;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      console.log('🌐 API: Making POST request to /auth/forgot-password');
      console.log('📧 API: Email payload:', { email });
      console.log('🔗 API: Base URL:', BASE_URL);
      
      const response = await api.post('/auth/forgot-password', { email });
      console.log('✅ API: Response received:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Request failed:', error.message);
      console.error('📊 API: Error response:', error.response?.data);
      console.error('📊 API: Error status:', error.response?.status);
      console.error('📊 API: Error headers:', error.response?.headers);
      console.error('🔗 API: Request config:', error.config);
      throw error.response?.data || error.message;
    }
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Profile Management shortcuts (for backward compatibility)
  getPatientPreFilledData: async () => {
    try {
      const response = await api.get('/patient/prefill-data');
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createPatientProfile: async (profileData) => {
    try {
      const response = await api.post('/patient/create', profileData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPatientProfile: async (patientId = null) => {
    try {
      const url = patientId ? `/patient/profile/${patientId}` : '/patient/profile';
      const response = await api.get(url);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createDoctorProfile: async (profileData) => {
    try {
      const response = await api.post('/doctor/create', profileData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateDoctorProfile: async (profileId, profileData) => {
    try {
      const response = await api.put(`/doctor/update`, profileData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDoctorProfile: async (doctorId = null) => {
    try {
      const url = doctorId ? `/doctor/profile/${doctorId}` : '/doctor/profile';
      const response = await api.get(url);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllDoctors: async (filters = {}) => {
    try {
      // Use the verified doctors endpoint that doesn't require authentication for public access
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/doctor/verified?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDoctorAvailability: async (doctorId, date) => {
    try {
      const response = await api.get(`/doctor/availability/${doctorId}?date=${date}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createOrUpdatePatientProfile: async (profileData) => {
    try {
      // Try to update first, if that fails, create
      let response;
      try {
        response = await api.put('/patient/update', profileData);
      } catch (updateError) {
        // If update fails, try create
        response = await api.post('/patient/create', profileData);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createOrUpdateDoctorProfile: async (profileData) => {
    try {
      // Try to update first, if that fails, create
      let response;
      try {
        response = await api.put('/doctor/update', profileData);
      } catch (updateError) {
        // If update fails, try create
        response = await api.post('/doctor/create', profileData);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Admin API functions
export const adminAPI = {
  // Add new user
  addUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      // Use proper authenticated route instead of development route
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all user requests
  getAllUserRequests: async (params = {}) => {
    try {
      const response = await api.get('/admin/requests', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Approve user request
  approveUserRequest: async (requestId, adminResponse = '') => {
    try {
      const response = await api.put(`/admin/requests/${requestId}/approve`, { adminResponse });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reject user request
  rejectUserRequest: async (requestId, adminResponse = '') => {
    try {
      const response = await api.put(`/admin/requests/${requestId}/reject`, { adminResponse });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all doctor profiles
  getAllDoctorProfiles: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/doctors?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get doctors in queue
  getDoctorsInQueue: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/admin/doctors/queue?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all patient profiles
  getAllPatientProfiles: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/patients?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update doctor verification
  updateDoctorVerification: async (doctorId, verificationData) => {
    try {
      const response = await api.put(`/admin/doctors/${doctorId}/verification`, verificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update patient status
  updatePatientStatus: async (patientId, statusData) => {
    try {
      const response = await api.put(`/admin/patients/${patientId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get comprehensive dashboard stats
  getComprehensiveDashboardStats: async () => {
    try {
      // Use development endpoint for now
      const response = await api.get('/admin/dashboard/comprehensive-dev');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get detailed doctor profile
  getDoctorProfile: async (doctorId) => {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }
      const response = await api.get(`/admin/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get doctor's appointments
  getDoctorAppointments: async (doctorId) => {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }
      const response = await api.get(`/admin/doctors/${doctorId}/appointments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get doctor's patient history
  getDoctorPatientHistory: async (doctorId) => {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }
      const response = await api.get(`/admin/doctors/${doctorId}/patients`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Profile Management API functions
export const profileAPI = {
  // Patient Profile APIs
  getPatientPreFilledData: async () => {
    try {
      const response = await api.get('/patient/prefill-data');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createPatientProfile: async (profileData) => {
    try {
      const response = await api.post('/patient/create', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPatientProfile: async (patientId = null) => {
    try {
      const url = patientId ? `/patient/profile/${patientId}` : '/patient/profile';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updatePatientProfile: async (profileData) => {
    try {
      const response = await api.put('/patient/update', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPatientMedicalSummary: async () => {
    try {
      const response = await api.get('/patient/medical-summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  uploadPatientProfilePicture: async (imageData) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageData.uri,
        type: imageData.type,
        name: imageData.fileName || 'profile.jpg',
      });
      
      const response = await api.post('/patient/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Doctor Profile APIs
  createDoctorProfile: async (profileData) => {
    try {
      const response = await api.post('/doctor/create', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDoctorProfile: async (doctorId = null) => {
    try {
      const url = doctorId ? `/doctor/profile/${doctorId}` : '/doctor/profile';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateDoctorProfile: async (profileData) => {
    try {
      const response = await api.put('/doctor/update', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllDoctors: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/doctor/all?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDoctorAvailability: async (doctorId, date) => {
    try {
      const response = await api.get(`/doctor/availability/${doctorId}?date=${date}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  uploadDoctorProfilePicture: async (imageData) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageData.uri,
        type: imageData.type,
        name: imageData.fileName || 'profile.jpg',
      });
      
      const response = await api.post('/doctor/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Appointment API functions
export const appointmentAPI = {
  // Book appointment
  bookAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments/book', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get patient appointments
  getPatientAppointments: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/appointments/patient?${params}`);
      return response.data;
    } catch (error) {
      console.error('getPatientAppointments error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch patient appointments'
      };
    }
  },

  // Get doctor appointments
  getDoctorAppointments: async (filters = {}) => {
    try {
      console.log('getDoctorAppointments called with filters:', filters);
      const params = new URLSearchParams(filters).toString();
      const url = `/appointments/doctor?${params}`;
      console.log('Making API call to:', url);
      
      const response = await api.get(url);
      console.log('getDoctorAppointments raw response:', response);
      console.log('getDoctorAppointments response.data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('getDoctorAppointments error:', error);
      console.error('Error response:', error.response);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch doctor appointments'
      };
    }
  },

  // Get patient history (for doctors)
  getPatientHistory: async (patientId, filters = {}) => {
    try {
      console.log('📋 API: Getting patient history for ID:', patientId, 'with filters:', filters);
      const params = new URLSearchParams(filters).toString();
      const url = `/appointments/patient-history/${patientId}?${params}`;
      console.log('Making patient history API call to:', url);
      
      const response = await api.get(url);
      console.log('✅ API: Patient history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Get patient history error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch patient history'
      };
    }
  },

  // Get appointment details
  getAppointmentDetails: async (appointmentId) => {
    try {
      console.log('📋 API: Getting appointment details for ID:', appointmentId);
      const response = await api.get(`/appointments/${appointmentId}`);
      console.log('✅ API: Appointment details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Get appointment details error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    try {
      const response = await api.put(`/appointments/cancel/${appointmentId}`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update appointment status (for doctors)
  updateAppointmentStatus: async (appointmentId, status, medicalRecord = null) => {
    try {
      const response = await api.put(`/appointments/status/${appointmentId}`, {
        status,
        medicalRecord
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all appointments (admin only)
  getAllAppointments: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/appointments/admin/all?${params}`);
      return response.data;
    } catch (error) {
      console.error('getAllAppointments error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch all appointments'
      };
    }
  },

  // Approve appointment (doctor only)
  approveAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/appointments/approve/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reject appointment (doctor only)
  rejectAppointment: async (appointmentId, reason = {}) => {
    try {
      const response = await api.put(`/appointments/reject/${appointmentId}`, reason);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Complete appointment (doctor only)
  completeAppointment: async (appointmentId, medicalRecord = {}) => {
    try {
      const response = await api.put(`/appointments/complete/${appointmentId}`, { medicalRecord });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Move appointment to queue
  moveToQueue: async (appointmentId) => {
    try {
      const response = await api.put(`/appointments/queue/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Start processing appointment (doctor only)
  startProcessing: async (appointmentId) => {
    try {
      const response = await api.put(`/appointments/start/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Finish appointment (doctor only)
  finishAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/appointments/finish/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add prescription to finished appointment (doctor only)
  addPrescription: async (appointmentId, prescriptionData) => {
    try {
      const response = await api.put(`/appointments/prescription/${appointmentId}`, prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Queue API functions
export const queueAPI = {
  // Get doctor's queue
  getDoctorQueue: async (doctorId, date = null) => {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`/queue/doctor/${doctorId}${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get patient's queue position
  getPatientQueuePosition: async (appointmentId) => {
    try {
      const response = await api.get(`/queue/patient/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Call next patient
  callNextPatient: async (doctorId) => {
    try {
      const response = await api.post(`/queue/doctor/${doctorId}/call-next`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark patient as completed
  markPatientCompleted: async (appointmentId) => {
    try {
      const response = await api.put(`/queue/appointment/${appointmentId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Notification API functions
export const notificationAPI = {
  // Connect to notification stream
  connectToNotifications: (onMessage, onError) => {
    const token = AsyncStorage.getItem('authToken');
    const eventSource = new EventSource(`${BASE_URL}/notifications/stream`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      if (onError) onError(error);
    };

    return eventSource;
  },

  // Send test notification (admin only)
  sendTestNotification: async (userId, message) => {
    try {
      const response = await api.post('/notifications/test', { userId, message });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get notification stats (admin only)
  getNotificationStats: async () => {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Enhanced Admin API functions
export const enhancedAdminAPI = {
  // Get all doctor profiles
  getAllDoctorProfiles: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/doctors?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all patient profiles
  getAllPatientProfiles: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/patients?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update doctor verification status
  updateDoctorVerification: async (doctorId, verificationData) => {
    try {
      const response = await api.put(`/admin/doctors/${doctorId}/verification`, verificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update patient status
  updatePatientStatus: async (patientId, statusData) => {
    try {
      const response = await api.put(`/admin/patients/${patientId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get comprehensive dashboard stats
  getComprehensiveDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/comprehensive');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Onboarding API functions
export const onboardingAPI = {
  // Submit new user request
  submitUserRequest: async (requestData) => {
    try {
      const response = await api.post('/onboarding/request', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify existing user and send OTP
  verifyExistingUser: async (email) => {
    try {
      const response = await api.post('/onboarding/verify-existing', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify OTP for existing user
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/onboarding/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Default export with all APIs combined
const apiService = {
  ...authAPI,
  ...adminAPI,
  ...onboardingAPI,
  ...profileAPI,
  ...appointmentAPI,
  ...enhancedAdminAPI,
  ...queueAPI,
  ...notificationAPI,
};

export default apiService;

