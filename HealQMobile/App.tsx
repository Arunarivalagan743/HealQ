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
        <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        
        {/* Admin Management Screens */}
        <Stack.Screen name="UserRequests" component={UserRequestsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
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
    color: theme.colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '300',
  },
});

export default App;
