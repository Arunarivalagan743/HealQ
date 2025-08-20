import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import { authAPI } from '../services/api';
import theme from '../config/theme';

const PatientDoctorView = ({ route, navigation }) => {
  const { doctorId, doctorName, doctorSpecialty } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      // Use the verified doctors endpoint for patient view (public access)
      const response = await authAPI.getAllDoctors({ doctorId: doctorId });
      
      if (response.success && response.data && response.data.doctors && response.data.doctors.length > 0) {
        setDoctor(response.data.doctors[0]);
      } else {
        // Fallback: try the doctor profile endpoint
        try {
          const profileResponse = await authAPI.getDoctorProfile(doctorId);
          if (profileResponse.success && profileResponse.data) {
            setDoctor(profileResponse.data);
          } else {
            throw new Error('No doctor data found');
          }
        } catch (profileError) {
          console.warn('Profile endpoint also failed:', profileError.message);
          // Use fallback data from route params
          setDoctor({
            _id: doctorId,
            name: doctorName,
            specialization: doctorSpecialty,
            experience: 'Not available years',
            consultationFee: 'Contact for details',
            workingDays: [],
            workingHours: {},
            rating: { average: 0, count: 0 }
          });
        }
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
      // Use fallback data if API fails
      setDoctor({
        _id: doctorId,
        name: doctorName,
        specialization: doctorSpecialty,
        experience: 'Not available years',
        consultationFee: 'Contact for details',
        workingDays: [],
        workingHours: {},
        rating: { average: 0, count: 0 }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDoctorData();
  };

  const handleBookAppointment = () => {
    navigation.navigate('AppointmentBooking', {
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization,
      consultationFee: doctor.consultationFee
    });
  };

  const formatDays = (days) => {
    if (!days || days.length === 0) return 'Contact for schedule';
    return days.join(', ');
  };

  const formatTime = (timeObj) => {
    if (!timeObj || !timeObj.start || !timeObj.end) {
      return 'Contact for timings';
    }
    return `${timeObj.start} - ${timeObj.end}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Doctor Details...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Doctor details not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Doctor Header */}
        <Card style={styles.headerCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
              {doctor.doctorId && (
                <Text style={styles.doctorId}>ID: {doctor.doctorId}</Text>
              )}
            </View>
            
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>
                ⭐ {doctor.rating?.average ? doctor.rating.average.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.reviewCount}>
                ({doctor.rating?.count || 0} reviews)
              </Text>
              {doctor.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Professional Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Experience:</Text>
            <Text style={styles.value}>{doctor.experience || 0} years</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Consultation Fee:</Text>
            <Text style={styles.value}>
              {typeof doctor.consultationFee === 'number' 
                ? `₹${doctor.consultationFee}` 
                : doctor.consultationFee}
            </Text>
          </View>
          
          {doctor.licenseNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>License Number:</Text>
              <Text style={styles.value}>{doctor.licenseNumber}</Text>
            </View>
          )}
        </Card>

        {/* Schedule Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule & Availability</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Working Days:</Text>
            <Text style={styles.value}>{formatDays(doctor.workingDays)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Working Hours:</Text>
            <Text style={styles.value}>{formatTime(doctor.workingHours)}</Text>
          </View>
          
          {doctor.consultationMode && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Consultation Mode:</Text>
              <Text style={styles.value}>{doctor.consultationMode}</Text>
            </View>
          )}
        </Card>

        {/* Clinic Information */}
        {doctor.clinicAddress && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Clinic Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{doctor.clinicAddress}</Text>
            </View>
          </Card>
        )}

        {/* About Doctor */}
        {doctor.bio && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>About Dr. {doctor.name}</Text>
            <Text style={styles.bioText}>{doctor.bio}</Text>
          </Card>
        )}

        {/* Action Buttons */}
        <Card style={styles.card}>
          <Button
            title="Book Appointment"
            onPress={handleBookAppointment}
            style={styles.bookButton}
          />
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              Alert.alert(
                'Contact Doctor',
                'For direct contact, please call the clinic or book an appointment.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.contactButtonText}>Contact Information</Text>
          </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'sans-serif',
  },
  scrollContainer: {
    padding: 15,
  },
  headerCard: {
    marginBottom: 15,
    padding: 20,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
    fontFamily: 'sans-serif',
  },
  doctorSpecialty: {
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: 5,
    fontFamily: 'sans-serif',
  },
  doctorId: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  ratingContainer: {
    alignItems: 'flex-end',
    marginLeft: 15,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 8,
  },
  verifiedText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  card: {
    marginBottom: 15,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
    fontFamily: 'sans-serif',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 2,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 2,
    textAlign: 'right',
    fontFamily: 'sans-serif',
  },
  bioText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    fontFamily: 'sans-serif',
  },
  bookButton: {
    marginBottom: 10,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  contactButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
});

export default PatientDoctorView;
