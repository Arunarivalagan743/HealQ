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
  FlatList,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import authService from '../services/authService';
import { adminAPI } from '../services/api';
import theme from '../config/theme';

const EnhancedAdminDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    doctors: [],
    patients: [],
    userRequests: [],
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
      // Load comprehensive dashboard stats
      const statsResponse = await adminAPI.getComprehensiveDashboardStats();
      if (statsResponse.success) {
        setDashboardData(prev => ({
          ...prev,
          stats: {
            totalUsers: statsResponse.data.overview.totalUsers || 0,
            totalDoctors: statsResponse.data.overview.totalDoctors || 0,
            totalPatients: statsResponse.data.overview.totalPatients || 0,
            totalAppointments: statsResponse.data.overview.totalAppointments || 0,
            todaysAppointments: statsResponse.data.overview.todaysAppointments || 0,
            upcomingAppointments: statsResponse.data.overview.upcomingAppointments || 0,
          },
          profiles: statsResponse.data.profiles || {},
          appointments: statsResponse.data.appointments || {},
          specializations: statsResponse.data.specializations || [],
          recentActivity: statsResponse.data.recentActivity || {},
        }));
      }

      // Load doctor profiles
      const doctorsResponse = await adminAPI.getAllDoctorProfiles();
      if (doctorsResponse.success) {
        setDashboardData(prev => ({
          ...prev,
          doctors: doctorsResponse.data?.doctors || doctorsResponse.data || [],
        }));
      }

      // Load patient profiles
      const patientsResponse = await adminAPI.getAllPatientProfiles();
      if (patientsResponse.success) {
        setDashboardData(prev => ({
          ...prev,
          patients: patientsResponse.data?.patients || patientsResponse.data || [],
        }));
      }

      // Load user requests
      const requestsResponse = await adminAPI.getAllUserRequests();
      if (requestsResponse.success) {
        setDashboardData(prev => ({
          ...prev,
          userRequests: requestsResponse.data?.requests || requestsResponse.data || [],
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

  const handleDoctorVerification = async (doctorId, verified, isActive = null) => {
    try {
      const updateData = {};
      if (verified !== null) updateData.isVerified = verified;
      if (isActive !== null) updateData.isActive = isActive;
      
      const response = await adminAPI.updateDoctorVerification(doctorId, updateData);
      if (response.success) {
        let message = '';
        if (verified !== null && isActive !== null) {
          message = `Doctor ${verified ? 'verified' : 'unverified'} and ${isActive ? 'activated' : 'deactivated'} successfully`;
        } else if (verified !== null) {
          message = `Doctor ${verified ? 'verified' : 'unverified'} successfully`;
        } else if (isActive !== null) {
          message = `Doctor ${isActive ? 'activated' : 'deactivated'} successfully`;
        }
        Alert.alert('Success', message);
        await loadDashboardData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update doctor status');
      }
    } catch (error) {
      console.error('Error updating doctor status:', error);
      Alert.alert('Error', 'Failed to update doctor status');
    }
  };

  const handlePatientStatus = async (patientId, status) => {
    try {
      const response = await adminAPI.updatePatientStatus(patientId, { status });
      if (response.success) {
        Alert.alert('Success', `Patient status updated to ${status}`);
        await loadDashboardData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update patient status');
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
      Alert.alert('Error', 'Failed to update patient status');
    }
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      {['overview', 'doctors', 'patients', 'requests'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabButton, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Platform Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboardData.stats.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboardData.stats.totalDoctors || 0}</Text>
            <Text style={styles.statLabel}>Doctors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboardData.stats.totalPatients || 0}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboardData.stats.totalAppointments || 0}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UserRequests')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>User Requests</Text>
            {getPendingRequestsCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getPendingRequestsCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab('doctors')}
          >
            <Text style={styles.actionIcon}>👨‍⚕️</Text>
            <Text style={styles.actionText}>Manage Doctors</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('DoctorQueue')}
          >
            <Text style={styles.actionIcon}>🏥</Text>
            <Text style={styles.actionText}>Doctor Queue</Text>
            <Text style={styles.actionSubtext}>Sequential ID Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab('patients')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Manage Patients</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AppointmentList')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>All Appointments</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  const renderDoctorItem = ({ item }) => (
    <Card style={styles.listItem}>
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemName}>Dr. {item.name}</Text>
          <Text style={styles.listItemDetail}>{item.specialization || item.specialty}</Text>
          <Text style={styles.listItemDetail}>
            Doctor ID: {item.doctorId || 'Not assigned'}
          </Text>
          <Text style={styles.listItemDetail}>
            Experience: {item.experience || 0} years
          </Text>
          <Text style={styles.listItemDetail}>
            Fee: ₹{item.consultationFee || 'Not set'}
          </Text>
        </View>
        <View style={styles.listItemActions}>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.isVerified ? theme.colors.success : theme.colors.warning 
          }]}>
            <Text style={styles.statusText}>
              {item.isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.isActive ? theme.colors.success : theme.colors.error,
            marginTop: 5
          }]}>
            <Text style={styles.statusText}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.listItemFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            console.log('Doctor item:', item);
            console.log('Doctor ID:', item._id || item.id);
            navigation.navigate('AdminDoctorProfileView', { 
              doctorId: item._id || item.id
            });
          }}
        >
          <Text style={styles.viewButtonText}>View Full Profile</Text>
        </TouchableOpacity>
        
        {!item.isVerified && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleDoctorVerification(item._id || item.id, true)}
          >
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        )}
        
        {item.isVerified && (
          <TouchableOpacity
            style={styles.unverifyButton}
            onPress={() => handleDoctorVerification(item._id, false)}
          >
            <Text style={styles.unverifyButtonText}>Unverify</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.statusButton, { 
            backgroundColor: item.isActive ? theme.colors.error : theme.colors.success 
          }]}
          onPress={() => handleDoctorVerification(item._id, null, !item.isActive)}
        >
          <Text style={styles.statusButtonText}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderPatientItem = ({ item }) => (
    <Card style={styles.listItem}>
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemName}>{item.name}</Text>
          <Text style={styles.listItemDetail}>{item.email}</Text>
          <Text style={styles.listItemDetail}>
            {item.dateOfBirth ? `Age: ${new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear()}` : 'Age not specified'}
          </Text>
        </View>
        <View style={styles.listItemActions}>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.status === 'active' ? theme.colors.success : theme.colors.warning 
          }]}>
            <Text style={styles.statusText}>
              {item.status || 'Active'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.listItemFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('PatientProfile', { 
            patientId: item._id, 
            viewMode: true,
            isAdmin: true 
          })}
        >
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusButton, {
            backgroundColor: item.status === 'active' ? theme.colors.warning : theme.colors.success
          }]}
          onPress={() => handlePatientStatus(item._id, item.status === 'active' ? 'inactive' : 'active')}
        >
          <Text style={styles.statusButtonText}>
            {item.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'doctors':
        return (
          <View>
            {dashboardData.doctors && dashboardData.doctors.length > 0 ? (
              dashboardData.doctors.map((item) => (
                <View key={item._id}>
                  {renderDoctorItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No doctors found</Text>
              </View>
            )}
          </View>
        );
      case 'patients':
        return (
          <View>
            {dashboardData.patients && dashboardData.patients.length > 0 ? (
              dashboardData.patients.map((item) => (
                <View key={item._id}>
                  {renderPatientItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No patients found</Text>
              </View>
            )}
          </View>
        );
      case 'requests':
        return (
          <View style={styles.requestsContainer}>
            <Button
              title="Manage User Requests"
              onPress={() => navigation.navigate('UserRequests')}
              style={styles.requestsButton}
            />
          </View>
        );
      default:
        return renderOverview();
    }
  };

  // Safe helper function to get pending requests count
  const getPendingRequestsCount = () => {
    if (!dashboardData || !dashboardData.userRequests || !Array.isArray(dashboardData.userRequests)) {
      return 0;
    }
    return dashboardData.userRequests.filter(req => req.status === 'pending').length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Admin Dashboard</Text>
          <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      {renderTabButtons()}

      {/* Content */}
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => renderContent()}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
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
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: theme.spacing.md,
  },
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontFamily: 'sans-serif',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  quickActionsCard: {
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
    position: 'relative',
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
    fontFamily: 'sans-serif',
  },
  actionSubtext: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  listItem: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  listItemDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  listItemActions: {
    marginLeft: theme.spacing.md,
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
    fontFamily: 'sans-serif',
  },
  listItemFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  viewButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  viewButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  verifyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.sm,
  },
  verifyButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  unverifyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.sm,
  },
  unverifyButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  statusButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  statusButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    margin: theme.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  requestsContainer: {
    padding: theme.spacing.md,
  },
  requestsButton: {
    marginBottom: theme.spacing.md,
  },
});

export default EnhancedAdminDashboard;

