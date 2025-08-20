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
import theme from '../config/theme';

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
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  title: {
    ...theme.typography.h1,
    fontFamily: theme.fontFamily.sans,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '800',
  },
  subtitle: {
    ...theme.typography.subtitle,
    fontFamily: theme.fontFamily.sans,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadows.large,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body1,
    fontFamily: theme.fontFamily.sansMedium,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
    ...theme.typography.body1,
    fontFamily: theme.fontFamily.sans,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: theme.colors.error,
    ...theme.typography.body2,
    fontFamily: theme.fontFamily.sans,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  infoText: {
    color: theme.colors.info,
    ...theme.typography.body2,
    fontFamily: theme.fontFamily.sansLight,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  successText: {
    color: theme.colors.success,
    ...theme.typography.body2,
    fontFamily: theme.fontFamily.sansMedium,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  registerButton: {
    ...theme.components.button.primary,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  disabledButton: {
    backgroundColor: theme.colors.gray300,
  },
  registerButtonText: {
    ...theme.typography.button,
    fontFamily: theme.fontFamily.sansMedium,
    color: theme.colors.primaryText,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  loginText: {
    ...theme.typography.body1,
    fontFamily: theme.fontFamily.sans,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    ...theme.typography.body1,
    fontFamily: theme.fontFamily.sansMedium,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;

