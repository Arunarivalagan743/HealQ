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
      setStats(response.data);
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#dc3545',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  additionalStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 2,
  },
  additionalStatLabel: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
  },
  quickActions: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  actionArrow: {
    fontSize: 18,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    padding: 24,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e6ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e6ed',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
  },
});

export default AdminDashboard;
