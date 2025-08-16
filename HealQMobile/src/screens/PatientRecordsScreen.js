import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import FixedBottomBackButton from '../components/FixedBottomBackButton';
import theme from '../config/theme';
import api from '../services/api';

const PatientRecordsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        patient => 
          patient.name.toLowerCase().includes(query) ||
          (patient.email && patient.email.toLowerCase().includes(query))
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Get all appointments to extract unique patients
      const response = await api.getDoctorAppointments({});
      
      if (response.success) {
        const appointments = response.data.appointments || [];
        
        // Map to extract unique patients
        const uniquePatients = new Map();
        
        appointments.forEach(apt => {
          if (!uniquePatients.has(apt.patientId._id)) {
            uniquePatients.set(apt.patientId._id, {
              id: apt.patientId._id,
              name: apt.patientName,
              email: apt.patientEmail,
              phoneNumber: apt.patientPhone,
              lastAppointment: apt.appointmentDate,
              appointmentCount: 1,
              lastAppointmentId: apt._id || apt.appointmentId
            });
          } else {
            // Update existing patient data
            const patient = uniquePatients.get(apt.patientId._id);
            
            // Update last appointment if newer
            if (new Date(apt.appointmentDate) > new Date(patient.lastAppointment)) {
              patient.lastAppointment = apt.appointmentDate;
              patient.lastAppointmentId = apt._id || apt.appointmentId;
            }
            
            patient.appointmentCount += 1;
          }
        });
        
        // Convert map to array and sort by name
        const patientList = Array.from(uniquePatients.values())
          .sort((a, b) => a.name.localeCompare(b.name));
          
        setPatients(patientList);
        setFilteredPatients(patientList);
      } else {
        Alert.alert('Error', 'Failed to load patients');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientPress = (patient) => {
    navigation.navigate('PatientDetails', { patientId: patient.id });
  };

  const handleViewLastAppointment = (appointmentId) => {
    navigation.navigate('AppointmentDetails', { appointmentId });
  };

  const renderPatientItem = ({ item }) => {
    const lastAppointmentDate = new Date(item.lastAppointment).toLocaleDateString();
    
    return (
      <Card style={styles.patientCard}>
        <TouchableOpacity 
          style={styles.patientHeader}
          onPress={() => handlePatientPress(item)}
        >
          <View style={styles.patientInitial}>
            <Text style={styles.initialText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientContact}>
              {item.phoneNumber || 'No phone number'} • {item.email || 'No email'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.patientFooter}>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentLabel}>Last Visit:</Text>
            <Text style={styles.appointmentValue}>{lastAppointmentDate}</Text>
            
            <Text style={styles.appointmentLabel}>Total Visits:</Text>
            <Text style={styles.appointmentValue}>{item.appointmentCount}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewLastAppointment(item.lastAppointmentId)}
          >
            <Text style={styles.viewButtonText}>View Last Visit</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Patient Records" />
      
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading patient records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={item => item.id}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptyText}>
                  No patients found matching "{searchQuery}"
                </Text>
              </View>
            ) : (
              <View style={styles.emptySearch}>
                <Text style={styles.emptyText}>No patient records found</Text>
              </View>
            )
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
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
  },
  listContainer: {
    padding: 16,
  },
  patientCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  patientInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  patientContact: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  appointmentInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  appointmentLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  appointmentValue: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  viewButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: theme.colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PatientRecordsScreen;
