import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import Button from '../components/Button';
import theme from '../config/theme';
import api from '../services/api';
import authService from '../services/authService';

const AppointmentListScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, pending

  useFocusEffect(
    useCallback(() => {
      initializeScreen();
    }, [])
  );

  const initializeScreen = async () => {
    try {
      const user = await authService.getCurrentUser();
      const storedRole = await authService.getUserRole();
      
      console.log('Current user in AppointmentListScreen:', user);
      console.log('Stored role from authService.getUserRole():', storedRole);
      
      const userRole = user?.role || storedRole;
      setUserRole(userRole);
      console.log('Final user role determined:', userRole);
      
      await fetchAppointments(userRole); // Pass role directly
    } catch (error) {
      console.error('Error initializing screen:', error);
    }
  };

  const fetchAppointments = async (role = null) => {
    try {
      setLoading(true);
      const currentRole = (role || userRole)?.toLowerCase(); // Convert to lowercase for comparison
      let response;
      
      console.log('Fetching appointments for user role:', currentRole);
      
      if (currentRole === 'doctor') {
        response = await api.getDoctorAppointments();
      } else if (currentRole === 'patient') {
        response = await api.getPatientAppointments();
      } else if (currentRole === 'admin') {
        response = await api.getAllAppointments();
      } else {
        console.log('Invalid or missing user role:', currentRole);
        Alert.alert('Error', 'Unable to determine user role');
        return;
      }

      console.log('API response:', response);

      if (response?.success) {
        // Handle the nested data structure: response.data.appointments
        const appointmentsList = response.data?.appointments || response.data || [];
        setAppointments(appointmentsList);
        console.log('Appointments loaded:', appointmentsList.length);
      } else {
        console.log('API response not successful:', response);
        Alert.alert('Error', response?.message || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', error?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.cancelAppointment(appointmentId);
              if (response.success) {
                Alert.alert('Success', 'Appointment cancelled successfully');
                await fetchAppointments();
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel appointment');
              }
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const response = await api.updateAppointmentStatus(appointmentId, { status });
      if (response.success) {
        Alert.alert('Success', 'Appointment status updated successfully');
        await fetchAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      const response = await api.approveAppointment(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Appointment approved successfully');
        await fetchAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to approve appointment');
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      Alert.alert('Error', 'Failed to approve appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    Alert.alert(
      'Reject Appointment',
      'Are you sure you want to reject this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.rejectAppointment(appointmentId, { 
                reason: 'Not available at requested time' 
              });
              if (response.success) {
                Alert.alert('Success', 'Appointment rejected');
                await fetchAppointments();
              } else {
                Alert.alert('Error', response.message || 'Failed to reject appointment');
              }
            } catch (error) {
              console.error('Error rejecting appointment:', error);
              Alert.alert('Error', 'Failed to reject appointment');
            }
          },
        },
      ]
    );
  };

  const handleMoveToQueue = async (appointmentId) => {
    try {
      const response = await api.moveToQueue(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Patient moved to queue');
        await fetchAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to move to queue');
      }
    } catch (error) {
      console.error('Error moving to queue:', error);
      Alert.alert('Error', 'Failed to move to queue');
    }
  };

  const handleStartProcessing = async (appointmentId) => {
    try {
      const response = await api.startProcessing(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Consultation started');
        await fetchAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to start consultation');
      }
    } catch (error) {
      console.error('Error starting processing:', error);
      Alert.alert('Error', 'Failed to start consultation');
    }
  };

  const handleFinishAppointment = async (appointmentId) => {
    try {
      const response = await api.finishAppointment(appointmentId);
      if (response.success) {
        Alert.alert('Success', 'Consultation finished. You can now add prescription.');
        await fetchAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to finish consultation');
      }
    } catch (error) {
      console.error('Error finishing appointment:', error);
      Alert.alert('Error', 'Failed to finish consultation');
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    Alert.alert(
      'Complete Appointment',
      'Mark this appointment as completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const response = await api.completeAppointment(appointmentId);
              if (response.success) {
                Alert.alert('Success', 'Appointment completed successfully');
                await fetchAppointments();
              } else {
                Alert.alert('Error', response.message || 'Failed to complete appointment');
              }
            } catch (error) {
              console.error('Error completing appointment:', error);
              Alert.alert('Error', 'Failed to complete appointment');
            }
          },
        },
      ]
    );
  };

  const getFilteredAppointments = () => {
    if (!appointments || !Array.isArray(appointments)) {
      return [];
    }
    
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= now && ['queued', 'approved'].includes(apt.status);
        });
      case 'past':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate < now || ['completed', 'cancelled', 'rejected'].includes(apt.status);
        });
      case 'pending':
        return appointments.filter(apt => apt.status === 'queued');
      default:
        return appointments;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'queued':
        return '#FFA500'; // Orange for pending approval
      case 'approved':
        return '#4CAF50'; // Green for approved
      case 'rejected':
        return '#F44336'; // Red for rejected
      case 'cancelled':
        return '#FF5722'; // Red-orange for cancelled
      case 'completed':
        return '#4CAF50'; // Green for completed
      // Legacy status support
      case 'requested':
        return '#FFA500'; // Orange for pending approval (legacy)
      case 'in_queue':
        return '#2196F3'; // Blue for in queue (legacy)
      case 'processing':
        return '#9C27B0'; // Purple for processing (legacy)
      case 'finished':
        return '#4CAF50'; // Green for finished (legacy)
      case 'no_show':
        return '#795548'; // Brown for no show (legacy)
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'queued':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      // Legacy status support
      case 'requested':
        return 'Pending Approval';
      case 'in_queue':
        return 'In Queue';
      case 'processing':
        return 'In Progress';
      case 'finished':
        return 'Completed';
      case 'no_show':
        return 'No Show';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['all', 'upcoming', 'past', 'pending'].map((filterOption) => (
        <TouchableOpacity
          key={filterOption}
          style={[
            styles.filterButton,
            filter === filterOption && styles.activeFilterButton,
          ]}
          onPress={() => setFilter(filterOption)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === filterOption && styles.activeFilterButtonText,
            ]}
          >
            {filterOption ? filterOption.charAt(0).toUpperCase() + filterOption.slice(1) : 'Unknown'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAppointmentItem = ({ item }) => (
    <Card style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.patientName}>
            {userRole === 'doctor' || userRole === 'admin' 
              ? item.patientName || 'Unknown Patient'
              : item.doctorName || 'Unknown Doctor'
            }
          </Text>
          <Text style={styles.appointmentDate}>
            {formatDate(item.appointmentDate)} at {item.appointmentTime}
          </Text>
          {item.tokenNumber && (
            <Text style={styles.tokenNumber}>
              Token #{item.tokenNumber} (Today)
            </Text>
          )}
          <Text style={styles.appointmentType}>
            {item.appointmentType} • {item.preferredCommunication}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {getStatusDisplayText(item.status)}
          </Text>
        </View>
      </View>

      {item.symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText}>{item.symptoms}</Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item._id })}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        {userRole === 'doctor' && item.patientId && (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('PatientHistory', { 
              patientId: item.patientId, 
              patientName: item.patientName || 'Unknown Patient' 
            })}
          >
            <Text style={styles.historyButtonText}>Patient History</Text>
          </TouchableOpacity>
        )}

        {item.status === 'queued' && userRole === 'patient' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelAppointment(item._id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {userRole === 'doctor' && item.status === 'queued' && (
          <View style={styles.doctorActions}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleApproveAppointment(item._id)}
            >
              <Text style={styles.confirmButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectAppointment(item._id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {userRole === 'doctor' && item.status === 'approved' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteAppointment(item._id)}
          >
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {userRole === 'patient' && item.status === 'approved' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteAppointment(item._id)}
          >
            <Text style={styles.completeButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {userRole === 'doctor' && (item.status === 'completed' || item.status === 'finished') && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.prescriptionButton}
              onPress={() => navigation.navigate('AddPrescription', { appointmentId: item._id })}
            >
              <Text style={styles.prescriptionButtonText}>
                {item.medicalRecord ? "Edit Prescription" : "Add Prescription"}
              </Text>
            </TouchableOpacity>
            
            {item.medicalRecord && (
              <TouchableOpacity
                style={styles.viewPrescriptionButton}
                onPress={() => navigation.navigate('ViewPrescription', { appointmentId: item._id })}
              >
                <Text style={styles.prescriptionButtonText}>View Prescription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {userRole === 'patient' && (item.status === 'completed' || item.status === 'finished') && 
          item.medicalRecord && item.medicalRecord.prescription && item.medicalRecord.prescription.length > 0 && (
          <TouchableOpacity
            style={styles.viewPrescriptionButton}
            onPress={() => navigation.navigate('ViewPrescription', { appointmentId: item._id })}
          >
            <Text style={styles.prescriptionButtonText}>View Prescription</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No appointments found</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'upcoming' && 'You have no upcoming appointments'}
        {filter === 'past' && 'You have no past appointments'}
        {filter === 'pending' && 'You have no pending appointments'}
        {filter === 'all' && 'You have no appointments yet'}
      </Text>
      {userRole === 'patient' && (
        <Button
          title="Find a Doctor"
          onPress={() => navigation.navigate('DoctorFinder')}
          style={styles.findDoctorButton}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterButtons()}
      
      <FlatList
        data={getFilteredAppointments()}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  listContainer: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  appointmentCard: {
    marginBottom: theme.spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  appointmentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  tokenNumber: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  appointmentType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  symptomsContainer: {
    marginBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  symptomsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailsButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  detailsButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  historyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#FF9800',
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  historyButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  doctorActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  confirmButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.sm,
  },
  confirmButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  rejectButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
  },
  rejectButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  queueButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#2196F3',
    borderRadius: theme.borderRadius.sm,
  },
  queueButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  startButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#9C27B0',
    borderRadius: theme.borderRadius.sm,
  },
  startButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  finishButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#4CAF50',
    borderRadius: theme.borderRadius.sm,
  },
  finishButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  completeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#4CAF50',
    borderRadius: theme.borderRadius.sm,
  },
  completeButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  prescriptionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#9C27B0',
    borderRadius: theme.borderRadius.sm,
    flex: 1,
    marginRight: 5,
  },
  viewPrescriptionButton: {
    flex: 1,
    marginLeft: 5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#FF9800',
    borderRadius: theme.borderRadius.sm,
  },
  prescriptionButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  findDoctorButton: {
    minWidth: 150,
  },
});

export default AppointmentListScreen;

