import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { queueAPI, notificationAPI, appointmentAPI } from '../services/api';
import apiService from '../services/api';
import theme from '../config/theme';

const DoctorQueueManagementScreen = ({ navigation, route }) => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callingPatient, setCallingPatient] = useState(false);

  // Use route params doctorId or fallback to 'current' to let backend find by userId
  const doctorId = route.params?.doctorId || 'current';

  useEffect(() => {
    loadQueueData();
    
    // Note: EventSource is not natively supported in React Native
    // For real-time updates, consider using WebSocket or polling
    // const eventSource = notificationAPI.connectToNotifications(
    //   handleNotification,
    //   (error) => console.error('Notification error:', error)
    // );

    // return () => {
    //   if (eventSource) {
    //     eventSource.close();
    //   }
    // };
  }, []);

  const handleNotification = (notification) => {
    if (notification.type === 'appointment_booked') {
      // Refresh queue when new appointment is booked
      loadQueueData();
    }
  };

  const loadQueueData = async () => {
    try {
      console.log('Loading queue data for doctorId:', doctorId);
      const response = await queueAPI.getDoctorQueue(doctorId);
      console.log('Queue API response:', response);
      
      if (response.success) {
        setQueueData(response.data);
        console.log('Queue data loaded successfully. Patient count:', 
          response.data.queue ? response.data.queue.length : 0);
        
        // Debug appointment statuses
        if (response.data.queue && response.data.queue.length > 0) {
          response.data.queue.forEach((item, index) => {
            console.log(`Queue item #${index + 1}:`, {
              id: item.id || item._id,
              patientName: item.patientName,
              status: item.status,
              queueStatus: item.queueStatus
            });
          });
        } else {
          console.log('No patients found in the queue');
        }
      } else {
        console.log('Failed to load queue data:', response.message);
      }
    } catch (error) {
      console.error('Error loading queue data:', error);
      Alert.alert('Error', 'Failed to load queue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQueueData();
  };

  const handleCallNextPatient = async () => {
    setCallingPatient(true);
    try {
      const response = await queueAPI.callNextPatient(doctorId);
      if (response.success) {
        if (response.data) {
          Alert.alert(
            'Patient Called',
            `${response.data.patientName} (Token #${response.data.queueToken}) has been called`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Queue Empty', 'No more patients in queue');
        }
        loadQueueData();
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
      Alert.alert('Error', 'Failed to call next patient');
    } finally {
      setCallingPatient(false);
    }
  };

  const handleMarkCompleted = async (appointmentId) => {
    try {
      console.log('Marking appointment as completed with ID:', appointmentId);
      
      // Send empty medical record to complete the appointment
      const response = await apiService.completeAppointment(appointmentId, { medicalRecord: {} });
      console.log('Complete appointment API response:', response);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Patient visit has been marked as completed',
          [
            { 
              text: 'OK',
              onPress: () => {
                console.log('Refreshing queue data after completion');
                loadQueueData();
              }
            }
          ]
        );
      } else {
        console.error('Complete API returned error:', response.message);
        Alert.alert('Error', response.message || 'Failed to mark patient as completed');
      }
    } catch (error) {
      console.error('Error marking patient as completed:', error);
      
      let errorMessage = 'Failed to mark patient as completed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Show the error message in the UI
      Alert.alert('Error', errorMessage);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      console.log('Approving appointment with ID:', appointmentId);
      
      const response = await apiService.approveAppointment(appointmentId);
      console.log('Approval API response:', response);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Appointment approved successfully. Patient added to waiting queue.',
          [
            { 
              text: 'OK',
              onPress: () => {
                console.log('Refreshing queue data after approval');
                loadQueueData();
              }
            }
          ]
        );
      } else {
        console.error('Approval API returned error:', response.message);
        
        // Provide specific error messages based on the error
        let errorMessage = response.message || 'Failed to approve appointment';
        
        if (errorMessage.includes('time slot that has already passed')) {
          errorMessage = 'Cannot approve this appointment because the time slot has already passed.';
        } else if (errorMessage.includes('no longer available')) {
          errorMessage = 'This time slot is already taken by another approved appointment.';
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      
      let errorMessage = 'Failed to approve appointment. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const renderQueueItem = ({ item }) => {
    // Debug log to understand the data structure
    console.log('Queue item data:', {
      id: item.id || item._id,
      status: item.status,
      queueStatus: item.queueStatus,
      patientName: item.patientName
    });

    // Handle both uppercase and lowercase queue status
    const normalizedQueueStatus = item.queueStatus?.toLowerCase() || 'waiting';

    const getStatusColor = (status) => {
      if (!status) return theme.colors.textSecondary;
      
      switch (status.toLowerCase()) {
        case 'waiting': return theme.colors.warning;
        case 'called': return theme.colors.info;
        case 'in_progress': 
        case 'in-progress': return theme.colors.primary;
        case 'completed': return theme.colors.success;
        default: return theme.colors.textSecondary;
      }
    };

    const getStatusIcon = (status) => {
      if (!status) return '❓';
      
      switch (status.toLowerCase()) {
        case 'waiting': return '⏳';
        case 'called': return '📢';
        case 'in_progress':
        case 'in-progress': return '👨‍⚕️';
        case 'completed': return '✅';
        default: return '❓';
      }
    };

    // Format the displayed status text for better readability
    const getDisplayStatus = (status) => {
      if (!status) return 'Waiting';
      
      switch (status.toLowerCase()) {
        case 'waiting': return 'Waiting';
        case 'called': return 'Called';
        case 'in_progress': return 'In Progress';
        case 'in-progress': return 'In Progress';
        case 'completed': return 'Completed';
        default: return status;
      }
    };

    return (
      <View style={styles.queueItem}>
        <View style={styles.queueHeader}>
          <Text style={styles.tokenNumber}>#{item.queueToken || '??'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.queueStatus) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(item.queueStatus)} {getDisplayStatus(item.queueStatus)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.patientInfo}>📞 {item.patientPhone || 'No phone'}</Text>
        <Text style={styles.patientInfo}>
          🕒 {item.timeSlot?.start || '??:??'} - {item.timeSlot?.end || '??:??'}
        </Text>
        <Text style={styles.reasonText}>
          📋 {item.reasonForVisit || 'No reason specified'}
        </Text>
        
        {item.symptoms && item.symptoms.length > 0 && (
          <Text style={styles.symptomsText}>
            🩺 {item.symptoms.join(', ')}
          </Text>
        )}
        
        {/* Show appropriate action buttons based on appointment status */}
        <View style={styles.actionButtons}>
          {/* Estimated wait time */}
          {(normalizedQueueStatus === 'waiting') && (
            <Text style={styles.waitTimeText}>
              ⏱️ Est. wait: {item.estimatedWaitTime || 0} minutes
            </Text>
          )}
          
          {/* Approve button for queued appointments */}
          {item.status === 'queued' && (
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => handleApproveAppointment(item.id || item._id)}
            >
              <Text style={styles.completeButtonText}>Approve Appointment</Text>
            </TouchableOpacity>
          )}
          
          {/* Mark as completed button */}
          {/* Show for all statuses to allow force-completing if needed */}
          <TouchableOpacity 
            style={[
              styles.completeButton, 
              // Different color based on if it's the primary action
              item.status !== 'queued' ? 
                { backgroundColor: theme.colors.success } : 
                { backgroundColor: theme.colors.primary, marginTop: 8 }
            ]}
            onPress={() => handleMarkCompleted(item.id || item._id)}
          >
            <Text style={styles.completeButtonText}>
              {item.status === 'queued' ? 'Approve & Complete' : 'Mark as Completed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading queue...</Text>
      </View>
    );
  }

  if (!queueData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load queue data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQueueData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Debug what we're displaying
  console.log('Queue data to display:', {
    date: queueData.date,
    doctorName: queueData.doctor?.name,
    stats: queueData.stats,
    queueLength: queueData.queue?.length || 0
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.doctorName}>Dr. {queueData.doctor.name}</Text>
        <Text style={styles.specialization}>{queueData.doctor.specialization}</Text>
        <Text style={styles.dateText}>📅 {new Date(queueData.date).toLocaleDateString()}</Text>
      </View>

      {/* Queue Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{queueData.stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{queueData.stats.waiting}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{queueData.stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{queueData.stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Call Next Button */}
      <TouchableOpacity 
        style={[styles.callNextButton, callingPatient && styles.disabledButton]}
        onPress={handleCallNextPatient}
        disabled={callingPatient || queueData.stats.waiting === 0}
      >
        {callingPatient ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.callNextButtonText}>
            📢 Call Next Patient
          </Text>
        )}
      </TouchableOpacity>

      {/* Queue List */}
      <FlatList
        data={queueData.queue || []}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id || item._id || `appointment-${item.appointmentId}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🏥 No patients in queue</Text>
            <Text style={styles.emptySubText}>
              {queueData.stats?.totalPatients > 0 
                ? "Pull down to refresh if you don't see appointments" 
                : "Patients will appear here when they book appointments"
              }
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh Queue</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
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
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  specialization: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.9,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
    marginTop: theme.spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  callNextButton: {
    backgroundColor: theme.colors.success,
    margin: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  callNextButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  queueItem: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tokenNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  patientInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  reasonText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  symptomsText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginTop: theme.spacing.xs,
  },
  waitTimeText: {
    fontSize: 12,
    color: theme.colors.info,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  actionButtons: {
    marginTop: theme.spacing.sm,
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  completeButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: theme.spacing.md,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DoctorQueueManagementScreen;
