import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import theme from '../config/theme';

const { width } = Dimensions.get('window');

const OnboardingChoiceScreen = () => {
  const navigation = useNavigation();

  const handleNewUser = () => {
    navigation.navigate('NewUserRequest');
  };

  const handleExistingUser = () => {
    navigation.navigate('ExistingUserVerification');
  };

  const handleDirectLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>🩺 HealQ</Text>
          <View style={styles.placeholder} />
        </View>
        
        <Text style={styles.subtitle}>How would you like to get started?</Text>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* New User Option */}
          <TouchableOpacity style={styles.optionCard} onPress={handleNewUser}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.cardIcon}>👋</Text>
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badge}>NEW</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>I'm New to HealQ</Text>
            <Text style={styles.cardDescription}>
              First time here? Submit a request to join our clinic as a patient or doctor. Our admin team will review and approve your application.
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>✓ Submit join request</Text>
              <Text style={styles.featureItem}>✓ Admin review process</Text>
              <Text style={styles.featureItem}>✓ Email notifications</Text>
            </View>
            <View style={styles.cardAction}>
              <Text style={styles.actionText}>Submit Request</Text>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Existing User Option */}
          <TouchableOpacity style={styles.optionCard} onPress={handleExistingUser}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E8' }]}>
                <Text style={styles.cardIcon}>🔍</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>I'm Already Approved</Text>
            <Text style={styles.cardDescription}>
              Already have an approved profile with us? Verify your email address to complete registration and start using the app.
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>✓ Email verification</Text>
              <Text style={styles.featureItem}>✓ OTP confirmation</Text>
              <Text style={styles.featureItem}>✓ Quick registration</Text>
            </View>
            <View style={styles.cardAction}>
              <Text style={styles.actionText}>Verify Email</Text>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Direct Login Option */}
          <TouchableOpacity style={styles.loginCard} onPress={handleDirectLogin}>
            <View style={styles.loginContent}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.cardIcon}>🔐</Text>
              </View>
              <View style={styles.loginText}>
                <Text style={styles.loginTitle}>Already Have an Account?</Text>
                <Text style={styles.loginDescription}>
                  Sign in with your existing credentials
                </Text>
              </View>
              <Text style={styles.loginArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>Need Help?</Text>
              {'\n'}Contact our clinic directly if you have questions about the registration process.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    minWidth: 60,
  },
  backButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 60,
  },
  subtitle: {
    fontSize: 20,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    letterSpacing: 0.3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F3F4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardIcon: {
    fontSize: 26,
  },
  badgeContainer: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    elevation: 1,
  },
  badge: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 15,
    color: '#6C757D',
    lineHeight: 22,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    fontWeight: '400',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    fontSize: 13,
    color: '#28A745',
    marginBottom: 5,
    fontWeight: '500',
  },
  cardAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  actionArrow: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DEE2E6',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: '#ADB5BD',
    fontWeight: '500',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  loginContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    flex: 1,
    marginLeft: 15,
  },
  loginTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  loginDescription: {
    fontSize: 12,
    color: '#6C757D',
  },
  loginArrow: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bottomInfo: {
    paddingBottom: 30,
  },
  infoCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: 'bold',
  },
});

export default OnboardingChoiceScreen;
