import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Base URL for your backend API
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:5000/api' 
    : 'http://localhost:5000/api'
  : 'https://your-production-api-url.com/api';

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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear stored token and redirect to login
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      
      // You can emit an event here to redirect to login screen
      // or handle authentication failure globally
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
      // Use development endpoint that doesn't require auth for testing
      const response = await api.get('/admin/dashboard/stats-dev');
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
};

export default apiService;
