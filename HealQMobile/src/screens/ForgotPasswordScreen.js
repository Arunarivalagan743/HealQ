import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import authService from '../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    const newErrors = {};
    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      // Use cleaned email for the API call
      const cleanedEmail = formData.email.trim().toLowerCase();
      console.log('🔍 Attempting forgot password for email:', cleanedEmail);
      
      // Skip Firebase and go directly to backend OTP system
      // Firebase password reset emails are not being delivered reliably
      console.log('📡 Using backend OTP system directly...');
      
      const result = await authService.forgotPassword(cleanedEmail);
      console.log('✅ Backend OTP response:', result);
      Alert.alert('OTP Sent', result.message, [
        { text: 'OK', onPress: () => setCurrentStep(2) }
      ]);
      
    } catch (error) {
      console.error('❌ Forgot password flow failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show more specific error message
      let errorMessage = 'Failed to send password reset. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP()) return;

    setLoading(true);
    try {
      // Use cleaned email for the API call
      const cleanedEmail = formData.email.trim().toLowerCase();
      const result = await authService.verifyOTP(cleanedEmail, formData.otp);
      Alert.alert('OTP Verified', result.message, [
        { text: 'OK', onPress: () => setCurrentStep(3) }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      // Use cleaned email for the API call
      const cleanedEmail = formData.email.trim().toLowerCase();
      console.log('🔐 Attempting password reset...');
      
      const result = await authService.resetPassword(
        cleanedEmail,
        formData.otp,
        formData.newPassword
      );
      
      console.log('✅ Password reset successful:', result);
      
      // Show success message and navigate to login
      Alert.alert(
        'Password Reset Successful', 
        'Your password has been updated successfully. You can now login with your new password.', 
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form and navigate to login
              setFormData({
                email: '',
                otp: '',
                newPassword: '',
                confirmPassword: '',
              });
              setCurrentStep(1);
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      
      // Show more specific error message
      let errorMessage = 'Password reset failed. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    // Clean email field - trim whitespace and convert to lowercase
    const cleanedValue = field === 'email' ? value.trim().toLowerCase() : value;
    setFormData(prev => ({ ...prev, [field]: cleanedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Reset Your Password</Text>
      <Text style={styles.stepDescription}>
        We'll send you a verification code to reset your password.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending OTP...' : 'Send Verification Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Enter Verification Code</Text>
      <Text style={styles.stepDescription}>
        We've sent a 6-digit code to {formData.email}. The code expires in 5 minutes.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={[styles.input, styles.otpInput, errors.otp && styles.inputError]}
          placeholder="000000"
          value={formData.otp}
          onChangeText={(text) => updateFormData('otp', text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
        />
        {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentStep(1)}
      >
        <Text style={styles.secondaryButtonText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Set New Password</Text>
      <Text style={styles.stepDescription}>
        Create a strong password for your account.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={[styles.input, errors.newPassword && styles.inputError]}
          placeholder="Enter new password"
          value={formData.newPassword}
          onChangeText={(text) => updateFormData('newPassword', text)}
          secureTextEntry
          autoCapitalize="none"
        />
        {errors.newPassword && (
          <Text style={styles.errorText}>{errors.newPassword}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData('confirmPassword', text)}
          secureTextEntry
          autoCapitalize="none"
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Reset Password</Text>
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 20,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e6ed',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#667eea',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e6ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#6c757d',
    fontSize: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
});

export default ForgotPasswordScreen;
