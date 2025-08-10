import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { queueAPI, notificationAPI, default as api } from '../services/api';
import theme from '../config/theme';

const PatientQueuePositionScreen = ({ navigation, route }) => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const appointmentId = route.params?.appointmentId;

  useEffect(() => {
    loadQueuePosition();
    
    // Set up real-time notifications
    const eventSource = notificationAPI.connectToNotifications(
      handleNotification,
      (error) => console.error('Notification error:', error)
    );

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleNotification = (notification) => {
    if (notification.type === 'queue_update' || notification.type === 'patient_called') {
      // Refresh queue position when there's an update
      loadQueuePosition();
    }
  };

  const loadQueuePosition = async () => {
    try {
      const response = await queueAPI.getPatientQueuePosition(appointmentId);
      if (response.success) {
        setQueueData(response.data);
      }
    } catch (error) {
      console.error('Error loading queue position:', error);
      Alert.alert('Error', 'Failed to load queue position');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQueuePosition();
  };

  const handleCompleteAppointment = async () => {
    Alert.alert(
      'Complete Appointment',
      'Are you sure you want to mark this appointment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.completeAppointment(appointmentId);
              if (response.success) {
                Alert.alert(
                  'Success',
                  'Appointment marked as completed successfully!',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Error', response.message || 'Failed to complete appointment');
              }
            } catch (error) {
              console.error('Error completing appointment:', error);
              Alert.alert('Error', 'Failed to complete appointment');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Waiting': return theme.colors.warning;
      case 'Called': return theme.colors.info;
      case 'In-Progress': return theme.colors.primary;
      case 'Completed': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Waiting': return '⏳';
      case 'Called': return '📢';
      case 'In-Progress': return '👨‍⚕️';
      case 'Completed': return '✅';
      default: return '❓';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'Waiting': return 'Please wait for your turn';
      case 'Called': return 'You have been called! Please proceed to the doctor';
      case 'In-Progress': return 'Your consultation is in progress';
      case 'Completed': return 'Your consultation has been completed';
      default: return 'Status unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading queue position...</Text>
      </View>
    );
  }

  if (!queueData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load queue position</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQueuePosition}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎫 Queue Position</Text>
        <Text style={styles.subtitle}>Track your appointment status</Text>
      </View>

      {/* Token Display */}
      <View style={styles.tokenContainer}>
        <View style={styles.tokenDisplay}>
          <Text style={styles.tokenLabel}>Your Token Number</Text>
          <Text style={styles.tokenNumber}>#{queueData.queueToken}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(queueData.queueStatus) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(queueData.queueStatus)} {queueData.queueStatus}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.statusMessage}>
          {getStatusMessage(queueData.queueStatus)}
        </Text>
      </View>

      {/* Queue Information */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Queue Position</Text>
          <Text style={styles.infoValue}>{queueData.queuePosition}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Patients Ahead</Text>
          <Text style={styles.infoValue}>{queueData.patientsAhead}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Estimated Wait</Text>
          <Text style={styles.infoValue}>{queueData.estimatedWaitTime} min</Text>
        </View>
      </View>

      {/* Doctor Information */}
      <View style={styles.doctorContainer}>
        <Text style={styles.sectionTitle}>👨‍⚕️ Doctor Information</Text>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {queueData.doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{queueData.doctor.specialization}</Text>
          <Text style={styles.clinicAddress}>📍 {queueData.doctor.clinicAddress}</Text>
        </View>
      </View>

      {/* Appointment Details */}
      <View style={styles.appointmentContainer}>
        <Text style={styles.sectionTitle}>📅 Appointment Details</Text>
        <View style={styles.appointmentInfo}>
          <View style={styles.appointmentRow}>
            <Text style={styles.appointmentLabel}>Date:</Text>
            <Text style={styles.appointmentValue}>
              {new Date(queueData.appointmentDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.appointmentRow}>
            <Text style={styles.appointmentLabel}>Time:</Text>
            <Text style={styles.appointmentValue}>
              {queueData.timeSlot.start} - {queueData.timeSlot.end}
            </Text>
          </View>
          
          <View style={styles.appointmentRow}>
            <Text style={styles.appointmentLabel}>Status:</Text>
            <Text style={[styles.appointmentValue, { color: getStatusColor(queueData.status) }]}>
              {queueData.status}
            </Text>
          </View>
          
          {queueData.calledAt && (
            <View style={styles.appointmentRow}>
              <Text style={styles.appointmentLabel}>Called At:</Text>
              <Text style={styles.appointmentValue}>
                {new Date(queueData.calledAt).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.sectionTitle}>📋 Instructions</Text>
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            • Keep this screen open to receive real-time updates
          </Text>
          <Text style={styles.instructionText}>
            • You will be notified when it's your turn
          </Text>
          <Text style={styles.instructionText}>
            • Please arrive 5 minutes before your scheduled time
          </Text>
          <Text style={styles.instructionText}>
            • Bring all necessary documents and prescriptions
          </Text>
        </View>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadQueuePosition}>
        <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
      </TouchableOpacity>

      {/* Mark as Completed Button - Show only when processing */}
      {queueData && queueData.queueStatus === 'processing' && (
        <TouchableOpacity style={styles.completeButton} onPress={handleCompleteAppointment}>
          <Text style={styles.completeButtonText}>✅ Mark as Completed</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  tokenContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  tokenDisplay: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tokenLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statusMessage: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'space-around',
    ...theme.shadows.small,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  doctorContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  doctorInfo: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  clinicAddress: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  appointmentContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  appointmentInfo: {
    marginTop: theme.spacing.sm,
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  appointmentLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  appointmentValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  instructions: {
    marginTop: theme.spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: theme.colors.secondary,
    margin: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  refreshButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    margin: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  completeButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientQueuePositionScreen;
