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
      const response = await queueAPI.getDoctorQueue(doctorId);
      if (response.success) {
        setQueueData(response.data);
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
      const response = await apiService.completeAppointment(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Patient marked as completed');
        loadQueueData();
      } else {
        Alert.alert('Error', response.message || 'Failed to mark patient as completed');
      }
    } catch (error) {
      console.error('Error marking patient as completed:', error);
      Alert.alert('Error', 'Failed to mark patient as completed');
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      const response = await apiService.approveAppointment(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Appointment approved successfully');
        loadQueueData();
      } else {
        Alert.alert('Error', response.message || 'Failed to approve appointment');
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      Alert.alert('Error', 'Failed to approve appointment');
    }
  };

  const renderQueueItem = ({ item }) => {
    // Debug log to understand the data structure
    console.log('Queue item data:', {
      id: item.id,
      status: item.status,
      queueStatus: item.queueStatus,
      patientName: item.patientName
    });

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

    return (
      <View style={styles.queueItem}>
        <View style={styles.queueHeader}>
          <Text style={styles.tokenNumber}>#{item.queueToken}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.queueStatus) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(item.queueStatus)} {item.queueStatus}
            </Text>
          </View>
        </View>
        
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.patientInfo}>📞 {item.patientPhone}</Text>
        <Text style={styles.patientInfo}>🕒 {item.timeSlot.start} - {item.timeSlot.end}</Text>
        <Text style={styles.reasonText}>📋 {item.reasonForVisit}</Text>
        
        {item.symptoms && item.symptoms.length > 0 && (
          <Text style={styles.symptomsText}>
            🩺 {item.symptoms.join(', ')}
          </Text>
        )}
        
        {/* Show approve button for queued appointments */}
        {item.status === 'queued' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => handleApproveAppointment(item.id)}
            >
              <Text style={styles.completeButtonText}>Approve Appointment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show completion button for appointments that can be completed */}
        {(item.queueStatus === 'Waiting' || item.queueStatus === 'waiting' || 
          item.queueStatus === 'In-Progress' || item.queueStatus === 'Called' ||
          item.status === 'approved' || item.status === 'processing') && (
          <View style={styles.actionButtons}>
            {item.queueStatus === 'Waiting' || item.queueStatus === 'waiting' ? (
              <Text style={styles.waitTimeText}>
                ⏱️ Est. wait: {item.estimatedWaitTime || 0} minutes
              </Text>
            ) : null}
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => handleMarkCompleted(item.id)}
            >
              <Text style={styles.completeButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        )}
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
        data={queueData.queue}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🏥 No patients in queue</Text>
            <Text style={styles.emptySubText}>Patients will appear here when they book appointments</Text>
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
  },
});

export default DoctorQueueManagementScreen;
