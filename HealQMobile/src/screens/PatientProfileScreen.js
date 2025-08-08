import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Input, Button, Card } from '../components';
import { authAPI } from '../services/api';
import AuthService from '../services/authService';
import theme from '../config/theme';

const PatientProfileScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(route?.params?.viewMode || false);
  const [isAdmin, setIsAdmin] = useState(route?.params?.isAdmin || false);
  const [patientId, setPatientId] = useState(route?.params?.patientId || null);
  const [existingProfile, setExistingProfile] = useState(null);
  const [profileData, setProfileData] = useState({
    phoneNumber: '', // Add phone number field
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    medicalHistory: [],
    allergies: [],
    currentMedications: [],
    pastSurgeries: [],
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: ''
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      expiryDate: ''
    }
  });
  const [preFilledData, setPreFilledData] = useState({});
  const [readOnlyFields, setReadOnlyFields] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [currentMedicalField, setCurrentMedicalField] = useState('');

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other'];
  
  // Blood group options
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    if (viewMode && patientId) {
      // Admin viewing specific patient profile
      loadPatientProfileById(patientId);
    } else {
      // Patient creating/editing their own profile
      loadPreFilledData();
      checkExistingProfile();
    }
  }, [viewMode, patientId]);

  const loadPatientProfileById = async (id) => {
    try {
      setLoading(true);
      const response = await authAPI.getPatientProfile(id);
      console.log('Admin viewing patient profile:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.profile) {
        const profile = response.data.data.profile;
        setExistingProfile(profile);
        
        // Load profile data for display
        setProfileData({
          phoneNumber: profile.phoneNumber || '', // Add phone number here
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: profile.gender || '',
          bloodGroup: profile.bloodGroup || '',
          address: profile.address || {
            street: '',
            city: '',
            state: '',
            zipCode: ''
          },
          medicalHistory: profile.medicalHistory || [],
          allergies: profile.allergies || [],
          currentMedications: profile.currentMedications || [],
          pastSurgeries: profile.pastSurgeries || [],
          emergencyContact: profile.emergencyContact || {
            name: '',
            relationship: '',
            phoneNumber: '',
            email: ''
          },
          insurance: profile.insurance || {
            provider: '',
            policyNumber: '',
            groupNumber: '',
            expiryDate: ''
          }
        });
        
        if (profile.profilePicture) {
          setProfilePicture({ uri: profile.profilePicture });
        }
        
        // Set pre-filled data from user info
        setPreFilledData({
          name: profile.userId?.name || profile.name || '',
          email: profile.userId?.email || profile.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to load patient profile:', error);
      Alert.alert(
        'Error',
        'Failed to load patient profile. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPreFilledData = async () => {
    try {
      const response = await authAPI.getPatientPreFilledData();
      if (response.data.success) {
        const { preFilledData: data, readOnlyFields: readonly } = response.data.data;
        setPreFilledData(data);
        setReadOnlyFields(readonly || []);
        
        // Pre-fill form with available data
        setProfileData(prev => ({
          ...prev,
          // Don't override if user has already entered data
          dateOfBirth: prev.dateOfBirth || data.dateOfBirth || '',
          address: prev.address.city ? prev.address : (data.address || prev.address)
        }));
      }
    } catch (error) {
      console.error('Failed to load pre-filled data:', error);
    }
  };

  const checkExistingProfile = async () => {
    try {
      const response = await authAPI.getPatientProfile();
      console.log('Patient profile check response:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.profile) {
        // User already has a profile, redirect to view/edit mode
        Alert.alert(
          'Profile Exists',
          'You already have a patient profile. Redirecting to dashboard.',
          [
            {
              text: 'View Dashboard',
              onPress: () => navigation.replace('PatientDashboard')
            },
            {
              text: 'Edit Profile',
              onPress: () => loadExistingPatientProfile(response.data.data.profile)
            }
          ]
        );
      }
    } catch (error) {
      console.log('No existing profile found, continuing with creation:', error.response?.data?.message || error.message);
      // Profile doesn't exist, continue with creation
    }
  };

  const loadExistingPatientProfile = (profile) => {
    // Set existing profile for update mode
    setExistingProfile(profile);
    
    // Load existing profile data for editing
    setProfileData({
      phoneNumber: profile.phoneNumber || '', // Add phone number here
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      bloodGroup: profile.bloodGroup || '',
      address: profile.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      medicalHistory: profile.medicalHistory || [],
      allergies: profile.allergies || [],
      currentMedications: profile.currentMedications || [],
      pastSurgeries: profile.pastSurgeries || [],
      emergencyContact: profile.emergencyContact || {
        name: '',
        relationship: '',
        phoneNumber: '',
        email: ''
      },
      insurance: profile.insurance || {
        provider: '',
        policyNumber: '',
        groupNumber: '',
        expiryDate: ''
      }
    });
    
    if (profile.profilePicture) {
      setProfilePicture({ uri: profile.profilePicture });
    }
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

  const handleArrayFieldAdd = (field, item) => {
    setProfileData(prev => ({
      ...prev,
      [field]: [...prev[field], item]
    }));
  };

  const handleArrayFieldRemove = (field, index) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
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
      { field: 'dateOfBirth', message: 'Date of birth is required' },
      { field: 'gender', message: 'Gender is required' },
      { field: 'bloodGroup', message: 'Blood group is required' },
      { field: 'address.city', message: 'City is required' },
      { field: 'address.state', message: 'State is required' },
      { field: 'address.zipCode', message: 'ZIP code is required' },
      { field: 'emergencyContact.name', message: 'Emergency contact name is required' },
      { field: 'emergencyContact.relationship', message: 'Emergency contact relationship is required' },
      { field: 'emergencyContact.phoneNumber', message: 'Emergency contact phone is required' }
    ];

    for (let validation of requiredFields) {
      const value = validation.field.includes('.') ? 
        validation.field.split('.').reduce((obj, key) => obj && obj[key], profileData) : 
        profileData[validation.field];
      
      if (!value || value.trim() === '') {
        Alert.alert('Validation Error', validation.message);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let response;
      
      if (existingProfile) {
        // Update existing profile
        response = await authAPI.updatePatientProfile(profileData);
      } else {
        // Create new profile
        response = await authAPI.createPatientProfile(profileData);
      }
      
      if (response.success) {
        Alert.alert(
          'Success',
          existingProfile ? 'Profile updated successfully!' : 'Profile created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('PatientDashboard')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Profile operation error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = `Failed to ${existingProfile ? 'update' : 'create'} profile. Please try again.`;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        errorMessage = error.error || 'Unknown error occurred';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addMedicalItem = (type, item) => {
    switch (type) {
      case 'medicalHistory':
        handleArrayFieldAdd('medicalHistory', {
          condition: item.condition,
          diagnosedDate: item.diagnosedDate || null,
          status: item.status || 'Active'
        });
        break;
      case 'allergies':
        handleArrayFieldAdd('allergies', {
          allergen: item.allergen,
          severity: item.severity,
          reaction: item.reaction || ''
        });
        break;
      case 'currentMedications':
        handleArrayFieldAdd('currentMedications', {
          medicationName: item.medicationName,
          dosage: item.dosage,
          frequency: item.frequency,
          startDate: item.startDate || new Date(),
          prescribedBy: item.prescribedBy || ''
        });
        break;
      case 'pastSurgeries':
        handleArrayFieldAdd('pastSurgeries', {
          surgeryName: item.surgeryName,
          date: item.date,
          hospital: item.hospital || '',
          surgeon: item.surgeon || '',
          notes: item.notes || ''
        });
        break;
    }
  };

  const renderPreFilledInfo = () => {
    if (!preFilledData.name) return null;

    return (
      <Card style={styles.preFilledCard}>
        <Text style={styles.sectionTitle}>Pre-filled Information</Text>
        <Text style={styles.preFilledText}>
          <Text style={styles.label}>Name:</Text> {preFilledData.name} (Read-only)
        </Text>
        <Text style={styles.preFilledText}>
          <Text style={styles.label}>Email:</Text> {preFilledData.email} (Read-only)
        </Text>
        <Text style={styles.preFilledText}>
          <Text style={styles.label}>Phone:</Text> {preFilledData.phoneNumber}
        </Text>
        {preFilledData.userRequestInfo && (
          <Text style={styles.helperText}>
            Some information was pre-filled from your registration request.
          </Text>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>
          {viewMode && isAdmin 
            ? `Patient Profile - ${existingProfile?.userId?.name || existingProfile?.name || 'Unknown'}` 
            : existingProfile 
              ? 'Edit Your Profile' 
              : 'Create Your Profile'
          }
        </Text>
        <Text style={styles.subtitle}>
          {viewMode && isAdmin 
            ? `Viewing patient profile details (ID: ${existingProfile?.patientId || 'N/A'})` 
            : existingProfile 
              ? 'Update your profile information below' 
              : 'Complete your profile to book appointments with doctors'
          }
        </Text>

        {renderPreFilledInfo()}

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

        {/* Personal Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label="Phone Number *"
            value={profileData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            editable={!viewMode}
          />
          
          <Input
            label="Date of Birth *"
            value={profileData.dateOfBirth}
            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
            editable={!viewMode}
          />

          <Text style={styles.label}>Gender *</Text>
          <View style={styles.optionsContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  profileData.gender === option && styles.selectedOption,
                  viewMode && styles.disabledOption
                ]}
                onPress={() => !viewMode && handleInputChange('gender', option)}
                disabled={viewMode}
              >
                <Text style={[
                  styles.optionText,
                  profileData.gender === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Blood Group *</Text>
          <View style={styles.optionsContainer}>
            {bloodGroupOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  profileData.bloodGroup === option && styles.selectedOption,
                  viewMode && styles.disabledOption
                ]}
                onPress={() => !viewMode && handleInputChange('bloodGroup', option)}
                disabled={viewMode}
              >
                <Text style={[
                  styles.optionText,
                  profileData.bloodGroup === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Address Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Address</Text>
          
          <Input
            label="Street Address"
            value={profileData.address.street}
            onChangeText={(value) => handleInputChange('address', value, 'street')}
            placeholder="Enter street address"
            multiline
            editable={!viewMode}
          />

          <Input
            label="City *"
            value={profileData.address.city}
            onChangeText={(value) => handleInputChange('address', value, 'city')}
            placeholder="Enter city"
            editable={!viewMode}
          />

          <Input
            label="State *"
            value={profileData.address.state}
            onChangeText={(value) => handleInputChange('address', value, 'state')}
            placeholder="Enter state"
            editable={!viewMode}
          />

          <Input
            label="ZIP Code *"
            value={profileData.address.zipCode}
            onChangeText={(value) => handleInputChange('address', value, 'zipCode')}
            placeholder="Enter ZIP code"
            keyboardType="numeric"
            editable={!viewMode}
          />
        </Card>

        {/* Emergency Contact */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <Input
            label="Contact Name *"
            value={profileData.emergencyContact.name}
            onChangeText={(value) => handleInputChange('emergencyContact', value, 'name')}
            placeholder="Enter contact name"
            editable={!viewMode}
          />

          <Input
            label="Relationship *"
            value={profileData.emergencyContact.relationship}
            onChangeText={(value) => handleInputChange('emergencyContact', value, 'relationship')}
            placeholder="e.g., Spouse, Parent, Sibling"
            editable={!viewMode}
          />

          <Input
            label="Phone Number *"
            value={profileData.emergencyContact.phoneNumber}
            onChangeText={(value) => handleInputChange('emergencyContact', value, 'phoneNumber')}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            editable={!viewMode}
          />

          <Input
            label="Email (Optional)"
            value={profileData.emergencyContact.email}
            onChangeText={(value) => handleInputChange('emergencyContact', value, 'email')}
            placeholder="Enter email address"
            keyboardType="email-address"
            editable={!viewMode}
          />
        </Card>

        {/* Medical Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Medical Information (Optional)</Text>
          <Text style={styles.helperText}>
            You can add this information later from your profile settings
          </Text>
          
          {/* Medical History */}
          <View style={styles.medicalSection}>
            <Text style={styles.label}>Medical History</Text>
            {profileData.medicalHistory.map((item, index) => (
              <View key={index} style={styles.medicalItem}>
                <Text>{item.condition} ({item.status})</Text>
                {!viewMode && (
                  <TouchableOpacity
                    onPress={() => handleArrayFieldRemove('medicalHistory', index)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Allergies */}
          <View style={styles.medicalSection}>
            <Text style={styles.label}>Allergies</Text>
            {profileData.allergies.map((item, index) => (
              <View key={index} style={styles.medicalItem}>
                <Text>{item.allergen} ({item.severity})</Text>
                {!viewMode && (
                  <TouchableOpacity
                    onPress={() => handleArrayFieldRemove('allergies', index)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          {/* Only show create/edit button if not in admin view mode */}
          {!viewMode && (
            <Button
              title={loading ? "Processing..." : existingProfile ? "Update Profile" : "Create Profile"}
              onPress={handleSubmit}
              disabled={loading}
              style={styles.submitButton}
            />
          )}
        </View>
      </ScrollView>
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
  preFilledCard: {
    backgroundColor: theme.colors.success + '15',
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
  preFilledText: {
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
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disabledOption: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    opacity: 0.6,
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
  medicalSection: {
    marginBottom: 15,
  },
  medicalItem: {
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  submitButton: {
    flex: 2,
    marginTop: 0,
    marginBottom: 0,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PatientProfileScreen;

