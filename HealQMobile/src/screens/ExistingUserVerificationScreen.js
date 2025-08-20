import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { onboardingAPI } from '../services/api';
import theme from '../config/theme';

const ExistingUserVerificationScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email input, 2: OTP verification
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await onboardingAPI.verifyExistingUser(email);
      
      if (response.success) {
        setUserInfo(response.data.user);
        setStep(2);
        Alert.alert(
          'Email Sent! 📧',
          `We found your profile! A verification code has been sent to ${email}. Please check your email and enter the 6-digit code below.`
        );
      } else {
        Alert.alert('Not Found', response.message || 'No approved profile found with this email address.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await onboardingAPI.verifyOTP(email, otp);
      
      if (response.success) {
        Alert.alert(
          'Verification Successful! ✅',
          'Your email has been verified. You can now proceed to register with your authorized credentials.',
          [
            {
              text: 'Continue to Registration',
              onPress: () => navigation.navigate('Register'),
            },
          ]
        );
      } else {
        Alert.alert('Invalid Code', response.message || 'The verification code is incorrect or has expired.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await onboardingAPI.verifyExistingUser(email);
      if (response.success) {
        Alert.alert('Code Resent! 📧', 'A new verification code has been sent to your email.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepIcon}>🔍</Text>
        <Text style={styles.stepTitle}>Find Your Profile</Text>
        <Text style={styles.stepDescription}>
          Enter your email address to check if you have an approved profile with us.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          autoFocus={true}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleEmailSubmit}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? '🔍 Checking...' : '🔍 Find My Profile'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoTextBold}>What happens next?</Text>
          {'\n'}If we find your approved profile, we'll send a verification code to your email address.
        </Text>
      </View>
    </View>
  );

  const renderOtpStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepIcon}>📧</Text>
        <Text style={styles.stepTitle}>Verify Your Email</Text>
        <Text style={styles.stepDescription}>
          We found your profile! Please enter the 6-digit verification code sent to your email.
        </Text>
      </View>

      {userInfo && (
        <View style={styles.userInfoCard}>
          <Text style={styles.userInfoTitle}>Profile Found:</Text>
          <Text style={styles.userInfoName}>{userInfo.name}</Text>
          <Text style={styles.userInfoRole}>{userInfo.role}</Text>
          <Text style={styles.userInfoEmail}>{userInfo.email}</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          editable={!loading}
          autoFocus={true}
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleOtpSubmit}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? '✅ Verifying...' : '✅ Verify Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleResendOtp}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Didn't receive code? Resend</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToEmailButton}
        onPress={() => setStep(1)}
        disabled={loading}
      >
        <Text style={styles.backToEmailText}>← Use different email</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>⏰</Text>
        <Text style={styles.infoText}>
          The verification code expires in 10 minutes for security reasons.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle}>Existing User</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Step {step} of 2: {step === 1 ? 'Email Verification' : 'OTP Confirmation'}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
            </View>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {step === 1 ? renderEmailStep() : renderOtpStep()}
          </View>
        </ScrollView>
        
        {/* Fixed Bottom Back Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            onPress={() => {
              if (step === 2) {
                setStep(1); // Go back to email step if on OTP step
              } else {
                navigation.goBack(); // Go back to previous screen if on email step
              }
            }} 
            style={styles.bottomBackButton}
          >
            <Text style={styles.bottomBackButtonText}>
              {step === 2 ? '← Back to Email' : '← Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: theme.fontFamily.sansMedium,
  },
  placeholder: {
    width: 50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  progressContainer: {
    paddingVertical: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: theme.fontFamily.sans,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17A2B8',
    borderRadius: 2,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepIcon: {
    fontSize: 40,
    marginBottom: 15,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: theme.fontFamily.sansMedium,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    fontFamily: theme.fontFamily.sans,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: theme.fontFamily.sans,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#495057',
    textAlign: 'center',
    fontFamily: theme.fontFamily.sans,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#17A2B8',
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    backgroundColor: '#FFFFFF',
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 8,
    fontFamily: theme.fontFamily.sansMedium,
  },
  userInfoCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  userInfoTitle: {
    fontSize: 12,
    color: '#155724',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 2,
  },
  userInfoRole: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '500',
    marginBottom: 2,
  },
  userInfoEmail: {
    fontSize: 12,
    color: '#6C757D',
  },
  primaryButton: {
    backgroundColor: '#17A2B8',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonDisabled: {
    backgroundColor: '#ADB5BD',
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#17A2B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  backToEmailButton: {
    paddingVertical: 5,
    marginBottom: 20,
  },
  backToEmailText: {
    color: '#6C757D',
    fontSize: 12,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F6FF',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    width: '100%',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomBackButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExistingUserVerificationScreen;

