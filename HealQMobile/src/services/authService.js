import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
  }

  // Check email role (security feature)
  async checkEmailRole(email) {
    try {
      const response = await authAPI.checkEmailRole(email);
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Email not authorized',
      };
    }
  }

  // Initialize Firebase Auth listener
  initialize() {
    return new Promise((resolve) => {
      const unsubscribe = auth().onAuthStateChanged((user) => {
        this.currentUser = user;
        if (!this.isInitialized) {
          this.isInitialized = true;
          resolve(user);
        }
      });
      return unsubscribe;
    });
  }

  // Backend-only registration (fallback for network issues)
  async registerBackendOnly(email, password, name, specialization) {
    try {
      console.log('📡 Calling backend-only registration API...');
      // Direct backend registration without Firebase (role determined server-side)
      const response = await authAPI.registerBackendOnly({
        email,
        password,
        name,
        specialization,
      });

      console.log('📦 Backend response received:', response);

      // Store auth token and user role
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

      console.log('💾 Data stored in AsyncStorage');

      return {
        success: true,
        user: response.data.user,
        message: response.message,
      };
    } catch (error) {
      console.error('Backend registration error:', error.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
        errors: error.response?.data?.errors || error.errors || [],
      };
    }
  }

  // Register new user (with Firebase fallback)
  async register(email, password, name, specialization) {
    try {
      console.log('🔥 Attempting Firebase registration first...');
      // Try Firebase registration first
      const result = await this.registerWithFirebase(email, password, name, specialization);
      console.log('✅ Firebase registration successful!', result);
      return result;
    } catch (error) {
      console.error('❌ Firebase registration failed, trying backend-only:', error.message);
      console.log('🔍 Error analysis:', {
        message: error.message,
        hasNetworkError: error.message && error.message.includes('network-request-failed'),
        errorType: typeof error,
        errorKeys: Object.keys(error)
      });
      
      // If Firebase fails due to network issues, try backend-only
      if (error.message && (error.message.includes('network-request-failed') || error.message.includes('network error'))) {
        try {
          console.log('🔄 Attempting backend-only registration...');
          const backendResult = await this.registerBackendOnly(email, password, name, specialization);
          console.log('✅ Backend-only registration successful!', backendResult);
          return backendResult;
        } catch (backendError) {
          console.error('❌ Backend-only registration also failed:', backendError);
          throw backendError;
        }
      }
      
      console.log('❌ Not a network error, re-throwing original error');
      // Re-throw other errors
      throw error;
    }
  }

  // Original Firebase registration method
  async registerWithFirebase(email, password, name, specialization) {
    try {
      // Create user with Firebase
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update display name
      await user.updateProfile({
        displayName: name,
      });

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Register with backend (role is determined server-side)
      const response = await authAPI.register({
        email,
        name,
        specialization,
      }, idToken);

      // Store auth token and user role
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

      return {
        success: true,
        user: response.data.user,
        message: response.message,
      };
    } catch (error) {
      console.error('Registration error:', error.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // If backend registration fails, delete Firebase user
      if (this.currentUser) {
        try {
          await auth().currentUser.delete();
        } catch (deleteError) {
          console.error('Error deleting Firebase user:', deleteError);
        }
      }
      
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
        errors: error.response?.data?.errors || error.errors || [],
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      console.log('🔥 Attempting Firebase login first...');
      
      // Try Firebase login first
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Login with backend using Firebase token
      const response = await authAPI.login(email, idToken);

      // Store auth token and user role
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

      console.log('✅ Firebase login successful');
      return {
        success: true,
        user: response.data.user,
        message: response.message,
      };
    } catch (error) {
      console.log('❌ Firebase login failed, trying backend-only:', error.message);
      
      // If Firebase login fails, try backend-only login
      try {
        console.log('🔐 Attempting backend-only login...');
        
        const response = await authAPI.loginBackendOnly(email, password);

        // Store auth token and user role
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userRole', response.data.user.role);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

        console.log('✅ Backend-only login successful');
        return {
          success: true,
          user: response.data.user,
          message: response.message,
          backendOnly: true,
        };
      } catch (backendError) {
        console.error('❌ Both Firebase and backend login failed');
        console.error('Firebase error:', error.message);
        console.error('Backend error:', backendError.message || backendError);
        
        // Return the more specific error
        const finalError = backendError.message || backendError || error.message || 'Login failed';
        
        throw {
          success: false,
          message: typeof finalError === 'string' ? finalError : finalError.message || 'Login failed',
          errors: backendError.errors || [],
        };
      }
    }
  }

  // Logout user
  async logout() {
    try {
      // Only sign out from Firebase if there's a current user
      if (auth().currentUser) {
        await auth().signOut();
      }

      // Clear stored data
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userData']);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if Firebase logout fails, clear local storage
      try {
        await AsyncStorage.multiRemove(['authToken', 'userRole', 'userData']);
      } catch (storageError) {
        console.error('Storage clear error:', storageError);
      }
      
      throw {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  // Forgot password - using Firebase's built-in password reset
  async forgotPasswordFirebase(email) {
    try {
      await auth().sendPasswordResetEmail(email);
      return {
        success: true,
        message: 'Password reset email sent successfully. Please check your email.',
      };
    } catch (error) {
      console.error('Firebase password reset error:', error);
      throw {
        success: false,
        message: error.message || 'Failed to send password reset email',
      };
    }
  }

  // Forgot password - custom OTP flow (fallback)
  async forgotPassword(email) {
    try {
      console.log('📡 AuthService: Making forgot password API call for:', email);
      const response = await authAPI.forgotPassword(email);
      console.log('✅ AuthService: API response received:', response);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ AuthService: Forgot password error:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error));
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw {
        success: false,
        message: error.message || 'Failed to send reset email',
      };
    }
  }

  // Verify OTP
  async verifyOTP(email, otp) {
    try {
      const response = await authAPI.verifyOTP(email, otp);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw {
        success: false,
        message: error.message || 'OTP verification failed',
      };
    }
  }

  // Reset password with OTP
  async resetPassword(email, otp, newPassword) {
    try {
      const response = await authAPI.resetPassword(email, otp, newPassword);
      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      throw {
        success: false,
        message: error.message || 'Password reset failed',
      };
    }
  }

  // Get current user from storage
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user role from storage
  async getUserRole() {
    try {
      return await AsyncStorage.getItem('userRole');
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      // Try to verify token with a simple API call
      try {
        const response = await authAPI.getProfile();
        return !!response.data;
      } catch (error) {
        // Token is invalid/expired, clear it
        console.log('🚨 Token validation failed, clearing storage...');
        await AsyncStorage.multiRemove(['authToken', 'userRole', 'userData']);
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Get auth token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Refresh Firebase token
  async refreshToken() {
    try {
      if (this.currentUser) {
        const idToken = await this.currentUser.getIdToken(true);
        return idToken;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Get user profile from backend
  async getUserProfile() {
    try {
      const response = await authAPI.getProfile();
      
      // Update stored user data
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw {
        success: false,
        message: error.message || 'Failed to fetch profile',
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      // Update stored user data
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      return {
        success: true,
        user: response.data.user,
        message: response.message,
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw {
        success: false,
        message: error.message || 'Failed to update profile',
        errors: error.errors || [],
      };
    }
  }
}

export default new AuthService();

