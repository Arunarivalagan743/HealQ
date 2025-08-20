import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Input, Button, Card } from '../components';
import { profileAPI, appointmentAPI } from '../services/api';
import theme from '../config/theme';

const DoctorFinderScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [filters, setFilters] = useState({
    specialization: '',
    minFee: '',
    maxFee: '',
    consultationMode: '',
    search: ''
  });
  const [specializations, setSpecializations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [doctors, filters]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      // Use the verified doctors endpoint that doesn't require admin privileges
      const response = await profileAPI.getAllDoctors({ isVerified: true, isActive: true });
      console.log('Doctors API response:', response);
      
      if (response.success && response.data && response.data.doctors) {
        setDoctors(response.data.doctors);
        
        // Extract specializations for filters
        const uniqueSpecializations = [...new Set(response.data.doctors.map(doc => doc.specialization).filter(Boolean))];
        setSpecializations(uniqueSpecializations);
      } else {
        console.warn('No doctors found in response:', response);
        setDoctors([]);
        setSpecializations([]);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
      setDoctors([]);
      setSpecializations([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...doctors];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doctor.clinicAddress?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Specialization filter
    if (filters.specialization) {
      filtered = filtered.filter(doctor => doctor.specialization === filters.specialization);
    }

    // Fee range filter
    if (filters.minFee) {
      filtered = filtered.filter(doctor => 
        doctor.consultationFee && 
        typeof doctor.consultationFee === 'number' && 
        doctor.consultationFee >= parseFloat(filters.minFee)
      );
    }
    if (filters.maxFee) {
      filtered = filtered.filter(doctor => 
        doctor.consultationFee && 
        typeof doctor.consultationFee === 'number' && 
        doctor.consultationFee <= parseFloat(filters.maxFee)
      );
    }

    // All doctors are offline only, no need to filter consultation mode

    setFilteredDoctors(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      specialization: '',
      minFee: '',
      maxFee: '',
      consultationMode: '',
      search: ''
    });
  };

  const viewDoctorProfile = (doctor) => {
    navigation.navigate('PatientDoctorView', { 
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization
    });
  };

  const bookAppointment = (doctor) => {
    navigation.navigate('AppointmentBooking', { 
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization,
      consultationFee: doctor.consultationFee
    });
  };

  const renderDoctor = ({ item: doctor }) => (
    <Card style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorImageContainer}>
          {doctor.profilePicture ? (
            <Image source={{ uri: doctor.profilePicture }} style={styles.doctorImage} />
          ) : (
            <View style={styles.doctorImagePlaceholder}>
              <Text style={styles.doctorImageText}>
                {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name || 'Unknown Doctor'}</Text>
          <Text style={styles.doctorSpecialization}>{doctor.specialization || 'General Medicine'}</Text>
          <Text style={styles.doctorExperience}>
            {doctor.experience ? `${doctor.experience} years experience` : 'Experience not available'}
          </Text>
          
          <View style={styles.feeContainer}>
            <Text style={styles.consultationFee}>
              {doctor.consultationFee ? `₹${doctor.consultationFee}` : 'Contact for details'}
            </Text>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
          </View>
        </View>

        <View style={styles.verificationBadge}>
          {doctor.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.doctorDetails}>
        <Text style={styles.detailLabel}>Available Days:</Text>
        <Text style={styles.detailText}>
          {doctor.workingDays && doctor.workingDays.length > 0 
            ? doctor.workingDays.join(', ')
            : 'Contact for schedule'
          }
        </Text>
        
        <Text style={styles.detailLabel}>Working Hours:</Text>
        <Text style={styles.detailText}>
          {doctor.workingHours && doctor.workingHours.start && doctor.workingHours.end
            ? `${doctor.workingHours.start} - ${doctor.workingHours.end}`
            : 'Contact for timings'
          }
        </Text>
        
        <Text style={styles.detailLabel}>Consultation Mode:</Text>
        <Text style={styles.detailText}>In-person (Offline Consultation)</Text>
        
        <Text style={styles.detailLabel}>Clinic Address:</Text>
        <Text style={styles.detailText} numberOfLines={2}>
          {doctor.clinicAddress || 'Address not available'}
        </Text>

        {doctor.bio && (
          <>
            <Text style={styles.detailLabel}>About:</Text>
            <Text style={styles.detailText} numberOfLines={3}>
              {doctor.bio}
            </Text>
          </>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewProfileButton]}
          onPress={() => viewDoctorProfile(doctor)}
        >
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.bookButton]}
          onPress={() => bookAppointment(doctor)}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderFilters = () => (
    <Card style={styles.filtersCard}>
      <View style={styles.filtersHeader}>
        <Text style={styles.filtersTitle}>Filters</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Input
        label="Search"
        value={filters.search}
        onChangeText={(value) => handleFilterChange('search', value)}
        placeholder="Search by name, specialization..."
      />

      <Text style={styles.filterLabel}>Specialization</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            !filters.specialization && styles.selectedFilterOption
          ]}
          onPress={() => handleFilterChange('specialization', '')}
        >
          <Text style={[
            styles.filterOptionText,
            !filters.specialization && styles.selectedFilterOptionText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {specializations.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[
              styles.filterOption,
              filters.specialization === spec && styles.selectedFilterOption
            ]}
            onPress={() => handleFilterChange('specialization', spec)}
          >
            <Text style={[
              styles.filterOptionText,
              filters.specialization === spec && styles.selectedFilterOptionText
            ]}>
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.feeRangeContainer}>
        <View style={styles.feeInput}>
          <Input
            label="Min Fee (₹)"
            value={filters.minFee}
            onChangeText={(value) => handleFilterChange('minFee', value)}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.feeInput}>
          <Input
            label="Max Fee (₹)"
            value={filters.maxFee}
            onChangeText={(value) => handleFilterChange('maxFee', value)}
            placeholder="10000"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Removed consultation mode filter - all doctors are offline only */}
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Doctor</Text>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && renderFilters()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filters.search || filters.specialization || filters.minFee || filters.maxFee
                ? 'No doctors found matching your criteria'
                : 'No doctors available at the moment'
              }
            </Text>
            {(filters.search || filters.specialization || filters.minFee || filters.maxFee) && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Back Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: 'sans-serif',
  },
  filterToggle: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterToggleText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  filtersCard: {
    margin: 20,
    marginTop: 0,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  clearFiltersText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 10,
    fontFamily: 'sans-serif',
  },
  horizontalScroll: {
    marginBottom: 15,
  },
  filterOption: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedFilterOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterOptionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  selectedFilterOptionText: {
    color: theme.colors.white,
    fontFamily: 'sans-serif',
  },
  feeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  feeInput: {
    flex: 0.45,
  },
  consultationModeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  doctorCard: {
    marginBottom: 15,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  doctorImageContainer: {
    marginRight: 15,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  doctorImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorImageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: 'sans-serif',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  doctorSpecialization: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  doctorExperience: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  consultationFee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginRight: 8,
    fontFamily: 'sans-serif',
  },
  feeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  verificationBadge: {
    alignItems: 'flex-end',
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  doctorDetails: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'sans-serif',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProfileButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  viewProfileButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'sans-serif',
  },
  clearFiltersButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearFiltersButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
});

export default DoctorFinderScreen;

