import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import theme from '../config/theme';
import api from '../services/api';

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { doctorId, doctorName, doctorSpecialty } = route.params;
  
  const [formData, setFormData] = useState({
    appointmentDate: new Date(),
    appointmentTime: '',
    appointmentType: 'consultation',
    symptoms: '',
    notes: '',
    preferredCommunication: 'video',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Check if doctorId is available
      if (!doctorId) {
        console.error('No doctorId provided for availability check');
        setAvailableSlots([]);
        return;
      }
      
      const response = await api.getDoctorAvailability(doctorId, dateStr);
      console.log('Availability response:', response);
      
      if (response.success && response.data) {
        // Handle different possible response structures
        if (response.data.available) {
          const slots = response.data.slots || [];
          let timeSlots = slots
            .filter(slot => slot.available)
            .map(slot => slot.start);
          
          // Filter out past time slots if it's today
          const today = new Date();
          if (selectedDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
            const currentHour = new Date().getHours();
            const currentMinute = new Date().getMinutes();
            
            timeSlots = timeSlots.filter(slot => {
              const [hour, minute] = slot.split(':').map(Number);
              // Keep slot only if it's in the future
              return (hour > currentHour || (hour === currentHour && minute > currentMinute));
            });
            console.log('After filtering past slots for today:', timeSlots);
          }
          
          setAvailableSlots(timeSlots);
        } else {
          // If no slots available or doctor not available on this date
          setAvailableSlots([]);
        }
      } else {
        // If API returns success: false, no slots available
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      // If there's an API error, provide some default time slots
      const defaultSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ];
      
      // Filter out past time slots if it's today
      const today = new Date();
      if (selectedDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        
        const filteredSlots = defaultSlots.filter(slot => {
          const [timeStart] = slot.split(':');
          const hour = parseInt(timeStart);
          // Simple check: only show future hours for default slots
          return hour > currentHour;
        });
        
        setAvailableSlots(filteredSlots);
      } else {
        setAvailableSlots(defaultSlots);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setFormData({ ...formData, appointmentDate: date });
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setFormData({ ...formData, appointmentTime: timeString });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.appointmentTime) {
      Alert.alert('Error', 'Please select an appointment time');
      return false;
    }
    
    if (!formData.symptoms.trim()) {
      Alert.alert('Error', 'Please describe your symptoms or reason for visit');
      return false;
    }
    
    return true;
  };

  const handleBookAppointment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const appointmentData = {
        doctorId,
        appointmentDate: formData.appointmentDate.toISOString().split('T')[0],
        appointmentTime: formData.appointmentTime,
        consultationType: 'In-person', // Always offline
        appointmentType: 'consultation',
        reasonForVisit: formData.symptoms,
        symptoms: formData.symptoms,
        notes: formData.notes,
        preferredCommunication: formData.preferredCommunication || 'phone',
      };

      const response = await api.bookAppointment(appointmentData);
      
      if (response.success) {
        Alert.alert(
          'Request Submitted!',
          'Your appointment request has been submitted successfully. The doctor will review and approve your request. You will be notified once approved.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.doctorCard}>
        <Text style={styles.doctorName}>{doctorName}</Text>
        <Text style={styles.doctorSpecialty}>{doctorSpecialty}</Text>
      </Card>

      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Appointment Details</Text>
        
        {/* Date Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(formData.appointmentDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.appointmentDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* Time Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Time Slots</Text>
          {availableSlots.length > 0 ? (
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    formData.appointmentTime === slot && styles.selectedTimeSlot,
                  ]}
                  onPress={() => handleInputChange('appointmentTime', slot)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      formData.appointmentTime === slot && styles.selectedTimeSlotText,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noSlotsText}>No available slots for this date</Text>
          )}
        </View>

        {/* Appointment Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Appointment Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.appointmentType}
              onValueChange={(value) => handleInputChange('appointmentType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Consultation" value="consultation" />
              <Picker.Item label="Follow-up" value="follow-up" />
              <Picker.Item label="Emergency" value="emergency" />
              <Picker.Item label="Routine Check-up" value="routine" />
            </Picker>
          </View>
        </View>

        {/* Communication Preference */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Communication</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.preferredCommunication}
              onValueChange={(value) => handleInputChange('preferredCommunication', value)}
              style={styles.picker}
            >
              <Picker.Item label="Video Call" value="video" />
              <Picker.Item label="Phone Call" value="phone" />
              <Picker.Item label="In-Person" value="in-person" />
              <Picker.Item label="Chat" value="chat" />
            </Picker>
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symptoms / Reason for Visit *</Text>
          <Input
            placeholder="Describe your symptoms or reason for appointment..."
            multiline
            numberOfLines={4}
            value={formData.symptoms}
            onChangeText={(value) => handleInputChange('symptoms', value)}
            style={styles.textArea}
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <Input
            placeholder="Any additional information for the doctor..."
            multiline
            numberOfLines={3}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            style={styles.textArea}
          />
        </View>

        <Button
          title={loading ? 'Booking...' : 'Book Appointment'}
          onPress={handleBookAppointment}
          disabled={loading}
          style={styles.bookButton}
        />
        
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary} 
            style={styles.loader}
          />
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  doctorCard: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  doctorSpecialty: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  formCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontFamily: 'sans-serif',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeSlot: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  selectedTimeSlotText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  noSlotsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.spacing.md,
    fontFamily: 'sans-serif',
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  picker: {
    height: 50,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bookButton: {
    marginTop: theme.spacing.lg,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
});

export default AppointmentBookingScreen;

