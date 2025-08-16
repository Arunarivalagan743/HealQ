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

const TimeSlot = ({ slot, isBooked, appointmentData, onPress, isPast }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.timeSlot, 
        isBooked ? styles.bookedSlot : 
        isPast ? styles.pastSlot : styles.availableSlot
      ]}
      onPress={() => onPress(slot, appointmentData)}
      disabled={!isBooked || isPast} // Only clickable if booked and not past
    >
      <Text style={[
        styles.timeText,
        isPast && styles.pastText
      ]}>
        {slot}
      </Text>
      <Text style={[
        styles.statusText,
        isPast && styles.pastText
      ]}>
        {isPast ? 'Past' : isBooked ? 'Booked' : 'Available'}
      </Text>
      {isBooked && (
        <Text style={[
          styles.patientName,
          isPast && styles.pastText
        ]} numberOfLines={1}>
          {appointmentData?.patientName || 'Patient'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const DoctorScheduleCard = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Time slots from 9 AM to 5 PM with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      const hourString = hour.toString().padStart(2, '0');
      slots.push(`${hourString}:00 - ${hourString}:30`);
      slots.push(`${hourString}:30 - ${(hour + 1).toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    console.log(`Formatting date: ${date} to ${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const dateStr = formatDateToString(selectedDate);
      
      console.log('Loading schedule for date:', dateStr);
      console.log('Selected date object:', selectedDate);
      
      // Get all time slots
      const allSlots = generateTimeSlots();
      
      // Fetch appointments for the selected date
      console.log('Making API request for date:', dateStr);
      const response = await api.getDoctorAppointments({ date: dateStr });
      console.log('Schedule response:', response);
      
      if (response.success) {
        const appointmentsData = response.data.appointments || [];
        console.log('Appointments found:', appointmentsData.length);
        if (appointmentsData.length > 0) {
          console.log('First appointment:', {
            id: appointmentsData[0]._id,
            date: appointmentsData[0].appointmentDate,
            timeSlot: appointmentsData[0].timeSlot
          });
        }
        setAppointments(appointmentsData);
        
        // Check if the selected date is today
        const today = new Date();
        const isToday = selectedDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        
        // Map time slots with appointment data
        const mappedSlots = allSlots.map(slot => {
          // Find if there's an appointment for this slot
          const appointment = appointmentsData.find(apt => {
            if (!apt.timeSlot) return false;
            const aptSlot = `${apt.timeSlot.start} - ${apt.timeSlot.end}`;
            const matches = aptSlot === slot;
            return matches;
          });
          
          // Check if the slot is in the past (only for today)
          let isPast = false;
          if (isToday) {
            const [slotStart] = slot.split(' - ');
            const [hour, minute] = slotStart.split(':').map(Number);
            
            if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
              isPast = true;
            }
          }
          
          return {
            time: slot,
            isBooked: !!appointment,
            appointment: appointment || null,
            isPast: isPast
          };
        });
        
        setTimeSlots(mappedSlots);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotPress = (slot, appointmentData) => {
    if (appointmentData) {
      // Navigate to appointment details
      navigation.navigate('AppointmentDetails', { 
        appointmentId: appointmentData._id || appointmentData.appointmentId 
      });
    }
  };

  const handleDateChange = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>My Schedule</Text>
      
      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity onPress={() => handleDateChange(-1)}>
          <Text style={styles.dateNavButton}>◀ Prev</Text>
        </TouchableOpacity>
        
        <Text style={styles.dateText}>
          {formatDateDisplay(selectedDate)}
        </Text>
        
        <TouchableOpacity onPress={() => handleDateChange(1)}>
          <Text style={styles.dateNavButton}>Next ▶</Text>
        </TouchableOpacity>
      </View>
      
      {/* Timeline */}
      <View style={styles.timeline}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" />
        ) : (
          <View>
            {timeSlots.map((item) => (
              <TimeSlot
                key={item.time}
                slot={item.time}
                isBooked={item.isBooked}
                appointmentData={item.appointment}
                isPast={item.isPast}
                onPress={handleSlotPress}
              />
            ))}
            {timeSlots.length === 0 && (
              <Text style={styles.emptyText}>No time slots available</Text>
            )}
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('DoctorSchedule')}
      >
        <Text style={styles.viewAllButtonText}>View Full Schedule</Text>
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
    marginBottom: 10,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateNavButton: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeline: {
    marginTop: 5,
    minHeight: 200,
  },
  timeSlot: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookedSlot: {
    backgroundColor: theme.colors.primaryLight,
  },
  availableSlot: {
    backgroundColor: '#f0f0f0',
  },
  pastSlot: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  patientName: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  pastText: {
    color: '#888888',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
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

export default DoctorScheduleCard;
