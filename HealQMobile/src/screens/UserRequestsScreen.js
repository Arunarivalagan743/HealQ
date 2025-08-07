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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminAPI } from '../services/api';
import theme from '../config/theme';

// Use the same base URL configuration as the main API
const BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:5000/api' 
    : 'http://localhost:5000/api'
  : 'https://your-production-api-url.com/api';

const UserRequestsScreen = () => {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      // Use development endpoint for now (bypasses auth)
      const response = await fetch(`${BASE_URL}/admin/requests-dev`);
      const data = await response.json();
      
      console.log('📋 User Requests Response:', data);
      
      if (data.success) {
        setRequests(data.data.requests || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load user requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleApprove = async (requestId) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this user request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => processRequest(requestId, 'approve'),
        },
      ]
    );
  };

  const handleReject = async (requestId) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this user request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => processRequest(requestId, 'reject'),
        },
      ]
    );
  };

  const processRequest = async (requestId, action) => {
    setProcessingId(requestId);
    try {
      const endpoint = action === 'approve' 
        ? `${BASE_URL}/admin/requests-dev/${requestId}/approve`
        : `${BASE_URL}/admin/requests-dev/${requestId}/reject`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminResponse: action === 'approve' ? 'Approved by admin' : 'Request rejected by admin'
        }),
      });
      
      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          `Request ${action}d successfully`,
          [{ text: 'OK', onPress: () => loadRequests() }]
        );
      } else {
        Alert.alert('Error', data.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      Alert.alert('Error', error.message || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const renderRequest = (request) => (
    <View key={request._id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{request.fullName}</Text>
          <Text style={styles.userRole}>{request.role}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Email:</Text>
        <Text style={styles.detailValue}>{request.email}</Text>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Phone:</Text>
        <Text style={styles.detailValue}>{request.phone}</Text>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Age:</Text>
        <Text style={styles.detailValue}>{request.age}</Text>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Address:</Text>
        <Text style={styles.detailValue}>{request.address}</Text>
      </View>

      {request.role === 'Doctor' && request.specialization && (
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Specialization:</Text>
          <Text style={styles.detailValue}>{request.specialization}</Text>
        </View>
      )}

      {request.role === 'Patient' && request.problem && (
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Medical Concern:</Text>
          <Text style={styles.detailValue}>{request.problem}</Text>
        </View>
      )}

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Submitted:</Text>
        <Text style={styles.detailValue}>{new Date(request.createdAt).toLocaleDateString()}</Text>
      </View>

      {request.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(request._id)}
            disabled={processingId === request._id}
          >
            {processingId === request._id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>✅ Approve</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(request._id)}
            disabled={processingId === request._id}
          >
            <Text style={styles.actionButtonText}>❌ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📭 No pending requests</Text>
            <Text style={styles.emptyStateSubtext}>All requests have been processed</Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            <Text style={styles.sectionTitle}>
              Pending Requests ({requests.filter(r => r.status === 'pending').length})
            </Text>
            {requests
              .filter(request => request.status === 'pending')
              .map(renderRequest)}

            {requests.filter(r => r.status !== 'pending').length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Processed Requests ({requests.filter(r => r.status !== 'pending').length})
                </Text>
                {requests
                  .filter(request => request.status !== 'pending')
                  .map(renderRequest)}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
  },
  requestsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  requestDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default UserRequestsScreen;
