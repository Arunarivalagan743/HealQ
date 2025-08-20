import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { queueAPI } from '../services/api';
import theme from '../config/theme';
import authService from '../services/authService';

const DoctorQueueScreen = ({ route, navigation }) => {
  const [queueData, setQueueData] = useState({
    queue: [],
    stats: {},
    doctor: {}
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callingPatient, setCallingPatient] = useState(false);
  const doctorId = route?.params?.doctorId;

  useEffect(() => {
    loadQueueData();
  }, []);

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
      const response = await queueAPI.markPatientCompleted(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Patient marked as completed');
        loadQueueData();
      }
    } catch (error) {
      console.error('Error marking patient as completed:', error);
      Alert.alert('Error', 'Failed to mark patient as completed');
    }
  };

  const getQueueStatusColor = (status) => {
    switch (status) {
      case 'Waiting': return theme.colors.warning;
      case 'Called': return theme.colors.info;
      case 'In-Progress': return theme.colors.primary;
      case 'Completed': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const renderQueueItem = ({ item }) => (
    <View style={styles.queueItem}>
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenNumber}>{item.queueToken}</Text>
        <Text style={styles.tokenLabel}>Token</Text>
      </View>
      
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.patientPhone}>{item.patientPhone}</Text>
        <Text style={styles.reason}>{item.reasonForVisit}</Text>
        <Text style={styles.timeSlot}>
          {item.timeSlot.start} - {item.timeSlot.end}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getQueueStatusColor(item.queueStatus) }]}>
          <Text style={styles.statusText}>{item.queueStatus}</Text>
        </View>
        {item.estimatedWaitTime > 0 && (
          <Text style={styles.waitTime}>{item.estimatedWaitTime} min wait</Text>
        )}
      </View>
      
      {item.queueStatus === 'In-Progress' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleMarkCompleted(item.id)}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading queue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue Management</Text>
      </View>

      {/* Doctor Info */}
      <View style={styles.doctorCard}>
        <Text style={styles.doctorName}>Dr. {queueData.doctor.name}</Text>
        <Text style={styles.doctorSpecialty}>{queueData.doctor.specialization}</Text>
        <Text style={styles.queueDate}>Today's Queue - {new Date().toLocaleDateString()}</Text>
      </View>

      {/* Queue Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{queueData.stats.totalPatients || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{queueData.stats.waiting || 0}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{queueData.stats.inProgress || 0}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{queueData.stats.completed || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Call Next Patient Button */}
      <TouchableOpacity
        style={[styles.callButton, callingPatient && styles.callButtonDisabled]}
        onPress={handleCallNextPatient}
        disabled={callingPatient || queueData.stats.waiting === 0}
      >
        {callingPatient ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.callButtonText}>
            {queueData.stats.waiting > 0 ? 'Call Next Patient' : 'No Patients Waiting'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Queue List */}
      <FlatList
        data={queueData.queue || []}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.queueList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No patients in queue</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = {
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
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  headerTitle: {
    flex: 1,
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  doctorCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  doctorSpecialty: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  queueDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  callButton: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  queueList: {
    paddingHorizontal: theme.spacing.lg,
  },
  queueItem: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  tokenNumber: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  tokenLabel: {
    color: theme.colors.white,
    fontSize: 10,
    fontFamily: 'sans-serif',
  },
  patientInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  patientPhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  reason: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  timeSlot: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  statusContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  waitTime: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  completeButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
};

export default DoctorQueueScreen;
