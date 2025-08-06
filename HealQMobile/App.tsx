import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  Alert,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import PatientDashboard from './src/screens/PatientDashboard';
import DoctorDashboard from './src/screens/DoctorDashboard';
import AdminDashboard from './src/screens/AdminDashboard';

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
        setInitialRoute('Login');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart the application.',
        [{ text: 'OK' }]
      );
      setInitialRoute('Login');
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
        {/* Dashboard Screens */}
        <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
});

export default App;
