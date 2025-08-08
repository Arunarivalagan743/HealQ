import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Input, Button, Card } from '../components';
import { authAPI } from '../services/api';
import authService from '../services/authService';
import theme from '../config/theme';

const DoctorProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    phoneNumber: '',
    specialization: '',
    experience: '',
    consultationFee: '',
    licenseNumber: '',
    workingDays: [],
    workingHours: {
      start: '',
      end: ''
    },
    breakTimes: [],
    maxAppointmentsPerSlot: '1',
    slotDuration: '30',
    clinicAddress: '',
    consultationMode: 'In-person',
    bio: ''
  });
  const [userInfo, setUserInfo] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState(null);
  const [showBreakTimeModal, setShowBreakTimeModal] = useState(false);
  const [newBreakTime, setNewBreakTime] = useState({ start: '', end: '' });

  // Specialization options
  const specializationOptions = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Dentistry',
    'Physiotherapy'
  ];

  // Days of week
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  // Consultation modes
  const consultationModes = ['In-person', 'Online', 'Both'];

  // Slot durations
  const slotDurations = [
    { label: '15 minutes', value: '15' },
    { label: '30 minutes', value: '30' },
    { label: '45 minutes', value: '45' },
    { label: '60 minutes', value: '60' }
  ];

  useEffect(() => {
    loadUserInfo();
    checkExistingProfile();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUserInfo(userData || {});
      
      // Pre-fill phone number if available
      if (userData && (userData.phone || userData.phoneNumber)) {
        setProfileData(prev => ({
          ...prev,
          phoneNumber: userData.phone || userData.phoneNumber || ''
        }));
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const checkExistingProfile = async () => {
    try {
      console.log('🔍 Checking for existing doctor profile...');
      
      // First, let's check what user data we have
      const currentUser = await authService.getCurrentUser();
      console.log('👤 Current user data:', currentUser);
      
      const authToken = await authService.getAuthToken();
      console.log('🔑 Auth token exists:', !!authToken);
      
      const response = await authAPI.getDoctorProfile();
      console.log('📋 Profile response:', response);
      console.log('📋 Profile response data:', response.data);
      
      if (response.data && response.data.success && response.data.data && response.data.data.profile) {
        console.log('✅ Profile found');
        const profile = response.data.data.profile;
        
        // Show profile details and options
        Alert.alert(
          'Profile Found!',
          `Profile Status: ${profile.isVerified ? 'Verified' : 'Pending Verification'}\nDoctor ID: ${profile.doctorId}\nSpecialization: ${profile.specialization}`,
          [
            {
              text: 'View Dashboard',
              onPress: () => navigation.replace('DoctorDashboard')
            },
            {
              text: 'Load for Editing',
              onPress: () => loadExistingProfileForEdit(profile)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        console.log('❌ No profile found in response');
        console.log('❌ Response structure:', JSON.stringify(response, null, 2));
        Alert.alert(
          'No Profile Found',
          'You don\'t have a doctor profile yet. You can create one using the form below.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Profile doesn't exist, continue with creation
      console.log('❌ Error checking profile:', error);
      console.log('❌ Error details:', error.response?.data || error.message);
      Alert.alert(
        'No Profile Found',
        'You don\'t have a doctor profile yet. You can create one using the form below.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadExistingProfileForEdit = (profile) => {
    // Set edit mode and store profile ID
    setIsEditMode(true);
    setExistingProfileId(profile._id);
    
    // Load the existing profile data into the form for editing
    setProfileData({
      phoneNumber: profile.phoneNumber || '',
      specialization: profile.specialization || '',
      experience: profile.experience?.toString() || '',
      consultationFee: profile.consultationFee?.toString() || '',
      licenseNumber: profile.licenseNumber || '',
      workingDays: profile.workingDays || [],
      workingHours: profile.workingHours || { start: '', end: '' },
      breakTimes: profile.breakTimes || [],
      maxAppointmentsPerSlot: profile.maxAppointmentsPerSlot?.toString() || '1',
      slotDuration: profile.slotDuration?.toString() || '30',
      clinicAddress: profile.clinicAddress || '',
      consultationMode: profile.consultationMode || 'In-person',
      bio: profile.bio || ''
    });
    
    Alert.alert(
      'Profile Loaded',
      'Your existing profile has been loaded into the form. You can now edit and update it.',
      [{ text: 'OK' }]
    );
  };

  const handleInputChange = (field, value, subField = null) => {
    if (subField) {
      setProfileData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const toggleWorkingDay = (day) => {
    setProfileData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const addBreakTime = () => {
    if (newBreakTime.start && newBreakTime.end) {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(newBreakTime.start) || !timeRegex.test(newBreakTime.end)) {
        Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 12:00)');
        return;
      }
      
      setProfileData(prev => ({
        ...prev,
        breakTimes: [...prev.breakTimes, { ...newBreakTime }]
      }));
      setNewBreakTime({ start: '', end: '' });
      setShowBreakTimeModal(false);
    } else {
      Alert.alert('Incomplete', 'Please fill in both start and end times');
    }
  };

  const removeBreakTime = (index) => {
    setProfileData(prev => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index)
    }));
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const selectProfilePicture = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        setProfilePicture(response.assets[0]);
      }
    });
  };

  const validateForm = () => {
    const requiredFields = [
      { field: 'phoneNumber', message: 'Phone number is required' },
      { field: 'specialization', message: 'Specialization is required' },
      { field: 'experience', message: 'Experience is required' },
      { field: 'consultationFee', message: 'Consultation fee is required' },
      { field: 'licenseNumber', message: 'License number is required' },
      { field: 'workingHours.start', message: 'Working start time is required' },
      { field: 'workingHours.end', message: 'Working end time is required' },
      { field: 'clinicAddress', message: 'Clinic address is required' }
    ];

    for (let validation of requiredFields) {
      const value = validation.field.includes('.') ? 
        validation.field.split('.').reduce((obj, key) => obj && obj[key], profileData) : 
        profileData[validation.field];
      
      if (!value || value.toString().trim() === '') {
        Alert.alert('Validation Error', validation.message);
        return false;
      }
    }

    if (profileData.workingDays.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one working day');
      return false;
    }

    // Validate time format for working hours
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(profileData.workingHours.start)) {
      Alert.alert('Validation Error', 'Start time must be in HH:MM format (e.g., 09:00)');
      return false;
    }
    if (!timeRegex.test(profileData.workingHours.end)) {
      Alert.alert('Validation Error', 'End time must be in HH:MM format (e.g., 17:00)');
      return false;
    }

    // Validate that end time is after start time
    const startMinutes = timeToMinutes(profileData.workingHours.start);
    const endMinutes = timeToMinutes(profileData.workingHours.end);
    if (endMinutes <= startMinutes) {
      Alert.alert('Validation Error', 'End time must be after start time');
      return false;
    }

    if (parseInt(profileData.experience) < 0 || parseInt(profileData.experience) > 50) {
      Alert.alert('Validation Error', 'Experience must be between 0 and 50 years');
      return false;
    }

    if (parseFloat(profileData.consultationFee) <= 0) {
      Alert.alert('Validation Error', 'Consultation fee must be greater than 0');
      return false;
    }

    // Validate phone number format
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(profileData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      Alert.alert('Validation Error', 'Please enter a valid phone number (10-15 digits)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data
      const submitData = {
        ...profileData,
        experience: parseInt(profileData.experience),
        consultationFee: parseFloat(profileData.consultationFee),
        maxAppointmentsPerSlot: parseInt(profileData.maxAppointmentsPerSlot),
        slotDuration: parseInt(profileData.slotDuration)
      };

      let response;
      if (isEditMode && existingProfileId) {
        // Update existing profile
        response = await authAPI.updateDoctorProfile(existingProfileId, submitData);
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('DoctorDashboard')
            }
          ]
        );
      } else {
        // Create new profile
        response = await authAPI.createDoctorProfile(submitData);
        
        if (response.data.success) {
          Alert.alert(
            'Success',
            'Profile created successfully! Your profile will be reviewed by admin before activation.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('DoctorDashboard')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Profile creation/update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderUserInfo = () => {
    return (
      <Card style={styles.userInfoCard}>
        <Text style={styles.sectionTitle}>Auto-filled Information</Text>
        <Text style={styles.userInfoText}>
          <Text style={styles.label}>Name:</Text> {userInfo.name} (Read-only)
        </Text>
        <Text style={styles.userInfoText}>
          <Text style={styles.label}>Email:</Text> {userInfo.email} (Read-only)
        </Text>
        <Text style={styles.helperText}>
          This information is taken from your account and cannot be changed here.
        </Text>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Doctor Profile' : 'Create Doctor Profile'}
        </Text>
        <Text style={styles.subtitle}>
          Complete your professional profile to start accepting appointments
        </Text>

        {/* Check Existing Profile Button */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Already Have a Profile?</Text>
          <Text style={styles.helperText}>
            If you've already created a profile, click below to view/edit it.
          </Text>
          <Button
            title="Check Existing Profile"
            onPress={checkExistingProfile}
            style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          />
        </Card>

        {renderUserInfo()}

        {/* Phone Number */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Input
            label="Phone Number *"
            value={profileData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Profile Picture */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Picture (Optional)</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={selectProfilePicture}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture.uri }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {/* Professional Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          <Text style={styles.label}>Specialization *</Text>
          <View style={styles.optionsContainer}>
            {specializationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  profileData.specialization === option && styles.selectedOption
                ]}
                onPress={() => handleInputChange('specialization', option)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.specialization === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Years of Experience *"
            value={profileData.experience}
            onChangeText={(value) => handleInputChange('experience', value)}
            placeholder="e.g., 5"
            keyboardType="numeric"
          />

          <Input
            label="Consultation Fee (₹) *"
            value={profileData.consultationFee}
            onChangeText={(value) => handleInputChange('consultationFee', value)}
            placeholder="e.g., 500"
            keyboardType="numeric"
          />

          <Input
            label="Medical License Number *"
            value={profileData.licenseNumber}
            onChangeText={(value) => handleInputChange('licenseNumber', value)}
            placeholder="Enter your license number"
          />

          <Input
            label="Bio (Optional)"
            value={profileData.bio}
            onChangeText={(value) => handleInputChange('bio', value)}
            placeholder="Tell patients about yourself..."
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Working Schedule */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Working Schedule</Text>
          
          <Text style={styles.label}>Working Days *</Text>
          <View style={styles.optionsContainer}>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  profileData.workingDays.includes(day) && styles.selectedOption
                ]}
                onPress={() => toggleWorkingDay(day)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.workingDays.includes(day) && styles.selectedOptionText
                ]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Input
                label="Start Time *"
                value={profileData.workingHours.start}
                onChangeText={(value) => handleInputChange('workingHours', value, 'start')}
                placeholder="09:00"
              />
            </View>
            <View style={styles.timeInput}>
              <Input
                label="End Time *"
                value={profileData.workingHours.end}
                onChangeText={(value) => handleInputChange('workingHours', value, 'end')}
                placeholder="17:00"
              />
            </View>
          </View>

          <Text style={styles.label}>Slot Duration *</Text>
          <View style={styles.optionsContainer}>
            {slotDurations.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  profileData.slotDuration === option.value && styles.selectedOption
                ]}
                onPress={() => handleInputChange('slotDuration', option.value)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.slotDuration === option.value && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Max Appointments per Slot"
            value={profileData.maxAppointmentsPerSlot}
            onChangeText={(value) => handleInputChange('maxAppointmentsPerSlot', value)}
            placeholder="1"
            keyboardType="numeric"
          />

          {/* Break Times */}
          <View style={styles.breakTimeSection}>
            <Text style={styles.label}>Break Times (Optional)</Text>
            {profileData.breakTimes.map((breakTime, index) => (
              <View key={index} style={styles.breakTimeItem}>
                <Text>{breakTime.start} - {breakTime.end}</Text>
                <TouchableOpacity onPress={() => removeBreakTime(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Button
              title="Add Break Time"
              onPress={() => setShowBreakTimeModal(true)}
              style={styles.addButton}
            />
          </View>
        </Card>

        {/* Clinic Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Clinic Information</Text>
          
          <Input
            label="Clinic Address *"
            value={profileData.clinicAddress}
            onChangeText={(value) => handleInputChange('clinicAddress', value)}
            placeholder="Enter complete clinic address"
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Consultation Mode *</Text>
          <View style={styles.optionsContainer}>
            {consultationModes.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.optionButton,
                  profileData.consultationMode === mode && styles.selectedOption
                ]}
                onPress={() => handleInputChange('consultationMode', mode)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.consultationMode === mode && styles.selectedOptionText
                ]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          title={loading ? 
            (isEditMode ? "Updating Profile..." : "Creating Profile...") : 
            (isEditMode ? "Update Profile" : "Create Profile")
          }
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />

        {/* Back Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Break Time Modal */}
      {showBreakTimeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Break Time</Text>
            <Input
              label="Start Time"
              value={newBreakTime.start}
              onChangeText={(value) => setNewBreakTime(prev => ({ ...prev, start: value }))}
              placeholder="13:00"
            />
            <Input
              label="End Time"
              value={newBreakTime.end}
              onChangeText={(value) => setNewBreakTime(prev => ({ ...prev, end: value }))}
              placeholder="14:00"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowBreakTimeModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
              />
              <Button
                title="Add"
                onPress={addBreakTime}
                style={[styles.modalButton, styles.addModalButton]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  userInfoCard: {
    backgroundColor: theme.colors.primary + '15',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 10,
  },
  userInfoText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  selectedOptionText: {
    color: theme.colors.white,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeInput: {
    flex: 0.45,
  },
  breakTimeSection: {
    marginTop: 15,
  },
  breakTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  removeText: {
    color: theme.colors.error,
    fontSize: 12,
  },
  addButton: {
    backgroundColor: theme.colors.surface,
    marginTop: 10,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 100,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 0.45,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  addModalButton: {
    backgroundColor: theme.colors.primary,
  },
});

export default DoctorProfileScreen;

