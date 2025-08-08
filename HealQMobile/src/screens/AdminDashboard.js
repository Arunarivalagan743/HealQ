import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import authService from '../services/authService';
import { adminAPI } from '../services/api';
import theme from '../config/theme';

const AdminDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    name: '',
    role: 'Patient',
    specialization: '',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadStats();
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

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      console.log('📊 Dashboard API Response:', response);
      
      if (response.success && response.data) {
        // Flatten the nested data structure for easier access
        const flattenedStats = {
          // User stats
          totalUsers: response.data.users?.totalUsers || 0,
          totalPatients: response.data.users?.totalPatients || 0,
          totalDoctors: response.data.users?.totalDoctors || 0,
          totalAdmins: response.data.users?.totalAdmins || 0,
          activeUsers: response.data.users?.activeUsers || 0,
          registeredUsers: response.data.users?.registeredUsers || 0,
          pendingUsers: response.data.users?.pendingUsers || 0,
          
          // Request stats
          pendingRequests: response.data.requests?.pendingRequests || 0,
          totalRequests: response.data.requests?.totalRequests || 0,
          doctorRequests: response.data.requests?.doctorRequests || 0,
          patientRequests: response.data.requests?.patientRequests || 0,
        };
        
        console.log('📊 Flattened Stats:', flattenedStats);
        setStats(flattenedStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadStats()]);
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

  const handleAddUser = async () => {
    if (!newUserData.email || !newUserData.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newUserData.role === 'Doctor' && !newUserData.specialization) {
      Alert.alert('Error', 'Specialization is required for doctors');
      return;
    }

    setAddUserLoading(true);
    try {
      const response = await adminAPI.addUser(newUserData);
      Alert.alert('Success', response.message);
      setShowAddUserModal(false);
      setNewUserData({
        email: '',
        name: '',
        role: 'Patient',
        specialization: '',
      });
      loadStats(); // Refresh stats
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleManageUsers = () => {
    navigation.navigate('ManageUsers');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>🏥 HealQ Admin</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome, {user?.name}! 👑</Text>
          <Text style={styles.welcomeSubtitle}>Administrator Dashboard</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalPatients || 0}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalDoctors || 0}</Text>
            <Text style={styles.statLabel}>Doctors</Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.additionalStatCard}>
            <Text style={styles.additionalStatNumber}>{stats.registeredUsers || 0}</Text>
            <Text style={styles.additionalStatLabel}>Registered Users</Text>
          </View>
          <View style={styles.additionalStatCard}>
            <Text style={styles.additionalStatNumber}>{stats.pendingUsers || 0}</Text>
            <Text style={styles.additionalStatLabel}>Pending Registration</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowAddUserModal(true)}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add New User</Text>
              <Text style={styles.actionDescription}>Add patient or doctor email</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleManageUsers}>
            <Text style={styles.actionIcon}>👥</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Users</Text>
              <Text style={styles.actionDescription}>View and edit user accounts</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('UserRequests')}>
            <Text style={styles.actionIcon}>📋</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>User Requests</Text>
              <Text style={styles.actionDescription}>Approve/reject pending requests ({stats.pendingRequests || 0})</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionDescription}>View system analytics</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>System Settings</Text>
              <Text style={styles.actionDescription}>Configure system preferences</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleProfile}>
            <Text style={styles.actionIcon}>👤</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Profile Settings</Text>
              <Text style={styles.actionDescription}>Update your information</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 HealQ - Clinic Token Management</Text>
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={newUserData.email}
                onChangeText={(text) =>
                  setNewUserData(prev => ({ ...prev, email: text }))
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={newUserData.name}
                onChangeText={(text) =>
                  setNewUserData(prev => ({ ...prev, name: text }))
                }
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newUserData.role}
                  onValueChange={(value) =>
                    setNewUserData(prev => ({ ...prev, role: value }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Patient" value="Patient" />
                  <Picker.Item label="Doctor" value="Doctor" />
                </Picker>
              </View>
            </View>

            {newUserData.role === 'Doctor' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specialization</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter specialization"
                  value={newUserData.specialization}
                  onChangeText={(text) =>
                    setNewUserData(prev => ({ ...prev, specialization: text }))
                  }
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddUserModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addButton, addUserLoading && styles.buttonDisabled]}
                onPress={handleAddUser}
                disabled={addUserLoading}
              >
                <Text style={styles.addButtonText}>
                  {addUserLoading ? 'Adding...' : 'Add User'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    marginBottom: theme.spacing.md,
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
  additionalStats: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  additionalStatNumber: {
    ...theme.typography.h4,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  additionalStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    width: '90%',
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    maxHeight: '80%',
    ...theme.shadows.large,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
    ...theme.typography.body1,
    color: theme.colors.text,
  },
  pickerContainer: {
    ...theme.components.input,
    paddingVertical: 0,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.gray400,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  addButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  addButtonText: {
    ...theme.typography.button,
    color: theme.colors.primaryText,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
});

export default AdminDashboard;

