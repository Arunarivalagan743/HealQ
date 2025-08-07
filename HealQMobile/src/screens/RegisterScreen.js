import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import authService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    specialization: '',
  });
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check user role when email changes
  const checkUserRole = async (email) => {
    if (!email || !email.includes('@')) {
      setUserRole(null);
      return;
    }

    setRoleLoading(true);
    try {
      // Call backend to check if email exists and get role
      const response = await authService.checkEmailRole(email.trim().toLowerCase());
      setUserRole(response.role);
      setErrors(prev => ({ ...prev, email: '' })); // Clear email error if role found
    } catch (error) {
      setUserRole(null);
      if (error.message && error.message.includes('not authorized')) {
        setErrors(prev => ({ 
          ...prev, 
          email: 'Email not authorized. Please contact admin to add your email first.' 
        }));
      }
    } finally {
      setRoleLoading(false);
    }
  };

  // Debounced email role check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkUserRole(formData.email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const validateForm = () => {
    const newErrors = {};

    // Clean and validate email
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const cleanEmail = formData.email.trim().toLowerCase();
    
    if (!cleanEmail) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userRole) {
      newErrors.email = 'Please enter a valid authorized email address';
    }

    if (userRole === 'Doctor' && !formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required for doctors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean email before sending
      const cleanEmail = formData.email.trim().toLowerCase();
      
      const result = await authService.register(
        cleanEmail,
        formData.password,
        formData.name,
        formData.specialization
      );

      Alert.alert(
        'Registration Successful',
        result.message,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate based on role
              switch (result.user.role) {
                case 'Admin':
                  navigation.replace('AdminDashboard');
                  break;
                case 'Doctor':
                  navigation.replace('DoctorDashboard');
                  break;
                case 'Patient':
                  navigation.replace('PatientDashboard');
                  break;
                default:
                  navigation.replace('Login');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register with your authorized email</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email address"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {roleLoading && <Text style={styles.infoText}>Checking email authorization...</Text>}
            {userRole && !roleLoading && (
              <Text style={styles.successText}>✅ Authorized as: {userRole}</Text>
            )}
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {userRole === 'Doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Specialization</Text>
              <TextInput
                style={[styles.input, errors.specialization && styles.inputError]}
                placeholder="Enter your specialization"
                value={formData.specialization}
                onChangeText={(text) => updateFormData('specialization', text)}
                autoCapitalize="words"
              />
              {errors.specialization && (
                <Text style={styles.errorText}>{errors.specialization}</Text>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading || !userRole}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
  },
  infoText: {
    color: '#3498db',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  successText: {
    color: '#27ae60',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loginLink: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
});

export default RegisterScreen;
