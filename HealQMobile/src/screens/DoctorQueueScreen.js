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
import { authAPI } from '../services/api';
import theme from '../config/theme';

const DoctorQueueScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDoctors: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    loadDoctorsQueue();
  }, []);

  const loadDoctorsQueue = async (page = 1) => {
    try {
      setLoading(page === 1);
      const response = await authAPI.getDoctorsInQueue(page, 20);
      
      if (response.success) {
        setDoctors(response.data.doctors);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading doctors queue:', error);
      Alert.alert('Error', 'Failed to load doctors queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDoctorsQueue(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadDoctorsQueue(newPage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (isVerified, isActive) => {
    if (isVerified && isActive) return theme.colors.success;
    if (isVerified && !isActive) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusText = (isVerified, isActive) => {
    if (isVerified && isActive) return 'Active';
    if (isVerified && !isActive) return 'Verified (Inactive)';
    return 'Pending Verification';
  };

  const renderDoctorCard = ({ item }) => (
    <Card style={styles.doctorCard}>
      <View style={styles.queueHeader}>
        <View style={styles.queuePosition}>
          <Text style={styles.queueNumber}>#{item.queuePosition}</Text>
          <Text style={styles.queueLabel}>Queue Position</Text>
        </View>
        <View style={styles.doctorId}>
          <Text style={styles.doctorIdText}>{item.doctorId}</Text>
          <Text style={styles.doctorIdLabel}>Doctor ID</Text>
        </View>
      </View>

      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpecialization}>{item.specialization}</Text>
        <Text style={styles.doctorEmail}>{item.email}</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isVerified, item.isActive) }]}>
          <Text style={styles.statusText}>{getStatusText(item.isVerified, item.isActive)}</Text>
        </View>
        <Text style={styles.approvalDate}>
          Approved: {formatDate(item.approvalDate)}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.verifyButton]}
          onPress={() => toggleVerification(item)}
        >
          <Text style={styles.actionButtonText}>
            {item.isVerified ? 'Unverify' : 'Verify'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.activeButton]}
          onPress={() => toggleActive(item)}
        >
          <Text style={styles.actionButtonText}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const toggleVerification = async (doctor) => {
    try {
      const newStatus = !doctor.isVerified;
      await authAPI.updateDoctorVerification(doctor._id, { 
        isVerified: newStatus 
      });
      
      Alert.alert(
        'Success',
        `Doctor ${newStatus ? 'verified' : 'unverified'} successfully`,
        [{ text: 'OK', onPress: () => loadDoctorsQueue(pagination.currentPage) }]
      );
    } catch (error) {
      console.error('Error updating verification:', error);
      Alert.alert('Error', 'Failed to update verification status');
    }
  };

  const toggleActive = async (doctor) => {
    try {
      const newStatus = !doctor.isActive;
      await authAPI.updateDoctorVerification(doctor._id, { 
        isActive: newStatus 
      });
      
      Alert.alert(
        'Success',
        `Doctor ${newStatus ? 'activated' : 'deactivated'} successfully`,
        [{ text: 'OK', onPress: () => loadDoctorsQueue(pagination.currentPage) }]
      );
    } catch (error) {
      console.error('Error updating active status:', error);
      Alert.alert('Error', 'Failed to update active status');
    }
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.pageButton, !pagination.hasPrev && styles.pageButtonDisabled]}
        onPress={() => handlePageChange(pagination.currentPage - 1)}
        disabled={!pagination.hasPrev}
      >
        <Text style={[styles.pageButtonText, !pagination.hasPrev && styles.pageButtonTextDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Page {pagination.currentPage} of {pagination.totalPages}
        </Text>
        <Text style={styles.totalText}>
          Total: {pagination.totalDoctors} doctors
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.pageButton, !pagination.hasNext && styles.pageButtonDisabled]}
        onPress={() => handlePageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasNext}
      >
        <Text style={[styles.pageButtonText, !pagination.hasNext && styles.pageButtonTextDisabled]}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Doctor Queue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoText}>Sequential ID Assignment (First Come, First Served)</Text>
        </View>
        
        <FlatList
          data={doctors}
          renderItem={renderDoctorCard}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No doctors in queue</Text>
            </View>
          }
          showsVerticalScrollIndicator={true}
        />
        
        {doctors.length > 0 && (
          <View style={styles.paginationWrapper}>
            {renderPagination()}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  infoHeader: {
    backgroundColor: theme.colors.white,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  paginationWrapper: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  doctorCard: {
    marginBottom: 15,
    padding: 15,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  queuePosition: {
    alignItems: 'center',
  },
  queueNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  queueLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  doctorId: {
    alignItems: 'center',
  },
  doctorIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  doctorIdLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  doctorInfo: {
    marginBottom: 15,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 3,
  },
  doctorEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  approvalDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
  },
  activeButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pageButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  pageButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});

export default DoctorQueueScreen;
