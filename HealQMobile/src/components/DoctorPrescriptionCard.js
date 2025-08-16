import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';
import Card from './Card';
import theme from '../config/theme';
import api from '../services/api';

const PrescriptionCard = ({ navigation }) => {
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date().toISOString());
  
  useEffect(() => {
    console.log('DoctorPrescriptionCard component mounted, loading appointments...');
    loadCompletedAppointments();
    
    // Refresh the list every 2 minutes
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing prescription data');
      loadCompletedAppointments();
    }, 120000); // 2 minutes
    
    return () => clearInterval(intervalId);
  }, [refreshTimestamp]);  // Added refreshTimestamp to dependencies to force re-fetch when refreshed

  const loadCompletedAppointments = async () => {
    try {
      setLoading(true);
      console.log('Loading completed appointments for prescriptions');
      
      // Use an expanded status filter to make sure we get all relevant appointments
      const response = await api.getDoctorAppointments({ 
        status: 'completed,finished',  // Use a string instead of an array
        limit: 50 // Increase limit significantly to ensure we get all data
      });
      
      console.log('Prescription appointments response:', response);
      
      if (response.success && response.data && response.data.appointments) {
        const allAppointments = response.data.appointments;
        console.log('Retrieved appointments:', allAppointments.length);
        
        // Ensure all appointments have the necessary fields for display
        const processedAppointments = allAppointments.map(apt => {
          // Make sure we have an ID to work with - prefer MongoDB _id if available
          const id = apt._id || apt.appointmentId || apt.id;
          
          // Ensure we have a date and format it consistently
          let appointmentDate = apt.appointmentDate || apt.date;
          if (appointmentDate && !(appointmentDate instanceof Date)) {
            appointmentDate = new Date(appointmentDate);
          }
          
          return {
            ...apt,
            _id: id,
            appointmentId: id,
            appointmentDate: appointmentDate,
            patientName: apt.patientName || 'Patient',
          };
        });
        
        console.log('Processed appointments:', processedAppointments.length);

        if (processedAppointments.length === 0) {
          console.log('No appointments found with the given filters');
          // Try again with no status filter to see if there are any appointments at all
          const fallbackResponse = await api.getDoctorAppointments({
            limit: 20
          });
          console.log('Fallback response:', fallbackResponse);
          if (fallbackResponse.success && fallbackResponse.data.appointments.length > 0) {
            console.log('Found appointments without filtering:', fallbackResponse.data.appointments.length);
          }
        }
        
        // Debug appointments
        processedAppointments.forEach(apt => {
          console.log(`Appointment ${apt._id}, Status: ${apt.status}, Date: ${apt.appointmentDate}, Patient: ${apt.patientName}`);
          console.log('Medical Record:', apt.medicalRecord ? 'YES' : 'NO');
          if (apt.medicalRecord) {
            console.log('Has prescription:', apt.medicalRecord.prescription ? 'YES' : 'NO');
            console.log('Prescription items:', apt.medicalRecord.prescription?.length || 0);
          }
        });
        
        console.log('About to filter appointments, total:', processedAppointments.length);
        
        // Debug all appointments before filtering
        processedAppointments.forEach((apt, index) => {
          console.log(`Appointment ${index}: ID=${apt._id || apt.appointmentId}, Status=${apt.status}`);
        });
        
        // First, just get all completed/finished appointments regardless of prescription status
        const completedFinishedAppointments = processedAppointments.filter(apt => 
          apt.status === 'completed' || apt.status === 'finished'
        );        console.log('Completed/Finished appointments:', completedFinishedAppointments.length);
        
        // Then, filter for those needing prescriptions
        const appointmentsNeedingRx = completedFinishedAppointments.filter(apt => {
          // Check if medical record exists
          const hasMedicalRecord = apt.medicalRecord !== undefined && apt.medicalRecord !== null;
          
          // Check if prescription exists and has items
          const hasPrescription = hasMedicalRecord && 
                                 apt.medicalRecord.prescription !== undefined && 
                                 apt.medicalRecord.prescription !== null && 
                                 Array.isArray(apt.medicalRecord.prescription) && 
                                 apt.medicalRecord.prescription.length > 0;
          
          // Debug each appointment's prescription status
          console.log(`Apt ${apt._id}: Medical Record: ${hasMedicalRecord}, Prescription: ${hasPrescription}`);
          
          // We want appointments that don't have prescriptions
          return !hasPrescription;
        });
        
        console.log('Appointments needing prescriptions after filtering:', appointmentsNeedingRx.length);
        
        // If we found appointments needing prescriptions, use those
        if (appointmentsNeedingRx.length > 0) {
          console.log('Setting appointments needing prescriptions:', appointmentsNeedingRx.length);
          setCompletedAppointments(appointmentsNeedingRx);
        } else {
          // If no appointments need prescriptions, check if we have any completed/finished appointments at all
          console.log('No appointments need prescriptions, showing all completed/finished:', completedFinishedAppointments.length);
          setCompletedAppointments(completedFinishedAppointments);
        }
      } else {
        console.log('No appointment data available in response');
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAppointmentPress = (appointment) => {
    const appointmentId = appointment._id || appointment.appointmentId;
    console.log('Navigating to AddPrescription with appointmentId:', appointmentId);
    console.log('Full appointment data:', appointment);
    navigation.navigate('AddPrescription', { appointmentId });
  };
  
  const renderAppointmentItem = ({ item }) => {
    const formattedDate = new Date(item.appointmentDate).toLocaleDateString();
    // Make sure we have an ID to work with
    const itemId = item._id || item.appointmentId || item.id;
    console.log('Rendering appointment item with ID:', itemId);
    
    return (
      <TouchableOpacity 
        style={styles.appointmentItem}
        onPress={() => handleAppointmentPress(item)}
      >
        <View style={styles.appointmentDetails}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.appointmentInfo}>
            {formattedDate} • {item.timeSlot.start} - {item.timeSlot.end}
          </Text>
          <Text style={styles.reasonText} numberOfLines={1}>
            {item.reasonForVisit || 'No reason specified'}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Add Rx</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // For debugging - log what we're about to render
  console.log(`DoctorPrescriptionCard - Rendering with ${completedAppointments.length} appointments`);
  if (completedAppointments.length > 0) {
    console.log('First appointment to render:', {
      id: completedAppointments[0]._id || completedAppointments[0].appointmentId,
      patient: completedAppointments[0].patientName,
      status: completedAppointments[0].status,
      date: completedAppointments[0].appointmentDate
    });
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardTitleContainer}>
        <Text style={styles.cardTitle}>
          Prescriptions Needed {completedAppointments.length > 0 ? `(${completedAppointments.length})` : ''}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => {
            console.log('Manual refresh triggered');
            setRefreshTimestamp(new Date().toISOString());
            loadCompletedAppointments();
          }}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" />
        ) : completedAppointments.length > 0 ? (
          <View>
            {completedAppointments.slice(0, 3).map((item, index) => {
              console.log(`Rendering appointment ${index}:`, item._id || item.appointmentId);
              return (
                <View key={item._id || `appointment-${index}`}>
                  {renderAppointmentItem({ item })}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No prescriptions needed at this time</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('DoctorPrescriptions')}
      >
        <Text style={styles.viewAllButtonText}>View All Prescriptions</Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 15,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: theme.colors.primaryLight,
  },
  refreshButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    minHeight: 100,
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  appointmentInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusBadge: {
    backgroundColor: theme.colors.accentLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 10,
  },
  statusText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  viewAllButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default PrescriptionCard;
