import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import authService from '../services/authService';
import api from '../services/api';
import theme from '../config/theme';

const PatientDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentAppointments: [],
    profileComplete: false,
  });

  useEffect(() => {
    loadUserData();
    loadDashboardData();
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

  const loadDashboardData = async () => {
    try {
      // Load patient appointments
      const appointmentsResponse = await api.getPatientAppointments();
      if (appointmentsResponse.success && appointmentsResponse.data) {
        // Ensure we have an array of appointments
        const appointments = Array.isArray(appointmentsResponse.data) 
          ? appointmentsResponse.data 
          : appointmentsResponse.data.appointments || [];
        
        const now = new Date();
        
        const upcoming = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= now && apt.status !== 'cancelled';
        });
        
        const recent = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate < now || apt.status === 'completed';
        }).slice(0, 3);

        setDashboardData(prev => ({
          ...prev,
          upcomingAppointments: upcoming.slice(0, 3),
          recentAppointments: recent,
        }));
      } else {
        // Set empty arrays if no appointments
        setDashboardData(prev => ({
          ...prev,
          upcomingAppointments: [],
          recentAppointments: [],
        }));
      }

      // Check if profile is complete
      try {
        const profileResponse = await api.getPatientProfile();
        if (profileResponse.success && profileResponse.data && profileResponse.data.profile) {
          const profile = profileResponse.data.profile;
          // Check for essential profile fields
          const isComplete = profile && 
            profile.phoneNumber && 
            profile.dateOfBirth && 
            profile.gender && 
            profile.bloodGroup;
          setDashboardData(prev => ({
            ...prev,
            profileComplete: isComplete,
          }));
        } else {
          // Profile doesn't exist yet
          setDashboardData(prev => ({
            ...prev,
            profileComplete: false,
          }));
        }
      } catch (profileError) {
        console.log('No profile found, marking as incomplete:', profileError.message);
        // Profile doesn't exist, set as incomplete
        setDashboardData(prev => ({
          ...prev,
          profileComplete: false,
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadDashboardData()]);
    setRefreshing(false);
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
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderQuickActions = () => (
    <Card style={styles.quickActionsCard}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DoctorFinder')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Find Doctors</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AppointmentList')}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>My Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PatientProfile')}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionText}>My Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DoctorList')}
        >
          <Text style={styles.actionIcon}>👨‍⚕️</Text>
          <Text style={styles.actionText}>Browse Doctors</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderProfileStatus = () => {
    if (dashboardData.profileComplete) return null;
    
    return (
      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertTitle}>Complete Your Profile</Text>
        </View>
        <Text style={styles.alertText}>
          Complete your profile to book appointments and get personalized recommendations.
        </Text>
        <Button
          title="Complete Profile"
          onPress={() => navigation.navigate('PatientProfile')}
          style={styles.alertButton}
        />
      </Card>
    );
  };

  const renderUpcomingAppointments = () => (
    <Card style={styles.appointmentsCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AppointmentList')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {dashboardData.upcomingAppointments.length > 0 ? (
        dashboardData.upcomingAppointments.map((appointment, index) => (
          <TouchableOpacity
            key={appointment._id || index}
            style={styles.appointmentItem}
            onPress={() => {
              if (appointment.queueToken) {
                navigation.navigate('PatientQueuePosition', { appointmentId: appointment._id });
              } else {
                navigation.navigate('AppointmentDetails', { appointmentId: appointment._id });
              }
            }}
          >
            <View style={styles.appointmentInfo}>
              <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
              <Text style={styles.appointmentDate}>
                {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}
              </Text>
              <Text style={styles.appointmentType}>{appointment.appointmentType}</Text>
              {appointment.queueToken && (
                <Text style={styles.queueTokenText}>
                  🎫 Token: #{appointment.queueToken}
                </Text>
              )}
            </View>
            <View style={styles.appointmentActions}>
              <View style={[styles.statusBadge, { 
                backgroundColor: appointment.status === 'confirmed' ? theme.colors.success : theme.colors.warning 
              }]}>
                <Text style={styles.statusText}>{appointment.status}</Text>
              </View>
              {appointment.queueToken && (
                <TouchableOpacity 
                  style={styles.queueButton}
                  onPress={() => navigation.navigate('PatientQueuePosition', { appointmentId: appointment._id })}
                >
                  <Text style={styles.queueButtonText}>Queue</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming appointments</Text>
          <Button
            title="Book an Appointment"
            onPress={() => navigation.navigate('DoctorFinder')}
            style={styles.emptyButton}
          />
        </View>
      )}
    </Card>
  );

  const renderRecentActivity = () => (
    <Card style={styles.recentCard}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      {dashboardData.recentAppointments.length > 0 ? (
        dashboardData.recentAppointments.map((appointment, index) => (
          <View key={appointment._id || index} style={styles.recentItem}>
            <Text style={styles.recentText}>
              Appointment with Dr. {appointment.doctorName}
            </Text>
            <Text style={styles.recentDate}>
              {formatDate(appointment.appointmentDate)}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No recent activity</Text>
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Status Alert */}
        {renderProfileStatus()}

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Upcoming Appointments */}
        {renderUpcomingAppointments()}

        {/* Recent Activity */}
        {renderRecentActivity()}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.massive + theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  logoutText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  quickActionsCard: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  alertCard: {
    margin: theme.spacing.md,
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  alertText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: theme.colors.warning,
  },
  appointmentsCard: {
    margin: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  appointmentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  appointmentType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  queueTokenText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  appointmentActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  queueButton: {
    backgroundColor: theme.colors.info,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  queueButtonText: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 150,
  },
  recentCard: {
    margin: theme.spacing.md,
  },
  recentItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recentText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  recentDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default PatientDashboard;

