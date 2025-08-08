import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  Alert,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import theme
import theme from './src/config/theme';

// Import screens
import LandingScreen from './src/screens/LandingScreen';
import OnboardingChoiceScreen from './src/screens/OnboardingChoiceScreen';
import NewUserRequestScreen from './src/screens/NewUserRequestScreen';
import ExistingUserVerificationScreen from './src/screens/ExistingUserVerificationScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import PatientDashboard from './src/screens/PatientDashboard';
import DoctorDashboard from './src/screens/DoctorDashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import UserRequestsScreen from './src/screens/UserRequestsScreen';

// Profile and Booking Screens
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import DoctorProfileScreen from './src/screens/DoctorProfileScreen';
import DoctorFinderScreen from './src/screens/DoctorFinderScreen';
import DoctorListScreen from './src/screens/DoctorListScreen';
import AppointmentBookingScreen from './src/screens/AppointmentBookingScreen';
import AppointmentListScreen from './src/screens/AppointmentListScreen';
import AppointmentDetailsScreen from './src/screens/AppointmentDetailsScreen';
import ProfileManagementScreen from './src/screens/ProfileManagementScreen';
import EnhancedAdminDashboard from './src/screens/EnhancedAdminDashboard';
import EnhancedPatientDashboard from './src/screens/EnhancedPatientDashboard';
import DoctorQueueScreen from './src/screens/DoctorQueueScreen';
import AdminDoctorProfileView from './src/screens/AdminDoctorProfileView';
import PatientDoctorView from './src/screens/PatientDoctorView';

// Import services
import authService from './src/services/authService';

const Stack = createStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize Firebase
      await authService.initialize();

      // Check if user is authenticated
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Get user role and set appropriate initial route
        const userRole = await authService.getUserRole();
        
        switch (userRole) {
          case 'Admin':
            setInitialRoute('AdminDashboard');
            break;
          case 'Doctor':
            setInitialRoute('DoctorDashboard');
            break;
          case 'Patient':
            setInitialRoute('PatientDashboard');
            break;
          default:
            setInitialRoute('Login');
        }
      } else {
        setInitialRoute('Landing');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart the application.',
        [{ text: 'OK' }]
      );
      setInitialRoute('Landing');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>🏥 HealQ</Text>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary} 
        translucent={false}
      />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Onboarding Screens */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="OnboardingChoice" component={OnboardingChoiceScreen} />
        <Stack.Screen name="NewUserRequest" component={NewUserRequestScreen} />
        <Stack.Screen name="ExistingUserVerification" component={ExistingUserVerificationScreen} />
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
        {/* Dashboard Screens */}
        <Stack.Screen name="PatientDashboard" component={EnhancedPatientDashboard} />
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
        <Stack.Screen name="AdminDashboard" component={EnhancedAdminDashboard} />
        
        {/* Admin Management Screens */}
        <Stack.Screen name="UserRequests" component={UserRequestsScreen} />
        
        {/* Profile Management Screens */}
        <Stack.Screen 
          name="PatientProfile" 
          component={PatientProfileScreen}
          options={{ 
            headerShown: true, 
            title: 'Patient Profile',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        <Stack.Screen 
          name="DoctorProfile" 
          component={DoctorProfileScreen}
          options={{ 
            headerShown: true, 
            title: 'Doctor Profile',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        
        {/* Doctor Discovery Screens */}
        <Stack.Screen 
          name="DoctorFinder" 
          component={DoctorFinderScreen}
          options={{ 
            headerShown: true, 
            title: 'Find Doctors',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        <Stack.Screen 
          name="DoctorList" 
          component={DoctorListScreen}
          options={{ 
            headerShown: true, 
            title: 'Available Doctors',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        
        {/* Appointment Management Screens */}
        <Stack.Screen 
          name="AppointmentBooking" 
          component={AppointmentBookingScreen}
          options={{ 
            headerShown: true, 
            title: 'Book Appointment',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        <Stack.Screen 
          name="AppointmentList" 
          component={AppointmentListScreen}
          options={{ 
            headerShown: true, 
            title: 'My Appointments',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        <Stack.Screen 
          name="AppointmentDetails" 
          component={AppointmentDetailsScreen}
          options={{ 
            headerShown: true, 
            title: 'Appointment Details',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        
        {/* Enhanced Profile Management Screen */}
        <Stack.Screen 
          name="ProfileManagement" 
          component={ProfileManagementScreen}
          options={{ 
            headerShown: true, 
            title: 'Profile Management',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
          }}
        />
        
        {/* Admin Doctor Queue Screen */}
        <Stack.Screen 
          name="DoctorQueue" 
          component={DoctorQueueScreen}
          options={{ 
            headerShown: true,
            title: 'Doctor Queue',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />

        {/* Admin Doctor Profile View */}
        <Stack.Screen 
          name="AdminDoctorProfileView" 
          component={AdminDoctorProfileView}
          options={{ 
            headerShown: true,
            title: 'Doctor Profile',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />

        {/* Patient Doctor View */}
        <Stack.Screen 
          name="PatientDoctorView" 
          component={PatientDoctorView}
          options={{ 
            headerShown: true,
            title: 'Doctor Details',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingTitle: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 1,
    fontWeight: '800',
  },
  loadingText: {
    ...theme.typography.h4,
    color: theme.colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '300',
  },
});

export default App;
