import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import authService from '../services/authService';
import theme from '../config/theme';

const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean email before sending
      const cleanEmail = formData.email.trim().toLowerCase();
      
      const result = await authService.login(cleanEmail, formData.password);

      Alert.alert(
        'Login Successful',
        `Welcome back, ${result.user.name}!`,
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
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    // Clean and format email properly
    if (field === 'email') {
      value = value.trim().toLowerCase();
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🏥 HealQ</Text>
          <Text style={styles.subtitle}>Welcome Back</Text>
          <Text style={styles.description}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>🔐 Secure Login</Text>
          <Text style={styles.infoText}>
            Only pre-authorized emails can register and login to HealQ.
          </Text>
          <Text style={styles.infoText}>
            Contact your administrator if you need access.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.huge,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '800',
  },
  subtitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...theme.typography.subtitle,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: theme.colors.card.background,
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xlarge,
    ...theme.shadows.large,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.card.border,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
    ...theme.typography.body1,
    color: theme.colors.input.text,
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xl,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    ...theme.typography.body2,
    fontWeight: '600',
  },
  button: {
    ...theme.components.button.primary,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.button.disabled,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.button.primaryText,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  linkText: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    ...theme.typography.body2,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  info: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    ...theme.shadows.small,
  },
  infoTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
});

export default LoginScreen;
