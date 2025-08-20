import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import { adminAPI } from '../services/api';
import theme from '../config/theme';

const AdminDoctorProfileView = ({ route, navigation }) => {
  const { doctorId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);

  useEffect(() => {
    if (!doctorId) {
      Alert.alert(
        'Error',
        'Doctor ID is missing. Please try again.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
      return;
    }
    loadDoctorData();
  }, [doctorId]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      // Load doctor profile
      const doctorResponse = await adminAPI.getDoctorProfile(doctorId);
      if (doctorResponse.success) {
        setDoctor(doctorResponse.data);
      }

      // Load appointments for this doctor
      try {
        const appointmentResponse = await adminAPI.getDoctorAppointments(doctorId);
        if (appointmentResponse.success) {
          setAppointments(appointmentResponse.data || []);
        }
      } catch (error) {
        console.log('No appointments found for doctor');
        setAppointments([]);
      }

      // Load patient history
      try {
        const historyResponse = await adminAPI.getDoctorPatientHistory(doctorId);
        if (historyResponse.success) {
          setPatientHistory(historyResponse.data || []);
        }
      } catch (error) {
        console.log('No patient history found for doctor');
        setPatientHistory([]);
      }

    } catch (error) {
      console.error('Error loading doctor data:', error);
      Alert.alert('Error', 'Failed to load doctor information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDoctorData();
  };

  const handleVerificationToggle = async () => {
    if (!doctor) return;
    
    try {
      const newStatus = !doctor.isVerified;
      await authAPI.updateDoctorVerification(doctor._id, { 
        isVerified: newStatus 
      });
      
      Alert.alert(
        'Success',
        `Doctor ${newStatus ? 'verified' : 'unverified'} successfully`,
        [{ text: 'OK', onPress: () => loadDoctorData() }]
      );
    } catch (error) {
      console.error('Error updating verification:', error);
      Alert.alert('Error', 'Failed to update verification status');
    }
  };

  const handleActiveToggle = async () => {
    if (!doctor) return;
    
    try {
      const newStatus = !doctor.isActive;
      await authAPI.updateDoctorVerification(doctor._id, { 
        isActive: newStatus 
      });
      
      Alert.alert(
        'Success',
        `Doctor ${newStatus ? 'activated' : 'deactivated'} successfully`,
        [{ text: 'OK', onPress: () => loadDoctorData() }]
      );
    } catch (error) {
      console.error('Error updating active status:', error);
      Alert.alert('Error', 'Failed to update active status');
    }
  };

  const getStatusColor = (isVerified, isActive) => {
    if (isVerified && isActive) return theme.colors.success;
    if (isVerified && !isActive) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusText = (isVerified, isActive) => {
    if (isVerified && isActive) return 'Active & Verified';
    if (isVerified && !isActive) return 'Verified (Inactive)';
    return 'Pending Verification';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Doctor Profile...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Doctor profile not found</Text>
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
        {/* Doctor Basic Info */}
        <Card style={styles.basicInfoCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
              <Text style={styles.doctorId}>ID: {doctor.doctorId}</Text>
              <Text style={styles.doctorEmail}>{doctor.email}</Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doctor.isVerified, doctor.isActive) }]}>
                <Text style={styles.statusText}>{getStatusText(doctor.isVerified, doctor.isActive)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Professional Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Experience:</Text>
            <Text style={styles.value}>{doctor.experience || 0} years</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Consultation Fee:</Text>
            <Text style={styles.value}>₹{doctor.consultationFee || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>License Number:</Text>
            <Text style={styles.value}>{doctor.licenseNumber || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Working Days:</Text>
            <Text style={styles.value}>{doctor.workingDays?.join(', ') || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Working Hours:</Text>
            <Text style={styles.value}>
              {doctor.workingHours?.start || 'Not set'} - {doctor.workingHours?.end || 'Not set'}
            </Text>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{doctor.phoneNumber || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{doctor.clinicAddress || 'Not provided'}</Text>
          </View>
        </Card>

        {/* Statistics */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{appointments.length}</Text>
              <Text style={styles.statLabel}>Total Appointments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{patientHistory.length}</Text>
              <Text style={styles.statLabel}>Patients Treated</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {appointments.filter(apt => apt.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {appointments.filter(apt => apt.status === 'scheduled').length}
              </Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          </View>
        </Card>

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Appointments</Text>
            {appointments.slice(0, 5).map((appointment, index) => (
              <View key={index} style={styles.appointmentItem}>
                <Text style={styles.appointmentDate}>
                  {formatDate(appointment.appointmentDate)}
                </Text>
                <Text style={styles.appointmentStatus}>
                  Status: {appointment.status}
                </Text>
                <Text style={styles.appointmentPatient}>
                  Patient: {appointment.patientName || 'Unknown'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Admin Actions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              title={doctor.isVerified ? 'Unverify Doctor' : 'Verify Doctor'}
              onPress={handleVerificationToggle}
              style={[
                styles.actionButton,
                { backgroundColor: doctor.isVerified ? theme.colors.warning : theme.colors.success }
              ]}
            />
            <Button
              title={doctor.isActive ? 'Deactivate' : 'Activate'}
              onPress={handleActiveToggle}
              style={[
                styles.actionButton,
                { backgroundColor: doctor.isActive ? theme.colors.error : theme.colors.success }
              ]}
            />
          </View>
        </Card>

        {/* Registration Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Registration Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Registered:</Text>
            <Text style={styles.value}>{formatDate(doctor.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Updated:</Text>
            <Text style={styles.value}>{formatDate(doctor.updatedAt)}</Text>
          </View>
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
  basicInfoCard: {
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
    marginBottom: 3,
    fontFamily: 'sans-serif',
  },
  doctorEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  statusContainer: {
    marginLeft: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '20%',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: 'sans-serif',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  appointmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 10,
    marginBottom: 10,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  appointmentStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  appointmentPatient: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    marginBottom: 10,
  },
});

export default AdminDoctorProfileView;
