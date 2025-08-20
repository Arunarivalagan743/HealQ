import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import theme from '../config/theme';
import { authAPI } from '../services/api';

const SimpleAppointmentBookingScreen = ({ navigation, route }) => {
  const { doctorId, doctorName, doctorSpecialty, consultationFee } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: '',
    preferredTime: '',
    symptoms: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  useEffect(() => {
    if (doctorId) {
      fetchAvailableDates();
    }
  }, [doctorId]);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      // Mocked data for available dates - replace with actual API call
      const dates = [
        { date: '2025-08-20', available: true },
        { date: '2025-08-21', available: true },
        { date: '2025-08-22', available: true },
        { date: '2025-08-23', available: false },
        { date: '2025-08-24', available: true },
        { date: '2025-08-25', available: true }
      ];
      
      setAvailableDates(dates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch available dates. Please try again.');
    }
  };

  const fetchAvailableTimeSlots = async (date) => {
    try {
      setLoading(true);
      // Mocked data for time slots - replace with actual API call
      const timeSlots = [
        { time: '09:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: false },
        { time: '12:00 PM', available: true },
        { time: '02:00 PM', available: true },
        { time: '03:00 PM', available: true },
        { time: '04:00 PM', available: false },
        { time: '05:00 PM', available: true }
      ];
      
      setAvailableTimeSlots(timeSlots);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch available time slots. Please try again.');
    }
  };

  const handleDateSelect = (date) => {
    setAppointmentData(prev => ({
      ...prev,
      appointmentDate: date,
      preferredTime: '' // Reset time when date changes
    }));
    fetchAvailableTimeSlots(date);
  };

  const handleTimeSelect = (time) => {
    setAppointmentData(prev => ({
      ...prev,
      preferredTime: time
    }));
  };

  const handleInputChange = (field, value) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for the field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!appointmentData.appointmentDate) {
      newErrors.appointmentDate = 'Please select an appointment date';
    }

    if (!appointmentData.preferredTime) {
      newErrors.preferredTime = 'Please select a preferred time';
    }

    if (!appointmentData.symptoms || appointmentData.symptoms.trim() === '') {
      newErrors.symptoms = 'Please describe your symptoms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookAppointment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success!
      Alert.alert(
        'Appointment Booked',
        'Your appointment has been successfully booked!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('PatientDashboard')
          }
        ]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Info */}
        <Card style={styles.doctorCard}>
          <Text style={styles.doctorName}>Dr. {doctorName}</Text>
          <Text style={styles.doctorSpecialty}>{doctorSpecialty}</Text>
          {consultationFee && (
            <Text style={styles.consultationFee}>
              Consultation Fee: ₹{consultationFee}
            </Text>
          )}
        </Card>

        {/* Date Selection */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateContainer}
          >
            {availableDates.map((dateObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateButton,
                  !dateObj.available && styles.disabledDate,
                  appointmentData.appointmentDate === dateObj.date && styles.selectedDate
                ]}
                disabled={!dateObj.available}
                onPress={() => handleDateSelect(dateObj.date)}
              >
                <Text style={[
                  styles.dateText,
                  appointmentData.appointmentDate === dateObj.date && styles.selectedText
                ]}>
                  {formatDate(dateObj.date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.appointmentDate && (
            <Text style={styles.errorText}>{errors.appointmentDate}</Text>
          )}
        </Card>

        {/* Time Selection */}
        {appointmentData.appointmentDate && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeContainer}>
              {availableTimeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeButton,
                    !slot.available && styles.disabledTime,
                    appointmentData.preferredTime === slot.time && styles.selectedTime
                  ]}
                  disabled={!slot.available}
                  onPress={() => handleTimeSelect(slot.time)}
                >
                  <Text style={[
                    styles.timeText,
                    appointmentData.preferredTime === slot.time && styles.selectedText
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.preferredTime && (
              <Text style={styles.errorText}>{errors.preferredTime}</Text>
            )}
          </Card>
        )}

        {/* Symptoms Input */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <Text style={styles.label}>Symptoms</Text>
          <Input
            placeholder="Describe your symptoms"
            multiline={true}
            numberOfLines={4}
            value={appointmentData.symptoms}
            onChangeText={(text) => handleInputChange('symptoms', text)}
            error={errors.symptoms}
          />

          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <Input
            placeholder="Any additional information for the doctor"
            multiline={true}
            numberOfLines={3}
            value={appointmentData.additionalNotes}
            onChangeText={(text) => handleInputChange('additionalNotes', text)}
          />
        </Card>

        {/* Book Appointment Button */}
        <Button
          title={loading ? 'Booking...' : 'Book Appointment'}
          onPress={handleBookAppointment}
          disabled={loading}
          style={styles.bookButton}
        />

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  doctorCard: {
    marginBottom: 16,
    padding: 16,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  doctorSpecialty: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  consultationFee: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    fontFamily: 'sans-serif',
  },
  dateContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedDate: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disabledDate: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
  dateText: {
    color: theme.colors.text,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  selectedText: {
    color: theme.colors.white,
    fontFamily: 'sans-serif',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  timeButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedTime: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disabledTime: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
  timeText: {
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'sans-serif',
  },
  bookButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'sans-serif',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: theme.colors.white,
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'sans-serif',
  },
});

export default SimpleAppointmentBookingScreen;
