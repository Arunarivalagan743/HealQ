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
import Icon, { HealQIcon } from '../components/IconProvider';

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
          <View style={styles.titleContainer}>
            <Icon type="MaterialCommunityIcons" name="hospital-building" size={32} color={theme.colors.primary} />
            <Text style={styles.title}>HealQ</Text>
          </View>
          <Text style={styles.subtitle}>Welcome Back</Text>
          <Text style={styles.description}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
              <Icon type="MaterialIcons" name="email" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.gray400}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <Icon type="Feather" name="lock" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={theme.colors.gray400}
              />
            </View>
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
            <View style={styles.buttonContent}>
              <Icon type="MaterialIcons" name="login" size={22} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.infoTitleContainer}>
            <Icon type="MaterialCommunityIcons" name="shield-check" size={20} color={theme.colors.info} />
            <Text style={styles.infoTitle}>Secure Login</Text>
          </View>
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
    backgroundColor: theme.colors.background,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    fontWeight: '800',
    marginLeft: 10,
    fontFamily: 'sans-serif',
    letterSpacing: 1,
  },
  subtitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
  description: {
    ...theme.typography.subtitle,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'sans-serif',
    letterSpacing: 0.3,
  },
  form: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.large,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBackground || '#F8F9FA',
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  label: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fontFamily.sansMedium,
    letterSpacing: 0.3,
  },
  input: {
    flex: 1,
    height: '100%',
    ...theme.typography.body1,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.sans,
  },
  // inputError style now merged into inputWrapperError
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xl,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    ...theme.typography.body2,
    fontWeight: '600',
    fontFamily: theme.fontFamily.sansMedium,
    letterSpacing: 0.2,
  },
  button: {
    ...theme.components.button.primary,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray300,
    shadowOpacity: 0.1,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.primaryText,
    fontFamily: theme.fontFamily.sansMedium,
    letterSpacing: 0.8,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.sans,
  },
  linkText: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: theme.fontFamily.sansMedium,
    letterSpacing: 0.2,
  },
  errorText: {
    color: theme.colors.error,
    ...theme.typography.body2,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
    fontFamily: theme.fontFamily.sans,
  },
  info: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    ...theme.shadows.small,
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    fontFamily: theme.fontFamily.sansMedium,
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fontFamily.sansLight,
  },
});

export default LoginScreen;

