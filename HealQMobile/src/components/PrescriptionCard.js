import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Card from './Card';
import theme from '../config/theme';

const PrescriptionCard = ({ prescription, appointment, onPress }) => {
  // Add console log for debugging
  console.log("PrescriptionCard received data:", { 
    prescription, 
    appointmentId: appointment?._id, 
    hasMedicalRecord: !!prescription,
    diagnosisExists: prescription?.diagnosis,
    prescriptionArray: prescription?.prescription,
    labTestsArray: prescription?.labTests
  });
  
  if (!prescription) {
    console.log("PrescriptionCard: No prescription data provided");
    return null;
  }
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Prescription</Text>
          <Text style={styles.date}>{formatDate(appointment?.appointmentDate)}</Text>
        </View>
        
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {appointment?.doctorName}</Text>
          <Text style={styles.specialty}>{appointment?.doctorSpecialization}</Text>
        </View>
        
        {prescription.diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <Text style={styles.sectionContent}>{prescription.diagnosis}</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {prescription.prescription && prescription.prescription.length > 0 ? (
            <View style={styles.medicationList}>
              {prescription.prescription.slice(0, 2).map((med, index) => (
                <Text key={index} style={styles.medicationItem}>
                  • {med.medicationName || 'Unnamed'} - {med.dosage || 'N/A'}, {med.frequency || 'N/A'}
                </Text>
              ))}
              {prescription.prescription.length > 2 && (
                <Text style={styles.moreText}>+ {prescription.prescription.length - 2} more</Text>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No medications specified</Text>
          )}
        </View>
        
        {/* Lab Tests Section */}
        {prescription.labTests && prescription.labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            <View style={styles.medicationList}>
              {prescription.labTests.slice(0, 2).map((test, index) => (
                <Text key={index} style={styles.medicationItem}>
                  • {test.testName || 'Unnamed Test'} 
                  {test.instructions ? ` - ${test.instructions}` : ''}
                </Text>
              ))}
              {prescription.labTests.length > 2 && (
                <Text style={styles.moreText}>+ {prescription.labTests.length - 2} more tests</Text>
              )}
            </View>
          </View>
        )}
        
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Complete Prescription</Text>
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  doctorInfo: {
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '500',
  },
  specialty: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  sectionContent: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  medicationList: {
    marginTop: 2,
  },
  medicationItem: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginVertical: 2,
  },
  moreText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  viewButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 4,
  },
  viewButtonText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default PrescriptionCard;
