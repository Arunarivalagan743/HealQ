import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import theme from '../config/theme';
import api from '../services/api';
import authService from '../services/authService';

const ProfileManagementScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    // Common fields
    name: '',
    email: '',
    phoneNumber: '',
    
    // Patient-specific fields
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    
    // Doctor-specific fields
    specialty: '',
    experience: '',
    education: [],
    qualifications: '',
    bio: '',
    consultationFee: '',
    availability: [],
    clinicName: '',
    clinicAddress: '',
    acceptsInsurance: false,
  });

  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setUserRole(userData.role);

      // Load existing profile data
      let profileResponse;
      if (userData.role === 'patient') {
        profileResponse = await api.getPatientProfile();
      } else if (userData.role === 'doctor') {
        profileResponse = await api.getDoctorProfile();
      }

      if (profileResponse?.success && profileResponse.data) {
        setProfile(prevProfile => ({
          ...prevProfile,
          ...profileResponse.data,
          name: userData.name || profileResponse.data.name || '',
          email: userData.email || profileResponse.data.email || '',
        }));
      } else {
        // Set basic user info if no profile exists
        setProfile(prevProfile => ({
          ...prevProfile,
          name: userData.name || '',
          email: userData.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      [field]: value,
    }));
  };

  const validateProfile = () => {
    if (!profile.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }

    if (!profile.phoneNumber?.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }

    if (userRole === 'patient') {
      if (!profile.dateOfBirth) {
        Alert.alert('Error', 'Date of birth is required');
        return false;
      }
      if (!profile.address?.trim()) {
        Alert.alert('Error', 'Address is required');
        return false;
      }
    } else if (userRole === 'doctor') {
      if (!profile.specialty?.trim()) {
        Alert.alert('Error', 'Medical specialty is required');
        return false;
      }
      if (!profile.experience) {
        Alert.alert('Error', 'Years of experience is required');
        return false;
      }
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setSaving(true);
    try {
      let response;
      if (userRole === 'patient') {
        response = await api.createOrUpdatePatientProfile(profile);
      } else if (userRole === 'doctor') {
        response = await api.createOrUpdateDoctorProfile(profile);
      }

      if (response?.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderCommonFields = () => (
    <>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Input
        label="Full Name *"
        value={profile.name}
        onChangeText={(value) => handleInputChange('name', value)}
        placeholder="Enter your full name"
        style={styles.input}
      />
      
      <Input
        label="Email"
        value={profile.email}
        editable={false}
        placeholder="Email address"
        style={[styles.input, styles.disabledInput]}
      />
      
      <Input
        label="Phone Number *"
        value={profile.phoneNumber}
        onChangeText={(value) => handleInputChange('phoneNumber', value)}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        style={styles.input}
      />
    </>
  );

  const renderPatientFields = () => (
    <>
      <Text style={styles.sectionTitle}>Patient Information</Text>
      
      <Input
        label="Date of Birth *"
        value={profile.dateOfBirth}
        onChangeText={(value) => handleInputChange('dateOfBirth', value)}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />
      
      <Input
        label="Gender"
        value={profile.gender}
        onChangeText={(value) => handleInputChange('gender', value)}
        placeholder="Gender"
        style={styles.input}
      />
      
      <Input
        label="Address *"
        value={profile.address}
        onChangeText={(value) => handleInputChange('address', value)}
        placeholder="Enter your address"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <Input
        label="Emergency Contact"
        value={profile.emergencyContact}
        onChangeText={(value) => handleInputChange('emergencyContact', value)}
        placeholder="Emergency contact name and phone"
        style={styles.input}
      />
      
      <Text style={styles.sectionTitle}>Medical Information</Text>
      
      <Input
        label="Medical History"
        value={profile.medicalHistory}
        onChangeText={(value) => handleInputChange('medicalHistory', value)}
        placeholder="Brief medical history"
        multiline
        numberOfLines={4}
        style={styles.input}
      />
      
      <Input
        label="Allergies"
        value={profile.allergies}
        onChangeText={(value) => handleInputChange('allergies', value)}
        placeholder="Known allergies"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <Input
        label="Current Medications"
        value={profile.currentMedications}
        onChangeText={(value) => handleInputChange('currentMedications', value)}
        placeholder="Current medications"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </>
  );

  const renderDoctorFields = () => (
    <>
      <Text style={styles.sectionTitle}>Professional Information</Text>
      
      <Input
        label="Medical Specialty *"
        value={profile.specialty}
        onChangeText={(value) => handleInputChange('specialty', value)}
        placeholder="e.g., Cardiology, Dermatology"
        style={styles.input}
      />
      
      <Input
        label="Years of Experience *"
        value={profile.experience?.toString() || ''}
        onChangeText={(value) => handleInputChange('experience', parseInt(value) || 0)}
        placeholder="Years of experience"
        keyboardType="numeric"
        style={styles.input}
      />
      
      <Input
        label="Qualifications"
        value={profile.qualifications}
        onChangeText={(value) => handleInputChange('qualifications', value)}
        placeholder="Medical degrees and certifications"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <Input
        label="Professional Bio"
        value={profile.bio}
        onChangeText={(value) => handleInputChange('bio', value)}
        placeholder="Brief professional summary"
        multiline
        numberOfLines={4}
        style={styles.input}
      />
      
      <Text style={styles.sectionTitle}>Practice Information</Text>
      
      <Input
        label="Consultation Fee"
        value={profile.consultationFee?.toString() || ''}
        onChangeText={(value) => handleInputChange('consultationFee', parseFloat(value) || 0)}
        placeholder="Consultation fee (USD)"
        keyboardType="numeric"
        style={styles.input}
      />
      
      <Input
        label="Clinic Name"
        value={profile.clinicName}
        onChangeText={(value) => handleInputChange('clinicName', value)}
        placeholder="Name of your clinic/hospital"
        style={styles.input}
      />
      
      <Input
        label="Clinic Address"
        value={profile.clinicAddress}
        onChangeText={(value) => handleInputChange('clinicAddress', value)}
        placeholder="Clinic address"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Accepts Insurance</Text>
        <Switch
          value={profile.acceptsInsurance}
          onValueChange={(value) => handleInputChange('acceptsInsurance', value)}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={profile.acceptsInsurance ? theme.colors.white : theme.colors.textSecondary}
        />
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          {renderCommonFields()}
          
          {userRole === 'patient' && renderPatientFields()}
          {userRole === 'doctor' && renderDoctorFields()}
          
          <Button
            title={saving ? 'Saving...' : 'Save Profile'}
            onPress={handleSaveProfile}
            disabled={saving}
            style={styles.saveButton}
          />
          
          {saving && (
            <ActivityIndicator 
              size="small" 
              color={theme.colors.primary} 
              style={styles.loader}
            />
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontFamily: theme.fontFamily.sans,
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.sans,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: theme.colors.surface,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  switchLabel: {
    fontFamily: theme.fontFamily.sansMedium,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
});

export default ProfileManagementScreen;

