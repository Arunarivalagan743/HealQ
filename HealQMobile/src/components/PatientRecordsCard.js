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

const PatientRecordsCard = ({ navigation }) => {
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadRecentPatients();
  }, []);

  const loadRecentPatients = async () => {
    try {
      setLoading(true);
      console.log('Loading recent patients');
      
      // Get all patients from completed appointments
      const response = await api.getDoctorAppointments({
        status: ['completed', 'finished'],
        limit: 10,
        sort: '-appointmentDate' // Most recent first
      });
      
      console.log('Patient records response:', response);
      
      if (response.success && response.data && response.data.appointments) {
        console.log('Retrieved appointments:', response.data.appointments.length);
        // Get unique patients (based on patientId)
        const uniquePatients = [];
        const patientIds = new Set();
        
        response.data.appointments.forEach(apt => {
          console.log('Processing appointment:', apt._id, 'Patient:', apt.patientName);
          
          // Check if patientId is an object or just an ID
          const patientIdValue = typeof apt.patientId === 'object' ? apt.patientId._id : apt.patientId;
          
          if (!patientIds.has(patientIdValue) && apt.patientName) {
            patientIds.add(patientIdValue);
            uniquePatients.push({
              id: patientIdValue,
              name: apt.patientName,
              appointmentDate: apt.appointmentDate,
              reason: apt.reasonForVisit,
              appointmentId: apt._id || apt.appointmentId
            });
          }
        });
        
        console.log('Unique patients found:', uniquePatients.length);
        setRecentPatients(uniquePatients);
      } else {
        console.log('No appointment data available in response');
      }
    } catch (error) {
      console.error('Failed to load recent patients:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePatientPress = (patient) => {
    navigation.navigate('PatientDetails', { patientId: patient.id });
  };
  
  const renderPatientItem = ({ item }) => {
    const formattedDate = new Date(item.appointmentDate).toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={styles.patientItem}
        onPress={() => handlePatientPress(item)}
      >
        <View style={styles.patientInitial}>
          <Text style={styles.initialText}>{item.name.charAt(0)}</Text>
        </View>
        
        <View style={styles.patientDetails}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.lastVisit}>Last Visit: {formattedDate}</Text>
          {item.reason && (
            <Text style={styles.reasonText} numberOfLines={1}>
              Reason: {item.reason}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.viewRecordButton}
          onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.appointmentId })}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Patient Records</Text>
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" />
        ) : recentPatients.length > 0 ? (
          <View>
            {recentPatients.map((item) => (
              <React.Fragment key={item.id || item.appointmentId || `patient-${Math.random()}`}>
                {renderPatientItem({ item })}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No patient records found</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('PatientRecords')}
      >
        <Text style={styles.viewAllButtonText}>View All Patients</Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 15,
  },
  content: {
    minHeight: 100,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastVisit: {
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
  viewRecordButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  viewButtonText: {
    color: theme.colors.primary,
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

export default PatientRecordsCard;
