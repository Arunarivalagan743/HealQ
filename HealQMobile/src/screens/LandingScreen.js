import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import theme from '../config/theme';

const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const steps = [
    {
      id: 1,
      title: 'Welcome to HealQ',
      subtitle: 'Smart Healthcare Management',
      description: 'Your comprehensive clinic management solution for patients, doctors, and administrators.',
      icon: '🏥',
      color: '#4A90E2',
    },
    {
      id: 2,
      title: 'Digital Health Records',
      subtitle: 'Secure & Accessible',
      description: 'Access your medical records, prescriptions, and appointment history anytime, anywhere.',
      icon: '📋',
      color: '#28A745',
    },
    {
      id: 3,
      title: 'Appointment Management',
      subtitle: 'Book with Ease',
      description: 'Schedule appointments, manage queues, and get real-time updates on your clinic visits.',
      icon: '📅',
      color: '#FF6B35',
    },
  ];

  useEffect(() => {
    startAnimation();
  }, [currentStep]);

  const startAnimation = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.8);

    // Animate in sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to onboarding choice
      navigation.navigate('OnboardingChoice');
    }
  };

  const skipToEnd = () => {
    navigation.navigate('OnboardingChoice');
  };

  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🩺 HealQ</Text>
          <Text style={styles.logoSubtext}>Clinic Management System</Text>
        </View>
        <TouchableOpacity onPress={skipToEnd} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentStep ? currentStepData.color : '#E0E0E0',
                transform: [{ scale: index === currentStep ? 1.2 : 1 }],
              },
            ]}
          />
        ))}
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: currentStepData.color + '20' }]}>
          <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.stepTitle, { color: currentStepData.color }]}>
            {currentStepData.title}
          </Text>
          <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👩‍⚕️</Text>
            <Text style={styles.featureText}>Expert Doctors</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Secure Data</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Fast Service</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Mobile Access</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: currentStepData.color }]}
          onPress={nextStep}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Text style={styles.nextButtonIcon}>
            {currentStep === steps.length - 1 ? '🚀' : '→'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.stepCounter}>
          {currentStep + 1} of {steps.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  logoSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  skipButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.accent,
  },
  skipText: {
    color: theme.colors.textSecondary,
    ...theme.typography.body2,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.huge,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: theme.spacing.xs,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxxl,
    ...theme.shadows.large,
  },
  stepIcon: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.huge,
  },
  stepTitle: {
    ...theme.typography.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  stepSubtitle: {
    ...theme.typography.h4,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '500',
  },
  stepDescription: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    width: width * 0.35,
    marginVertical: theme.spacing.md,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  featureText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomContainer: {
    paddingHorizontal: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxxl,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.large,
  },
  nextButtonText: {
    color: theme.colors.white,
    ...theme.typography.button,
    marginRight: theme.spacing.sm,
    fontSize: 18,
  },
  nextButtonIcon: {
    fontSize: 18,
    color: theme.colors.white,
  },
  stepCounter: {
    ...theme.typography.body2,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
});

export default LandingScreen;

