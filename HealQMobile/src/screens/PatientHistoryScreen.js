import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import theme from '../config/theme';
import api from '../services/api';

const PatientHistoryScreen = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPatientHistory();
  }, []);

  const fetchPatientHistory = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      
      const response = await api.getPatientHistory(patientId, {
        page: pageNum,
        limit: 10
      });

      if (response.success) {
        const newAppointments = response.data.appointments;
        
        if (pageNum === 1) {
          setHistory(newAppointments);
          setPatientInfo(response.data.patient);
          setSummary(response.data.summary);
        } else {
          setHistory(prev => [...prev, ...newAppointments]);
        }
        
        setHasMore(response.data.pagination.hasNext);
        setPage(pageNum);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch patient history');
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
      Alert.alert('Error', 'Failed to fetch patient history');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPatientHistory(page + 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finished':
        return theme.colors.success;
      case 'cancelled':
      case 'rejected':
        return theme.colors.error;
      case 'requested':
        return theme.colors.warning;
      case 'approved':
      case 'in_queue':
      case 'processing':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusDisplayText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderAppointmentItem = ({ item }) => (
    <Card style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentDate}>
            {formatDate(item.appointmentDate)}
          </Text>
          <Text style={styles.appointmentTime}>
            {item.appointmentTime || 'Time not set'}
          </Text>
          <Text style={styles.appointmentType}>
            {item.appointmentType || 'Type not specified'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {getStatusDisplayText(item.status)}
          </Text>
        </View>
      </View>

      {item.symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText}>{item.symptoms}</Text>
        </View>
      )}

      {item.prescription && (
        <View style={styles.prescriptionContainer}>
          <Text style={styles.prescriptionLabel}>Prescription:</Text>
          <Text style={styles.prescriptionText}>{item.prescription}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item._id })}
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading patient history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Patient Information Header */}
      {patientInfo && (
        <Card style={styles.patientInfoCard}>
          <Text style={styles.patientName}>{patientInfo.name}</Text>
          <View style={styles.patientDetails}>
            <Text style={styles.patientDetail}>
              Age: {patientInfo.age || 'N/A'} • Gender: {patientInfo.gender || 'N/A'}
            </Text>
            <Text style={styles.patientDetail}>
              Blood Group: {patientInfo.bloodGroup || 'N/A'}
            </Text>
            <Text style={styles.patientDetail}>
              Phone: {patientInfo.phoneNumber || 'N/A'}
            </Text>
          </View>
        </Card>
      )}

      {/* Summary Statistics */}
      {summary && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Visit Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.totalVisits}</Text>
              <Text style={styles.summaryLabel}>Total Visits</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.completedVisits}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.cancelledVisits}</Text>
              <Text style={styles.summaryLabel}>Cancelled</Text>
            </View>
          </View>
          {summary.lastVisit && (
            <Text style={styles.lastVisit}>
              Last Visit: {formatDate(summary.lastVisit)}
            </Text>
          )}
        </Card>
      )}

      {/* Appointment History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Appointment History</Text>
        
        {history.length > 0 ? (
          <FlatList
            data={history}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item._id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loading && page > 1 ? (
                <ActivityIndicator 
                  size="small" 
                  color={theme.colors.primary} 
                  style={styles.footerLoader}
                />
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No appointment history found</Text>
            <Text style={styles.emptySubtext}>
              This patient has no previous appointments with you
            </Text>
          </Card>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
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
  patientInfoCard: {
    marginBottom: theme.spacing.md,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontFamily: 'sans-serif',
  },
  patientDetails: {
    gap: theme.spacing.xs,
  },
  patientDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  summaryCard: {
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontFamily: 'sans-serif',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: 'sans-serif',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  lastVisit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  historySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontFamily: 'sans-serif',
  },
  appointmentCard: {
    marginBottom: theme.spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'sans-serif',
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  appointmentType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  symptomsContainer: {
    marginBottom: theme.spacing.sm,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  symptomsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  prescriptionContainer: {
    marginBottom: theme.spacing.sm,
  },
  prescriptionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  prescriptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  detailsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontFamily: 'sans-serif',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
});

export default PatientHistoryScreen;
