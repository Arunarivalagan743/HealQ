import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import FixedBottomBackButton from '../components/FixedBottomBackButton';
import theme from '../config/theme';
import api from '../services/api';

const DoctorScheduleScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekDates, setWeekDates] = useState([]);
  
  // Helper functions for date formatting
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    console.log(`Formatting date: ${date} to ${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date, format) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    if (format === 'full') {
      options.year = 'numeric';
    } else if (format === 'day') {
      options.weekday = undefined;
      options.month = undefined;
    }
    return date.toLocaleDateString('en-US', options);
  };

  // Generate week dates
  useEffect(() => {
    const dates = [];
    const today = new Date();
    
    // Start from 3 days ago
    for (let i = -3; i < 11; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    setWeekDates(dates);
  }, []);

  // Load appointments for selected date
  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);
  
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const dateStr = formatDateToString(selectedDate);
      
      console.log('Loading appointments for date:', dateStr);
      
      const response = await api.getDoctorAppointments({
        date: dateStr
      });
      
      if (response.success) {
        console.log(`Found ${response.data.appointments.length} appointments for ${dateStr}`);
        setAppointments(response.data.appointments);
      } else {
        console.error('Failed to load appointments:', response.message);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const selectDate = (date) => {
    setSelectedDate(date);
  };
  
  const getAppointmentStatusColor = (status) => {
    switch (status) {
      case 'queued': return theme.colors.warning;
      case 'approved': return theme.colors.info;
      case 'completed': return theme.colors.success;
      case 'cancelled': return theme.colors.danger;
      case 'rejected': return theme.colors.danger;
      case 'finished': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const handleAppointmentPress = (appointment) => {
    navigation.navigate('AppointmentDetails', {
      appointmentId: appointment._id
    });
  };

  const renderAppointment = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(item)}
      >
        <View style={styles.appointmentHeader}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getAppointmentStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.appointmentTime}>
          {item.timeSlot?.start} - {item.timeSlot?.end}
          {item.queueToken ? ` • Token #${item.queueToken}` : ''}
        </Text>
        
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reasonForVisit || 'No reason specified'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyDay = () => {
    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyText}>No appointments for this day</Text>
        <TouchableOpacity 
          style={styles.addAppointmentButton}
        >
          <Text style={styles.addButtonText}>+ Add Appointment</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Schedule" />
      
      <View style={styles.dateSelector}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={weekDates}
          keyExtractor={(item) => item.toISOString()}
          contentContainerStyle={styles.dateList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.dateItem,
                isToday(item) && styles.todayItem,
                selectedDate.toDateString() === item.toDateString() && styles.selectedItem
              ]}
              onPress={() => selectDate(item)}
            >
              <Text style={[
                styles.dateDay,
                selectedDate.toDateString() === item.toDateString() && styles.selectedDateText
              ]}>
                {item.getDate()}
              </Text>
              <Text style={[
                styles.dateMonth,
                selectedDate.toDateString() === item.toDateString() && styles.selectedDateText
              ]}>
                {item.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <Text style={styles.selectedDateTitle}>
        {formatDateDisplay(selectedDate, 'full')}
      </Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.appointmentList}
          renderItem={renderAppointment}
          ListEmptyComponent={renderEmptyDay}
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
  placeholder: {
    width: 50,
  },
  dateSelector: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateList: {
    paddingHorizontal: 16,
  },
  dateItem: {
    width: 60,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: theme.colors.primary,
  },
  todayItem: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  dateMonth: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  selectedDateText: {
    color: 'white',
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  appointmentList: {
    padding: 16,
    paddingBottom: 100,
  },
  appointmentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  addAppointmentButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  }
});

export default DoctorScheduleScreen;
