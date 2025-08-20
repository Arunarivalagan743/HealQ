import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import FixedBottomBackButton from '../components/FixedBottomBackButton';
import theme from '../config/theme';
import api from '../services/api';

const DoctorPrescriptionsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState({
    needPrescription: [],
    withPrescription: []
  });
  const [activeTab, setActiveTab] = useState('needPrescription');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      console.log('DoctorPrescriptionsScreen: Loading prescriptions');
      
      // Get all completed and finished appointments
      const response = await api.getDoctorAppointments({
        status: 'completed,finished'  // Use a string instead of an array
      });
      
      console.log('DoctorPrescriptionsScreen: Response received:', response.success);
      
      if (response.success) {
        const appointments = response.data.appointments || [];
        console.log('DoctorPrescriptionsScreen: Appointments loaded:', appointments.length);
        
        if (appointments.length > 0) {
          console.log('First appointment:', {
            id: appointments[0]._id || appointments[0].appointmentId,
            status: appointments[0].status,
            patient: appointments[0].patientName
          });
        }
        
        // Process appointments to ensure all have necessary fields
        const processedAppointments = appointments.map(apt => {
          // Make sure we have an ID
          const id = apt._id || apt.appointmentId || apt.id;
          
          // Ensure date is consistent
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
        
        // Filter appointments that need prescriptions
        const needPrescription = processedAppointments.filter(apt => 
          (!apt.medicalRecord || 
           !apt.medicalRecord.prescription || 
           apt.medicalRecord.prescription.length === 0)
        );
        
        console.log('DoctorPrescriptionsScreen: Appointments needing prescriptions:', needPrescription.length);
        
        // Filter appointments that have prescriptions
        const withPrescription = processedAppointments.filter(apt => 
          apt.medicalRecord && 
          apt.medicalRecord.prescription && 
          apt.medicalRecord.prescription.length > 0
        );
        
        console.log('DoctorPrescriptionsScreen: Appointments with prescriptions:', withPrescription.length);
        
        setPrescriptions({
          needPrescription,
          withPrescription
        });
      } else {
        Alert.alert('Error', 'Failed to load prescriptions');
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionPress = (appointment) => {
    if (activeTab === 'needPrescription') {
      // Navigate to add prescription screen
      navigation.navigate('AddPrescription', { 
        appointmentId: appointment._id || appointment.appointmentId 
      });
    } else {
      // Navigate to view/edit prescription screen
      navigation.navigate('ViewPrescription', { 
        appointmentId: appointment._id || appointment.appointmentId,
        isDoctor: true
      });
    }
  };

  const renderAppointmentItem = ({ item }) => {
    const formattedDate = new Date(item.appointmentDate).toLocaleDateString();
    
    return (
      <TouchableOpacity
        style={styles.prescriptionItem}
        onPress={() => handlePrescriptionPress(item)}
      >
        <View style={styles.prescriptionHeader}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.appointmentDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.prescriptionContent}>
          <Text style={styles.reasonText}>
            <Text style={styles.reasonLabel}>Reason: </Text>
            {item.reasonForVisit || 'Not specified'}
          </Text>
          
          {activeTab === 'withPrescription' && item.medicalRecord && (
            <View style={styles.diagnosisContainer}>
              <Text style={styles.diagnosisText}>
                <Text style={styles.diagnosisLabel}>Diagnosis: </Text>
                {item.medicalRecord.diagnosis || 'Not specified'}
              </Text>
              <Text style={styles.medicationsLabel}>
                Medications: {item.medicalRecord.prescription?.length || 0}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              activeTab === 'needPrescription' ? styles.addButton : styles.editButton
            ]}
            onPress={() => handlePrescriptionPress(item)}
          >
            <Text style={styles.actionButtonText}>
              {activeTab === 'needPrescription' ? 'Add Prescription' : 'View/Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Prescriptions" />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'needPrescription' && styles.activeTab
          ]}
          onPress={() => setActiveTab('needPrescription')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'needPrescription' && styles.activeTabText
            ]}
          >
            Need Prescription ({prescriptions.needPrescription.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'withPrescription' && styles.activeTab
          ]}
          onPress={() => setActiveTab('withPrescription')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'withPrescription' && styles.activeTabText
            ]}
          >
            With Prescription ({prescriptions.withPrescription.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions[activeTab]}
          keyExtractor={item => item._id}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {activeTab === 'needPrescription'
                  ? 'No appointments need prescriptions at this time'
                  : 'No prescriptions have been created yet'}
              </Text>
            </Card>
          }
        />
      )}
      
      <FixedBottomBackButton 
        onPress={() => navigation.goBack()} 
        backgroundColor={theme.colors.primary}
        textColor="#FFFFFF"
        text="← Back to Dashboard"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Add extra padding for status bar
    zIndex: 10, // Ensure header is above other elements
  },
  backButton: {
    padding: 8,
    zIndex: 15, // Ensure back button stays above other elements
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  listContainer: {
    padding: 16,
  },
  prescriptionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.primaryLight,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    fontFamily: 'sans-serif',
  },
  appointmentDate: {
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: 'sans-serif',
  },
  prescriptionContent: {
    padding: 12,
  },
  reasonText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  reasonLabel: {
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  diagnosisContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  diagnosisText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  diagnosisLabel: {
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  medicationsLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  actionContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButton: {
    backgroundColor: theme.colors.accentLight,
  },
  editButton: {
    backgroundColor: theme.colors.primaryLight,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: 'sans-serif',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: 'sans-serif',
  },
});

export default DoctorPrescriptionsScreen;
