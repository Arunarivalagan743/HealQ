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

const NewUserRequestScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    email: '',
    phone: '',
    role: '',
    address: '',
    specialization: '', // For doctors
    problem: '', // For patients
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ 
      ...prev, 
      role,
      // Clear role-specific fields when switching roles
      specialization: '',
      problem: '',
    }));
  };

  const validateForm = () => {
    const { fullName, age, email, phone, role, address, specialization, problem } = formData;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!age || isNaN(age) || parseInt(age) <= 0) {
      Alert.alert('Error', 'Please enter a valid age');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }

    if (!role) {
      Alert.alert('Error', 'Please select your role');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }

    if (role === 'Doctor' && !specialization.trim()) {
      Alert.alert('Error', 'Please enter your medical specialization');
      return false;
    }

    if (role === 'Patient' && !problem.trim()) {
      Alert.alert('Error', 'Please describe your medical concern');
      return false;
    }

    return true;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare form data with proper types
      const requestData = {
        ...formData,
        age: parseInt(formData.age), // Convert age to number
      };
      
      console.log('📤 Submitting user request:', requestData);
      const response = await onboardingAPI.submitUserRequest(requestData);
      console.log('📥 API Response:', response);
      
      if (response.success) {
        Alert.alert(
          'Request Submitted! ✅',
          'Your request has been submitted successfully. Our admin team will review it and notify you via email within 1-2 business days.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OnboardingChoice'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit request error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificField = () => {
    if (formData.role === 'Doctor') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medical Specialization *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Cardiology, Pediatrics, General Medicine"
            value={formData.specialization}
            onChangeText={(value) => handleInputChange('specialization', value)}
            editable={!loading}
          />
        </View>
      );
    }

    if (formData.role === 'Patient') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medical Concern *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Briefly describe your medical condition or reason for seeking treatment"
            value={formData.problem}
            onChangeText={(value) => handleInputChange('problem', value)}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle}>New User Request</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 1 of 2: Basic Information</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>👋 Welcome to HealQ!</Text>
            <Text style={styles.formSubtitle}>
              Please fill out the form below to request access to our clinic management system.
            </Text>

            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value)}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your complete address"
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Role Selection</Text>
              <Text style={styles.sectionSubtitle}>
                Choose your role in the clinic system:
              </Text>

              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    formData.role === 'Doctor' && styles.roleCardSelected,
                  ]}
                  onPress={() => handleRoleSelect('Doctor')}
                  disabled={loading}
                >
                  <Text style={styles.roleIcon}>👩‍⚕️</Text>
                  <Text style={[
                    styles.roleTitle,
                    formData.role === 'Doctor' && styles.roleTextSelected,
                  ]}>
                    Doctor
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    formData.role === 'Doctor' && styles.roleTextSelected,
                  ]}>
                    Medical professional providing healthcare services
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    formData.role === 'Patient' && styles.roleCardSelected,
                  ]}
                  onPress={() => handleRoleSelect('Patient')}
                  disabled={loading}
                >
                  <Text style={styles.roleIcon}>👤</Text>
                  <Text style={[
                    styles.roleTitle,
                    formData.role === 'Patient' && styles.roleTextSelected,
                  ]}>
                    Patient
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    formData.role === 'Patient' && styles.roleTextSelected,
                  ]}>
                    Individual seeking medical care and services
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Role-specific field */}
              {renderRoleSpecificField()}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmitRequest}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? '⏳ Submitting...' : '🚀 Submit Request'}
              </Text>
            </TouchableOpacity>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Your request will be reviewed by our admin team. You'll receive an email notification with the decision within 1-2 business days.
              </Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Fixed Bottom Back Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.bottomBackButton}
          >
            <Text style={styles.bottomBackButtonText}>← Go Back</Text>
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
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
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
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#495057',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
  },
  roleCardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F6FF',
  },
  roleIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  roleDescription: {
    fontSize: 11,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 16,
  },
  roleTextSelected: {
    color: '#4A90E2',
  },
  submitButton: {
    backgroundColor: '#28A745',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    backgroundColor: '#ADB5BD',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
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

export default NewUserRequestScreen;

