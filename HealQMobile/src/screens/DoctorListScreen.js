import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Input from '../components/Input';
import Card from '../components/Card';
import Button from '../components/Button';
import theme from '../config/theme';
import api, { authAPI } from '../services/api';

const DoctorListScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  
  const specialties = [
    'all',
    'cardiology',
    'dermatology',
    'endocrinology',
    'gastroenterology',
    'neurology',
    'orthopedics',
    'pediatrics',
    'psychiatry',
    'radiology',
    'general-practice',
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [doctors, searchQuery, selectedSpecialty, availabilityFilter]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      // Use the public verified doctors endpoint
      const response = await api.getAllDoctors();
      
      if (response.success) {
        // The API returns data.doctors, not just data
        const doctorsData = response.data?.doctors || response.data || [];
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } else {
        Alert.alert('Error', 'Failed to fetch doctors');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  };

  const applyFilters = () => {
    // Ensure doctors is always an array before spreading
    if (!Array.isArray(doctors)) {
      setFilteredDoctors([]);
      return;
    }
    
    let filtered = [...doctors];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(query) ||
        doctor.specialty?.toLowerCase().includes(query) ||
        doctor.clinicName?.toLowerCase().includes(query) ||
        doctor.location?.toLowerCase().includes(query)
      );
    }

    // Apply specialty filter
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(doctor =>
        doctor.specialty?.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    // Apply availability filter
    if (availabilityFilter === 'available-today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(doctor =>
        doctor.availability?.some(slot => slot.date === today && slot.available)
      );
    } else if (availabilityFilter === 'available-this-week') {
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(doctor =>
        doctor.availability?.some(slot => {
          const slotDate = new Date(slot.date);
          return slotDate >= today && slotDate <= weekFromNow && slot.available;
        })
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = async (doctor) => {
    try {
      // Check if patient has a profile before booking
      const profileResponse = await api.getPatientProfile();
      
      if (profileResponse.success && profileResponse.data) {
        // Patient has profile, proceed to booking
        navigation.navigate('AppointmentBooking', {
          doctorId: doctor._id,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialization || doctor.specialty,
        });
      } else {
        // Patient doesn't have profile, guide them to create one
        Alert.alert(
          'Profile Required',
          'You need to create a patient profile before booking appointments. Would you like to create your profile now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Create Profile', 
              onPress: () => navigation.navigate('PatientProfile')
            }
          ]
        );
      }
    } catch (error) {
      // Profile doesn't exist, guide them to create one
      Alert.alert(
        'Profile Required',
        'You need to create a patient profile before booking appointments. Would you like to create your profile now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Profile', 
            onPress: () => navigation.navigate('PatientProfile')
          }
        ]
      );
    }
  };

  const handleViewProfile = (doctor) => {
    navigation.navigate('PatientDoctorView', {
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization || doctor.specialty,
    });
  };

  const renderDoctorItem = ({ item }) => (
    <Card style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
          {item.clinicName && (
            <Text style={styles.clinicName}>{item.clinicName}</Text>
          )}
          {item.location && (
            <Text style={styles.location}>{item.location}</Text>
          )}
        </View>
        
        <View style={styles.ratingContainer}>
          {(item.rating?.average || item.rating) && (
            <>
              <Text style={styles.rating}>
                ⭐ {typeof (item.rating?.average || item.rating) === 'number' 
                  ? (item.rating?.average || item.rating).toFixed(1) 
                  : '0.0'}
              </Text>
              <Text style={styles.reviewCount}>
                ({item.rating?.count || item.reviewCount || 0} reviews)
              </Text>
            </>
          )}
          
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>
      </View>

      {item.experience && (
        <Text style={styles.experience}>
          {item.experience} years of experience
        </Text>
      )}

      {item.education && item.education.length > 0 && (
        <Text style={styles.education}>
          {item.education[0].degree} - {item.education[0].institution}
        </Text>
      )}

      {item.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {item.bio}
        </Text>
      )}

      <View style={styles.availabilityContainer}>
        <Text style={styles.availabilityLabel}>Next available:</Text>
        {item.nextAvailable ? (
          <Text style={styles.nextAvailable}>
            {new Date(item.nextAvailable).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : (
          <Text style={styles.noAvailability}>Check availability</Text>
        )}
      </View>

      <View style={styles.actionContainer}>
        <Button
          title="View Profile"
          onPress={() => handleViewProfile(item)}
          style={[styles.actionButton, styles.profileButton]}
        />
        <Button
          title="Book Appointment"
          onPress={() => handleBookAppointment(item)}
          style={[styles.actionButton, styles.bookButton]}
        />
      </View>
    </Card>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Input
        placeholder="Search doctors, specialties, locations..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />
      
      <View style={styles.pickerRow}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Specialty</Text>
          <Picker
            selectedValue={selectedSpecialty}
            onValueChange={setSelectedSpecialty}
            style={styles.picker}
          >
            {specialties.map(specialty => (
              <Picker.Item
                key={specialty}
                label={specialty === 'all' ? 'All Specialties' : specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                value={specialty}
              />
            ))}
          </Picker>
        </View>
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Availability</Text>
          <Picker
            selectedValue={availabilityFilter}
            onValueChange={setAvailabilityFilter}
            style={styles.picker}
          >
            <Picker.Item label="All" value="all" />
            <Picker.Item label="Available Today" value="available-today" />
            <Picker.Item label="Available This Week" value="available-this-week" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No doctors found</Text>
      <Text style={styles.emptySubtext}>
        Try adjusting your search criteria or filters
      </Text>
      <Button
        title="Clear Filters"
        onPress={() => {
          setSearchQuery('');
          setSelectedSpecialty('all');
          setAvailabilityFilter('all');
        }}
        style={styles.clearFiltersButton}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilters()}
      
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
        </Text>
      </View>
      
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorItem}
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
  filtersContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  picker: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    height: 45,
  },
  resultsHeader: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  resultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  doctorCard: {
    marginBottom: theme.spacing.md,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  clinicName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  ratingContainer: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.md,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  verifiedText: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: '600',
  },
  experience: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  education: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  bio: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  nextAvailable: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '500',
  },
  noAvailability: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    height: 40,
  },
  profileButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
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
  clearFiltersButton: {
    minWidth: 150,
  },
});

export default DoctorListScreen;

