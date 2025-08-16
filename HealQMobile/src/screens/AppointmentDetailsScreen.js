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
      console.log('🔍 User role from authService:', user?.role);
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
        setAppointment(response.data.appointment);
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

  // New appointment workflow handlers
  const handleApproveAppointment = async () => {
    try {
      setActionLoading(true);
      const response = await api.approveAppointment(appointmentId);
      
      if (response.success) {
        Alert.alert('Success', 'Appointment approved successfully');
        await fetchAppointmentDetails(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to approve appointment');
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      Alert.alert('Error', 'Failed to approve appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppointment = () => {
    Alert.prompt(
      'Reject Appointment',
      'Please provide a reason for rejecting this appointment:',
      async (reason) => {
        if (reason) {
          try {
            setActionLoading(true);
            const response = await api.rejectAppointment(appointmentId, reason);
            
            if (response.success) {
              Alert.alert('Success', 'Appointment rejected');
              await fetchAppointmentDetails();
            } else {
              Alert.alert('Error', response.message || 'Failed to reject appointment');
            }
          } catch (error) {
            console.error('Error rejecting appointment:', error);
            Alert.alert('Error', 'Failed to reject appointment');
          } finally {
            setActionLoading(false);
          }
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const handleMoveToQueue = async () => {
    try {
      setActionLoading(true);
      const response = await api.moveToQueue(appointmentId);
      
      if (response.success) {
        Alert.alert('Success', 'Appointment moved to queue');
        await fetchAppointmentDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to move to queue');
      }
    } catch (error) {
      console.error('Error moving to queue:', error);
      Alert.alert('Error', 'Failed to move to queue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProcessing = async () => {
    try {
      setActionLoading(true);
      const response = await api.startProcessing(appointmentId);
      
      if (response.success) {
        Alert.alert('Success', 'Consultation started');
        await fetchAppointmentDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to start consultation');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      Alert.alert('Error', 'Failed to start consultation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishAppointment = async () => {
    Alert.alert(
      'Complete Consultation',
      'Are you sure you want to mark this consultation as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await api.finishAppointment(appointmentId);
              
              if (response.success) {
                Alert.alert('Success', 'Consultation completed. You can now add prescription.');
                await fetchAppointmentDetails();
              } else {
                Alert.alert('Error', response.message || 'Failed to complete consultation');
              }
            } catch (error) {
              console.error('Error completing consultation:', error);
              Alert.alert('Error', 'Failed to complete consultation');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    if (!status) return theme.colors.textSecondary;
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
    if (!appointment || !appointment.appointmentDate) return false;
    
    const appointmentDate = new Date(appointment.appointmentDate);
    
    // Check if the date is valid
    if (isNaN(appointmentDate.getTime())) return false;
    
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return appointment.status === 'pending' || 
           (appointment.status === 'confirmed' && hoursDiff > 24);
  };

  const canStart = () => {
    if (!appointment || !appointment.appointmentDate || !appointment.appointmentTime) return false;
    
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(appointmentDateTime.getTime())) return false;
    
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
              {appointment.status ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : 'Unknown'}
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
          <Text style={styles.infoValue}>{appointment.appointmentTime || 'Time not set'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{appointment.appointmentType || 'Type not specified'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Communication:</Text>
          <Text style={styles.infoValue}>{appointment.preferredCommunication || 'Not specified'}</Text>
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
            {userRole === 'patient' 
              ? (appointment.doctorName || 'Doctor name not available') 
              : (appointment.patientName || 'Patient name not available')
            }
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
        {/* Debug Info */}
        {__DEV__ && (
          <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
            <Text style={{ fontSize: 12 }}>Debug: userRole = "{userRole}"</Text>
            <Text style={{ fontSize: 12 }}>Debug: appointment.status = "{appointment.status}"</Text>
          </View>
        )}
        
        {/* Doctor Actions for Requested Appointments */}
        {(userRole === 'doctor' || userRole === 'Doctor') && appointment.status === 'requested' && (
          <View style={styles.doctorActions}>
            <Button
              title="Approve"
              onPress={() => handleApproveAppointment()}
              disabled={actionLoading}
              style={[styles.actionButton, styles.approveButton]}
            />
            <Button
              title="Reject"
              onPress={() => handleRejectAppointment()}
              disabled={actionLoading}
              style={[styles.actionButton, styles.rejectButton]}
            />
          </View>
        )}

        {/* Doctor Actions for Approved Appointments */}
        {(userRole === 'doctor' || userRole === 'Doctor') && appointment.status === 'approved' && (
          <Button
            title="Move to Queue"
            onPress={() => handleMoveToQueue()}
            disabled={actionLoading}
            style={[styles.actionButton, styles.queueButton]}
          />
        )}

        {/* Doctor Actions for Queued Appointments */}
        {(userRole === 'doctor' || userRole === 'Doctor') && appointment.status === 'in_queue' && (
          <Button
            title="Start Consultation"
            onPress={() => handleStartProcessing()}
            disabled={actionLoading}
            style={[styles.actionButton, styles.startButton]}
          />
        )}

        {/* Doctor Actions for Processing Appointments */}
        {(userRole === 'doctor' || userRole === 'Doctor') && appointment.status === 'processing' && (
          <Button
            title="Complete Consultation"
            onPress={() => handleFinishAppointment()}
            disabled={actionLoading}
            style={[styles.actionButton, styles.completeButton]}
          />
        )}

        {/* Doctor Actions for Finished/Completed Appointments */}
        {(userRole === 'doctor' || userRole === 'Doctor') && 
          (appointment.status === 'completed' || appointment.status === 'finished') && (
          <Button
            title={appointment.medicalRecord ? "Edit Prescription" : "Add Prescription"}
            onPress={() => navigation.navigate('AddPrescription', { appointmentId: appointment._id })}
            style={[styles.actionButton, styles.prescriptionButton]}
          />
        )}
        
        {/* Patient View Prescription - Show even if prescription array is empty but medical record exists */}
        {(userRole === 'patient' || userRole === 'Patient') && 
          (appointment.status === 'completed' || appointment.status === 'finished') && 
          appointment.medicalRecord && 
          appointment.medicalRecord.diagnosis && (
          <Button
            title="View Prescription"
            onPress={() => navigation.navigate('ViewPrescription', { appointmentId: appointment._id })}
            style={[styles.actionButton, styles.prescriptionButton]}
          />
        )}

        {/* Patient Actions for Requested Appointments */}
        {userRole === 'patient' && appointment.status === 'requested' && (
          <Button
            title="Cancel Request"
            onPress={() => handleCancelAppointment()}
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
  approveButton: {
    backgroundColor: theme.colors.success,
    flex: 1,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
    flex: 1,
  },
  queueButton: {
    backgroundColor: '#2196F3',
  },
  startButton: {
    backgroundColor: '#9C27B0',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  prescriptionButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
});

export default AppointmentDetailsScreen;

