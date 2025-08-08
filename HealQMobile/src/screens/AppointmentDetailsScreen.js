import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import theme from '../config/theme';
import api from '../services/api';
import authService from '../services/authService';

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointmentId } = route.params;
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUserRole(user?.role);
      await fetchAppointmentDetails();
    } catch (error) {
      console.error('Error initializing screen:', error);
    }
  };

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getAppointmentDetails(appointmentId);
      
      if (response.success) {
        setAppointment(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch appointment details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      Alert.alert('Error', 'Failed to load appointment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setActionLoading(true);
    try {
      const response = await api.updateAppointmentStatus(appointmentId, { status });
      
      if (response.success) {
        Alert.alert('Success', 'Appointment status updated successfully');
        await fetchAppointmentDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => handleUpdateStatus('cancelled'),
        },
      ]
    );
  };

  const handleStartCommunication = () => {
    if (!appointment) return;

    const { preferredCommunication } = appointment;
    
    switch (preferredCommunication) {
      case 'phone':
        if (appointment.doctorPhone) {
          Linking.openURL(`tel:${appointment.doctorPhone}`);
        } else {
          Alert.alert('Error', 'Doctor phone number not available');
        }
        break;
      case 'video':
        // In a real app, you would integrate with a video calling service
        Alert.alert(
          'Video Call',
          'Video calling feature will be available soon. Please use phone or chat for now.',
          [{ text: 'OK' }]
        );
        break;
      case 'chat':
        // Navigate to chat screen
        navigation.navigate('Chat', { 
          appointmentId,
          recipientId: userRole === 'patient' ? appointment.doctorId : appointment.patientId,
          recipientName: userRole === 'patient' ? appointment.doctorName : appointment.patientName,
        });
        break;
      case 'in-person':
        if (appointment.clinicAddress) {
          Alert.alert(
            'Clinic Address',
            appointment.clinicAddress,
            [
              { text: 'OK' },
              { 
                text: 'Open Maps', 
                onPress: () => {
                  const url = `https://maps.google.com/maps?q=${encodeURIComponent(appointment.clinicAddress)}`;
                  Linking.openURL(url);
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Clinic address not available');
        }
        break;
      default:
        Alert.alert('Error', 'Communication method not supported');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      case 'completed':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const canCancel = () => {
    if (!appointment) return false;
    
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return appointment.status === 'pending' || 
           (appointment.status === 'confirmed' && hoursDiff > 24);
  };

  const canStart = () => {
    if (!appointment) return false;
    
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const now = new Date();
    const timeDiff = Math.abs(appointmentDateTime.getTime() - now.getTime());
    const minutesDiff = timeDiff / (1000 * 60);
    
    return appointment.status === 'confirmed' && minutesDiff <= 30;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Appointment not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Appointment Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Appointment Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Appointment Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(appointment.appointmentDate)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{appointment.appointmentTime}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{appointment.appointmentType}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Communication:</Text>
          <Text style={styles.infoValue}>{appointment.preferredCommunication}</Text>
        </View>
      </Card>

      {/* Doctor/Patient Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>
          {userRole === 'patient' ? 'Doctor Information' : 'Patient Information'}
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>
            {userRole === 'patient' ? appointment.doctorName : appointment.patientName}
          </Text>
        </View>
        
        {userRole === 'patient' && appointment.doctorSpecialty && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Specialty:</Text>
            <Text style={styles.infoValue}>{appointment.doctorSpecialty}</Text>
          </View>
        )}
        
        {userRole === 'doctor' && appointment.patientAge && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{appointment.patientAge} years</Text>
          </View>
        )}
      </Card>

      {/* Symptoms/Reason */}
      {appointment.symptoms && (
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Symptoms / Reason for Visit</Text>
          <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
        </Card>
      )}

      {/* Additional Notes */}
      {appointment.notes && (
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </Card>
      )}

      {/* Prescription (if available) */}
      {appointment.prescription && (
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Prescription</Text>
          <Text style={styles.prescriptionText}>{appointment.prescription}</Text>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.actionCard}>
        {appointment.status === 'confirmed' && canStart() && (
          <Button
            title="Start Consultation"
            onPress={handleStartCommunication}
            style={styles.actionButton}
          />
        )}

        {userRole === 'doctor' && appointment.status === 'pending' && (
          <View style={styles.doctorActions}>
            <Button
              title="Confirm"
              onPress={() => handleUpdateStatus('confirmed')}
              disabled={actionLoading}
              style={[styles.actionButton, styles.confirmButton]}
            />
            <Button
              title="Reject"
              onPress={() => handleUpdateStatus('cancelled')}
              disabled={actionLoading}
              style={[styles.actionButton, styles.rejectButton]}
            />
          </View>
        )}

        {userRole === 'doctor' && appointment.status === 'confirmed' && (
          <Button
            title="Mark as Completed"
            onPress={() => handleUpdateStatus('completed')}
            disabled={actionLoading}
            style={[styles.actionButton, styles.completeButton]}
          />
        )}

        {canCancel() && (
          <Button
            title="Cancel Appointment"
            onPress={handleCancelAppointment}
            disabled={actionLoading}
            style={[styles.actionButton, styles.cancelButton]}
          />
        )}

        {actionLoading && (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary} 
            style={styles.loader}
          />
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 120,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    width: 120,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  symptomsText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  prescriptionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  actionCard: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  doctorActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  confirmButton: {
    backgroundColor: theme.colors.success,
    flex: 1,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
    flex: 1,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
});

export default AppointmentDetailsScreen;

