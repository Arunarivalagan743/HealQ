import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import authService from '../services/authService';
import api from '../services/api';
import theme from '../config/theme';
import Icon, { HealQIcon } from '../components/IconProvider';
import DoctorPrescriptionCard from '../components/DoctorPrescriptionCard';
import DoctorScheduleCard from '../components/DoctorScheduleCard';
import PatientRecordsCard from '../components/PatientRecordsCard';

const DoctorDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    todaysPatients: 0,
    pendingApprovals: 0,
    completedToday: 0
  });

  useEffect(() => {
    loadUserData();
    loadAppointments();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      // Get today's date
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      console.log('Loading appointments for today:', today);
      console.log('Current date object:', now);
      
      // Get all appointments for today
      const response = await api.getDoctorAppointments({ date: today });
      console.log('Dashboard appointments response:', response);
      
      if (response.success) {
        const todayAppointments = response.data.appointments;
        console.log(`Today's appointments found: ${todayAppointments.length}`);
        
        if (todayAppointments.length > 0) {
          console.log('First appointment:', {
            id: todayAppointments[0]._id,
            patient: todayAppointments[0].patientName,
            status: todayAppointments[0].status,
            time: todayAppointments[0].timeSlot
          });
        }
        
        setAppointments(todayAppointments);
        
        // Calculate stats
        const stats = {
          todaysPatients: todayAppointments.length,
          pendingApprovals: todayAppointments.filter(apt => apt.status === 'requested').length,
          completedToday: todayAppointments.filter(apt => apt.status === 'finished').length
        };
        console.log('Dashboard stats:', stats);
        setStats(stats);
      } else {
        console.error('Failed to load appointments:', response.message);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('Refreshing dashboard data...');
    
    try {
      // Reload all data
      await Promise.all([
        loadUserData(),
        loadAppointments(),
      ]);
      
      // Force reload of child components by triggering state change
      setRefreshing(false);
      
      // Show feedback to the user
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      Alert.alert('Refresh Error', 'Failed to refresh dashboard data.');
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleProfile = () => {
    navigation.navigate('DoctorProfile');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return '#ff9800';
      case 'approved': return '#2196f3';
      case 'in_queue': return '#9c27b0';
      case 'processing': return '#4caf50';
      case 'finished': return '#008000';
      case 'rejected': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🏥 HealQ Doctor</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTitleContainer}>
          <Text style={styles.welcomeTitle}>Welcome, Dr. {user?.name}! </Text>
          <HealQIcon iconName="doctor" size={24} color={theme.colors.primary} />
        </View>
        <Text style={styles.welcomeSubtitle}>
          {user?.specialization} • Doctor Dashboard
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.todaysPatients}</Text>
          <Text style={styles.statLabel}>TODAY'S PATIENTS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingApprovals}</Text>
          <Text style={styles.statLabel}>PENDING APPROVALS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedToday}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
      </View>

      {/* Dashboard Cards */}
      <View style={styles.dashboardCards}>
        <DoctorPrescriptionCard navigation={navigation} />
        <DoctorScheduleCard navigation={navigation} />
        <PatientRecordsCard navigation={navigation} />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('DoctorQueueManagement')}
        >
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="users" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Patient Queue</Text>
            <Text style={styles.actionDescription}>View and manage patient queue</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('PatientRecords')}
        >
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="medicalRecords" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Patient Records</Text>
            <Text style={styles.actionDescription}>Access patient medical records</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('DoctorSchedule')}
        >
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="appointment" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Schedule</Text>
            <Text style={styles.actionDescription}>View appointments and availability</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('DoctorPrescriptions')}
        >
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="prescription" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Prescriptions</Text>
            <Text style={styles.actionDescription}>Create and manage prescriptions</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleProfile}>
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="profile" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Profile Settings</Text>
            <Text style={styles.actionDescription}>Update your information</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        
        {appointments.length > 0 ? (
          <View>
            {appointments.slice(0, 5).map((item) => (
              <View key={item._id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.appointmentTime}>
                  {item.timeSlot?.start} - Token #{item.queueToken}
                </Text>
                <Text style={styles.reasonText}>{item.reasonForVisit}</Text>
                
                {item.status === 'requested' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => navigation.navigate('AppointmentList')}
                    >
                      <Text style={styles.actionBtnText}>Review</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.activityCard}>
            <Text style={styles.activityDate}>No appointments for today</Text>
            <Text style={styles.activityTitle}>You're all caught up! Enjoy your day.</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AppointmentList')}
        >
          <Text style={styles.viewAllText}>View All Appointments →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 HealQ - Clinic Token Management</Text>
      </View>
    </ScrollView>
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
    ...theme.typography.h4,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.massive,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.white,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  welcomeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 100, 170, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.xl,
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.large,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  welcomeTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    ...theme.typography.subtitle,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
    borderTopWidth: 3,
    borderTopColor: theme.colors.secondary,
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActions: {
    margin: theme.spacing.xl,
    marginTop: 0,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    paddingLeft: theme.spacing.xs,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: theme.spacing.lg,
    width: 40,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  actionArrow: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  dashboardCards: {
    margin: theme.spacing.xl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  recentActivity: {
    margin: theme.spacing.xl,
    marginTop: 0,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  activityDate: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityTitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  // New appointment styles
  appointmentCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  patientName: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  appointmentTime: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  reasonText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  approveBtn: {
    backgroundColor: theme.colors.primary,
  },
  actionBtnText: {
    ...theme.typography.body2,
    color: 'white',
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default DoctorDashboard;

