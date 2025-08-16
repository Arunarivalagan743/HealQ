import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import FixedBottomBackButton from '../components/FixedBottomBackButton';
import theme from '../config/theme';
import api from '../services/api';

const ViewPrescriptionScreen = ({ route, navigation }) => {
  const { appointmentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    loadPrescriptionDetails();
  }, []);

  const loadPrescriptionDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading prescription details for appointment:', appointmentId);
      
      const response = await api.getAppointmentDetails(appointmentId);
      
      if (response.success) {
        const appointmentData = response.data.appointment;
        setAppointment(appointmentData);
        
        // Debug appointment data
        console.log('Appointment loaded:', {
          id: appointmentData._id,
          status: appointmentData.status,
          hasMedicalRecord: !!appointmentData.medicalRecord,
        });
        
        // If there's medical record, log its details
        if (appointmentData.medicalRecord) {
          console.log('Medical Record:', {
            diagnosis: appointmentData.medicalRecord.diagnosis,
            hasPrescription: !!appointmentData.medicalRecord.prescription,
            prescriptionLength: appointmentData.medicalRecord.prescription?.length,
            prescriptionData: appointmentData.medicalRecord.prescription,
            labTests: appointmentData.medicalRecord.labTests,
            hasLabTests: !!appointmentData.medicalRecord.labTests,
            labTestsLength: appointmentData.medicalRecord.labTests?.length,
            fullMedicalRecord: appointmentData.medicalRecord
          });
        }
      } else {
        Alert.alert('Error', 'Failed to load prescription details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading prescription:', error);
      Alert.alert('Error', 'Failed to load prescription details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading prescription details...</Text>
      </View>
    );
  }

  const { medicalRecord } = appointment || {};
  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Appointment not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }
  
  if (!medicalRecord) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Prescription has not been added yet</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Prescription Details</Text>
        
        <Card style={styles.appointmentCard}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <Text style={styles.appointmentId}>ID: {appointment.appointmentId}</Text>
          <Text style={styles.appointmentDate}>
            Date: {formatDate(appointment.appointmentDate)}
          </Text>
          <Text style={styles.appointmentTime}>
            Time: {appointment.timeSlot?.start} - {appointment.timeSlot?.end}
          </Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.doctorSection}>
            <Text style={styles.sectionTitle}>Doctor</Text>
            <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{appointment.doctorSpecialization}</Text>
          </View>
        </Card>
        
        {/* Diagnosis */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <Text style={styles.diagnosisText}>{medicalRecord.diagnosis || 'No diagnosis provided'}</Text>
        </Card>

        {/* Treatment Plan */}
        {(medicalRecord.treatmentDuration || medicalRecord.treatmentDescription) && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Treatment Plan</Text>
            {medicalRecord.treatmentDuration && (
              <Text style={styles.treatmentText}>
                Duration: {medicalRecord.treatmentDuration} days
              </Text>
            )}
            {medicalRecord.treatmentDescription && (
              <Text style={styles.treatmentDescription}>
                {medicalRecord.treatmentDescription}
              </Text>
            )}
          </Card>
        )}

        {/* Medications */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {medicalRecord.prescription && medicalRecord.prescription.length > 0 ? (
            medicalRecord.prescription.map((med, index) => (
              <View key={index} style={styles.medicationItem}>
                <Text style={styles.medicationName}>{med.medicationName || 'Unnamed medication'}</Text>
                <Text style={styles.medicationDetails}>
                  Dosage: {med.dosage || 'Not specified'}
                </Text>
                <Text style={styles.medicationDetails}>
                  Frequency: {med.frequency || 'Not specified'}
                </Text>
                {med.duration && (
                  <Text style={styles.medicationDetails}>
                    Duration: {med.duration}
                  </Text>
                )}
                {med.instructions && (
                  <Text style={styles.medicationInstructions}>
                    Instructions: {med.instructions}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyMedications}>No medications have been specified for this prescription.</Text>
          )}
        </Card>

        {/* Lab Tests */}
        {medicalRecord.labTests && medicalRecord.labTests.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            {medicalRecord.labTests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <Text style={styles.testName}>{test.testName}</Text>
                {test.instructions && (
                  <Text style={styles.testInstructions}>
                    Instructions: {test.instructions}
                  </Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Follow Up */}
        {medicalRecord.followUp && medicalRecord.followUp.required && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Follow Up</Text>
            <Text style={styles.followUpText}>
              Required after {medicalRecord.followUp.afterDays} days
            </Text>
            {medicalRecord.followUp.instructions && (
              <Text style={styles.followUpInstructions}>
                {medicalRecord.followUp.instructions}
              </Text>
            )}
          </Card>
        )}

        {/* Doctor Notes */}
        {medicalRecord.doctorNotes && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            <Text style={styles.doctorNotes}>{medicalRecord.doctorNotes}</Text>
          </Card>
        )}
      </ScrollView>
      
      <FixedBottomBackButton onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  appointmentCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  appointmentId: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 15,
    color: theme.colors.text,
  },
  doctorSection: {
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  diagnosisText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  treatmentText: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
  },
  treatmentDescription: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  medicationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  medicationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  medicationDetails: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 3,
  },
  medicationInstructions: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  testItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  testInstructions: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  followUpText: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
  },
  followUpInstructions: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  doctorNotes: {
    fontSize: 15,
    color: theme.colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  emptyMedications: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    padding: 10,
    textAlign: 'center',
  },
});

export default ViewPrescriptionScreen;
