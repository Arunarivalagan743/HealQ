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
      setUserRole(user?.role);
      await fetchAppointments();
    } catch (error) {
      console.error('Error initializing screen:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userRole === 'doctor') {
        response = await api.getDoctorAppointments();
      } else if (userRole === 'patient') {
        response = await api.getPatientAppointments();
      } else if (userRole === 'admin') {
        response = await api.getAllAppointments();
      }

      if (response?.success) {
        setAppointments(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
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

  const getFilteredAppointments = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= now && apt.status !== 'cancelled';
        });
      case 'past':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate < now || apt.status === 'completed';
        });
      case 'pending':
        return appointments.filter(apt => apt.status === 'pending');
      default:
        return appointments;
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
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
          <Text style={styles.appointmentType}>
            {item.appointmentType} • {item.preferredCommunication}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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

        {item.status === 'pending' && userRole === 'patient' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelAppointment(item._id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {userRole === 'doctor' && item.status === 'pending' && (
          <View style={styles.doctorActions}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleUpdateStatus(item._id, 'confirmed')}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleUpdateStatus(item._id, 'cancelled')}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
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

