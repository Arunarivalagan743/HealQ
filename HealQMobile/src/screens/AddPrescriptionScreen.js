import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import FixedBottomBackButton from '../components/FixedBottomBackButton';
import theme from '../config/theme';
import api from '../services/api';

const AddPrescriptionScreen = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    treatmentDuration: '',
    treatmentDescription: '',
    doctorNotes: '',
    medications: [
      {
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ],
    labTests: [
      {
        testName: '',
        instructions: '',
      },
    ],
    followUp: {
      required: false,
      afterDays: '',
      instructions: '',
    },
  });

  useEffect(() => {
    loadAppointmentDetails();
  }, []);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getAppointmentDetails(appointmentId);
      if (response.success) {
        const appointmentData = response.data.appointment;
        setAppointment(appointmentData);
        
        // If appointment has existing medical record with prescription, load it
        if (appointmentData.medicalRecord) {
          const medRecord = appointmentData.medicalRecord;
          
          setPrescription({
            diagnosis: medRecord.diagnosis || '',
            treatmentDuration: medRecord.treatmentDuration ? medRecord.treatmentDuration.toString() : '',
            treatmentDescription: medRecord.treatmentDescription || '',
            doctorNotes: medRecord.doctorNotes || '',
            medications: medRecord.prescription && medRecord.prescription.length > 0 
              ? medRecord.prescription.map(med => ({
                  medicationName: med.medicationName || '',
                  dosage: med.dosage || '',
                  frequency: med.frequency || '',
                  duration: med.duration || '',
                  instructions: med.instructions || '',
                }))
              : [
                {
                  medicationName: '',
                  dosage: '',
                  frequency: '',
                  duration: '',
                  instructions: '',
                }
              ],
            labTests: medRecord.labTests && medRecord.labTests.length > 0 
              ? medRecord.labTests.map(test => ({
                  testName: test.testName || '',
                  instructions: test.instructions || '',
                }))
              : [
                {
                  testName: '',
                  instructions: '',
                }
              ],
            followUp: {
              required: medRecord.followUp?.required || false,
              afterDays: medRecord.followUp?.afterDays ? medRecord.followUp.afterDays.toString() : '',
              instructions: medRecord.followUp?.instructions || '',
            },
          });
        }
      } else {
        Alert.alert('Error', 'Failed to load appointment details');
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          medicationName: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
        },
      ],
    }));
  };

  const removeMedication = (index) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const updateMedication = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));
  };

  const addLabTest = () => {
    setPrescription(prev => ({
      ...prev,
      labTests: [
        ...prev.labTests,
        {
          testName: '',
          instructions: '',
        },
      ],
    }));
  };

  const removeLabTest = (index) => {
    setPrescription(prev => ({
      ...prev,
      labTests: prev.labTests.filter((_, i) => i !== index),
    }));
  };

  const updateLabTest = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      labTests: prev.labTests.map((test, i) =>
        i === index ? { ...test, [field]: value } : test
      ),
    }));
  };

  const validatePrescription = () => {
    if (!prescription.diagnosis.trim()) {
      Alert.alert('Validation Error', 'Please enter a diagnosis');
      return false;
    }
    
    // Check if at least one medication has required fields
    const validMedications = prescription.medications.filter(med => 
      med.medicationName.trim() && med.dosage.trim() && med.frequency.trim()
    );
    
    if (validMedications.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one medication with name, dosage, and frequency');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePrescription()) return;

    setLoading(true);
    try {
      // Filter out empty medications and lab tests
      const cleanedPrescription = {
        diagnosis: prescription.diagnosis,
        medications: prescription.medications.filter(med => med.medicationName.trim()),
        labTests: prescription.labTests.filter(test => test.testName.trim()),
        doctorNotes: prescription.doctorNotes,
        treatmentDuration: prescription.treatmentDuration ? parseInt(prescription.treatmentDuration) : null,
        treatmentDescription: prescription.treatmentDescription,
        followUp: {
          ...prescription.followUp,
          afterDays: prescription.followUp.afterDays ? parseInt(prescription.followUp.afterDays) : null,
        },
      };

      const response = await api.addPrescription(appointmentId, cleanedPrescription);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Prescription added successfully! The patient will receive it via email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to add prescription');
      }
    } catch (error) {
      console.error('Error adding prescription:', error);
      Alert.alert('Error', 'Failed to add prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !appointment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Add Prescription</Text>
        
        {appointment && (
          <Card style={styles.appointmentCard}>
            <Text style={styles.sectionTitle}>Appointment Details</Text>
            <Text style={styles.patientName}>Patient: {appointment.patientName}</Text>
            <Text style={styles.appointmentDate}>
              Date: {new Date(appointment.appointmentDate).toLocaleDateString()}
            </Text>
            <Text style={styles.appointmentTime}>
              Time: {appointment.timeSlot?.start} - {appointment.timeSlot?.end}
            </Text>
            {appointment.reasonForVisit && (
              <Text style={styles.reasonForVisit}>
                Reason: {appointment.reasonForVisit}
              </Text>
            )}
          </Card>
        )}

        {/* Diagnosis */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Diagnosis *</Text>
          <Input
            placeholder="Enter diagnosis..."
            multiline
            numberOfLines={3}
            value={prescription.diagnosis}
            onChangeText={(value) => setPrescription(prev => ({ ...prev, diagnosis: value }))}
            style={styles.textArea}
          />
        </Card>

        {/* Treatment Duration */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Treatment Plan</Text>
          <Input
            label="Treatment Duration (days)"
            placeholder="e.g., 7"
            keyboardType="numeric"
            value={prescription.treatmentDuration}
            onChangeText={(value) => setPrescription(prev => ({ ...prev, treatmentDuration: value }))}
          />
          <Input
            label="Treatment Description"
            placeholder="Describe the treatment plan..."
            multiline
            numberOfLines={3}
            value={prescription.treatmentDescription}
            onChangeText={(value) => setPrescription(prev => ({ ...prev, treatmentDescription: value }))}
            style={styles.textArea}
          />
        </Card>

        {/* Medications */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medications *</Text>
            <TouchableOpacity style={styles.addButton} onPress={addMedication}>
              <Text style={styles.addButtonText}>+ Add Medication</Text>
            </TouchableOpacity>
          </View>
          
          {prescription.medications.map((medication, index) => (
            <View key={index} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationTitle}>Medication {index + 1}</Text>
                {prescription.medications.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMedication(index)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Input
                label="Medication Name *"
                placeholder="e.g., Paracetamol"
                value={medication.medicationName}
                onChangeText={(value) => updateMedication(index, 'medicationName', value)}
              />
              <Input
                label="Dosage *"
                placeholder="e.g., 500mg"
                value={medication.dosage}
                onChangeText={(value) => updateMedication(index, 'dosage', value)}
              />
              <Input
                label="Frequency *"
                placeholder="e.g., Twice daily"
                value={medication.frequency}
                onChangeText={(value) => updateMedication(index, 'frequency', value)}
              />
              <Input
                label="Duration"
                placeholder="e.g., 5 days"
                value={medication.duration}
                onChangeText={(value) => updateMedication(index, 'duration', value)}
              />
              <Input
                label="Instructions"
                placeholder="e.g., Take after meals"
                multiline
                numberOfLines={2}
                value={medication.instructions}
                onChangeText={(value) => updateMedication(index, 'instructions', value)}
                style={styles.textArea}
              />
            </View>
          ))}
        </Card>

        {/* Lab Tests */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            <TouchableOpacity style={styles.addButton} onPress={addLabTest}>
              <Text style={styles.addButtonText}>+ Add Test</Text>
            </TouchableOpacity>
          </View>
          
          {prescription.labTests.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testTitle}>Test {index + 1}</Text>
                {prescription.labTests.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeLabTest(index)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Input
                label="Test Name"
                placeholder="e.g., Complete Blood Count"
                value={test.testName}
                onChangeText={(value) => updateLabTest(index, 'testName', value)}
              />
              <Input
                label="Instructions"
                placeholder="e.g., Fasting required"
                multiline
                numberOfLines={2}
                value={test.instructions}
                onChangeText={(value) => updateLabTest(index, 'instructions', value)}
                style={styles.textArea}
              />
            </View>
          ))}
        </Card>

        {/* Follow-up */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Follow-up</Text>
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setPrescription(prev => ({
                ...prev,
                followUp: { ...prev.followUp, required: !prev.followUp.required }
              }))}
            >
              <Text style={styles.checkboxText}>
                {prescription.followUp.required ? '☑️' : '☐'} Follow-up required
              </Text>
            </TouchableOpacity>
          </View>
          
          {prescription.followUp.required && (
            <>
              <Input
                label="Follow-up after (days)"
                placeholder="e.g., 7"
                keyboardType="numeric"
                value={prescription.followUp.afterDays}
                onChangeText={(value) => setPrescription(prev => ({
                  ...prev,
                  followUp: { ...prev.followUp, afterDays: value }
                }))}
              />
              <Input
                label="Follow-up Instructions"
                placeholder="Additional instructions for follow-up..."
                multiline
                numberOfLines={2}
                value={prescription.followUp.instructions}
                onChangeText={(value) => setPrescription(prev => ({
                  ...prev,
                  followUp: { ...prev.followUp, instructions: value }
                }))}
                style={styles.textArea}
              />
            </>
          )}
        </Card>

        {/* Doctor's Notes */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Doctor's Notes</Text>
          <Input
            placeholder="Additional notes for the patient..."
            multiline
            numberOfLines={4}
            value={prescription.doctorNotes}
            onChangeText={(value) => setPrescription(prev => ({ ...prev, doctorNotes: value }))}
            style={styles.textArea}
          />
        </Card>

        <Button
          title={loading ? 'Adding Prescription...' : 'Add Prescription & Send to Patient'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />
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
    padding: theme.spacing.md,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  appointmentCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  appointmentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  reasonForVisit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  addButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  addButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  medicationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  medicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  removeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
  },
  removeButtonText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  testCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  checkboxContainer: {
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  submitButton: {
    marginBottom: theme.spacing.xl * 2, // Extra space for back button
  },
});

export default AddPrescriptionScreen;
