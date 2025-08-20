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
import PrescriptionCard from '../components/PrescriptionCard';
import authService from '../services/authService';
import api from '../services/api';
import theme from '../config/theme';
import Icon, { HealQIcon } from '../components/IconProvider';

const PatientDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentAppointments: [],
    completedAppointmentsWithPrescriptions: [],
    profileStatus: 'incomplete',
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
      if (appointmentsResponse.success) {
        const appointments = appointmentsResponse.data?.appointments || appointmentsResponse.data || [];
        const now = new Date();
        
        const upcoming = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= now && apt.status !== 'cancelled';
        });
        
        const recent = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate < now || apt.status === 'completed' || apt.status === 'finished';
        }).slice(0, 3);
        
        // Debug prescription data
        appointments.forEach(apt => {
          if (apt.status === 'completed' || apt.status === 'finished') {
            console.log(`Appointment ${apt._id} status: ${apt.status}`);
            console.log(`Has medicalRecord: ${!!apt.medicalRecord}`);
            if (apt.medicalRecord) {
              console.log(`Has prescription: ${!!apt.medicalRecord.prescription}`);
              console.log(`Prescription length: ${apt.medicalRecord.prescription?.length || 0}`);
              console.log('Prescription data:', apt.medicalRecord.prescription);
            }
          }
        });
        
        // Filter completed/finished appointments with medical records
        // We don't need to check prescription array as appointments with diagnosis
        // and other medical information should be shown even if medications list is empty
        const withPrescriptions = appointments.filter(apt => 
          (apt.status === 'completed' || apt.status === 'finished') && 
          apt.medicalRecord && 
          apt.medicalRecord.diagnosis // Just check if there's a diagnosis
        );
        
        console.log(`Found ${withPrescriptions.length} appointments with prescriptions`);

        setDashboardData(prev => ({
          ...prev,
          upcomingAppointments: upcoming.slice(0, 3),
          recentAppointments: recent,
          completedAppointmentsWithPrescriptions: withPrescriptions.slice(0, 5), // Show latest 5 prescriptions
        }));
      }

      // Check profile status
      try {
        const profileResponse = await api.getPatientProfile();
        if (profileResponse.success && profileResponse.data && profileResponse.data.profile) {
          const profile = profileResponse.data.profile;
          const isComplete = profile && profile.phoneNumber && profile.dateOfBirth && profile.gender && profile.bloodGroup;
          setDashboardData(prev => ({
            ...prev,
            profileStatus: isComplete ? 'complete' : 'incomplete',
          }));
        } else {
          // No profile exists
          setDashboardData(prev => ({
            ...prev,
            profileStatus: 'incomplete',
          }));
        }
      } catch (error) {
        console.log('No profile found, marking as incomplete');
        setDashboardData(prev => ({
          ...prev,
          profileStatus: 'incomplete',
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
    navigation.navigate('PatientProfile');
  };

  const handleBookAppointment = () => {
    navigation.navigate('DoctorFinder');
  };

  const handleViewQueue = () => {
    // Navigate to queue screen (to be implemented)
    Alert.alert('Coming Soon', 'Token queue feature will be available soon!');
  };

  const handleMedicalRecords = () => {
    // Navigate to medical records screen (to be implemented)
    Alert.alert('Coming Soon', 'Medical records feature will be available soon!');
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
        <View style={styles.headerTitleContainer}>
          <Icon type="FontAwesome5" name="hospital" size={24} color={theme.colors.primary} />
          <Text style={styles.title}> HealQ Patient</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon type="MaterialIcons" name="logout" size={18} color={theme.colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTitleContainer}>
          <Text style={styles.welcomeTitle}>Welcome back, {user?.name}! </Text>
          <HealQIcon iconName="dashboard" size={22} color={theme.colors.primary} />
        </View>
        <Text style={styles.welcomeSubtitle}>Patient Dashboard</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleBookAppointment}>
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="appointment" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Book Appointment</Text>
            <Text style={styles.actionDescription}>Schedule your next visit</Text>
          </View>
          <Icon type="Feather" name="chevron-right" size={20} color={theme.colors.gray500} style={styles.actionArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleViewQueue}>
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="clock" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Token Queue</Text>
            <Text style={styles.actionDescription}>Check your position in queue</Text>
          </View>
          <Icon type="Feather" name="chevron-right" size={20} color={theme.colors.gray500} style={styles.actionArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleMedicalRecords}>
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="medicalRecords" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Medical Records</Text>
            <Text style={styles.actionDescription}>Access your medical history</Text>
          </View>
          <Icon type="Feather" name="chevron-right" size={20} color={theme.colors.gray500} style={styles.actionArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleProfile}>
          <View style={styles.actionIconContainer}>
            <HealQIcon iconName="profile" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Profile Settings</Text>
            <Text style={styles.actionDescription}>Update your information</Text>
          </View>
          <Icon type="Feather" name="chevron-right" size={20} color={theme.colors.gray500} style={styles.actionArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {dashboardData.recentAppointments.length > 0 ? (
          dashboardData.recentAppointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment._id}
              style={styles.activityCard}
              onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: appointment._id })}
            >
              <Text style={styles.activityDate}>
                {new Date(appointment.appointmentDate).toLocaleDateString()}
              </Text>
              <Text style={styles.activityTitle}>
                Appointment with Dr. {appointment.doctorName}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.activityCard}>
            <Text style={styles.activityDate}>No Recent Activity</Text>
            <Text style={styles.activityTitle}>Your recent appointments will appear here</Text>
          </View>
        )}
      </View>
      
      {/* Prescriptions Section */}
      {dashboardData.completedAppointmentsWithPrescriptions.length > 0 && (
        <View style={styles.prescriptionsSection}>
          <Text style={styles.sectionTitle}>My Prescriptions</Text>
          
          {dashboardData.completedAppointmentsWithPrescriptions.map((appointment) => (
            <PrescriptionCard
              key={appointment._id}
              prescription={appointment.medicalRecord}
              appointment={appointment}
              onPress={() => navigation.navigate('ViewPrescription', { appointmentId: appointment._id })}
            />
          ))}
          
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('AppointmentList', { initialFilter: 'completed' })}
          >
            <Text style={styles.viewAllText}>View All Prescriptions</Text>
          </TouchableOpacity>
        </View>
      )}

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
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
  },
  welcomeSubtitle: {
    ...theme.typography.subtitle,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
  },
  actionDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  actionArrow: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
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
    fontFamily: 'sans-serif',
  },
  activityTitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'sans-serif',
  },
  // Prescription Section Styles
  prescriptionsSection: {
    margin: theme.spacing.xl,
    marginTop: 0,
  },
  viewAllButton: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
  },
});

export default PatientDashboard;

