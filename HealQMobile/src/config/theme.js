// Healthcare Theme Configuration - Calm & Clinical Palette
export const colors = {
  // Primary Colors - Calm & Clinical (Healthcare Standard)
  primary: '#2C7A7B',        // Deep Green Blue - trustworthy, professional
  secondary: '#81E6D9',       // Soft Teal - calming, fresh
  accent: '#EDF2F7',          // Muted Gray - clean, neutral
  
  // Status Colors
  success: '#38A169',         // Healthcare green for success states
  warning: '#D69E2E',         // Warm amber for warnings
  error: '#E53E3E',           // Medical red for errors
  info: '#3182CE',            // Trustworthy blue for information
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale (matching healthcare aesthetic)
  gray50: '#F7FAFC',          // Lightest background
  gray100: '#EDF2F7',         // Light background
  gray200: '#E2E8F0',         // Border color
  gray300: '#CBD5E0',         // Disabled elements
  gray400: '#A0AEC0',         // Placeholder text
  gray500: '#718096',         // Secondary text
  gray600: '#4A5568',         // Primary text
  gray700: '#2D3748',         // Dark text
  gray800: '#1A202C',         // Darker text
  gray900: '#171923',         // Darkest text
  
  // Background Colors
  background: {
    primary: '#F7FAFC',       // Main app background
    secondary: '#FFFFFF',     // Card backgrounds
    accent: '#EDF2F7',        // Section backgrounds
  },
  
  // Text Colors
  text: {
    primary: '#2D3748',       // Main text
    secondary: '#4A5568',     // Secondary text
    muted: '#718096',         // Muted text
    light: '#A0AEC0',         // Light text
    white: '#FFFFFF',         // White text on dark backgrounds
  },
  
  // Button Colors
  button: {
    primary: '#2C7A7B',       // Primary button background
    primaryText: '#FFFFFF',   // Primary button text
    secondary: '#81E6D9',     // Secondary button background
    secondaryText: '#2D3748', // Secondary button text
    disabled: '#CBD5E0',      // Disabled button background
    disabledText: '#A0AEC0',  // Disabled button text
  },
  
  // Input Colors
  input: {
    background: '#F7FAFC',    // Input background
    border: '#E2E8F0',        // Input border
    borderFocus: '#2C7A7B',   // Focused input border
    placeholder: '#A0AEC0',   // Placeholder text
    text: '#2D3748',          // Input text
  },
  
  // Card Colors
  card: {
    background: '#FFFFFF',    // Card background
    border: '#E2E8F0',        // Card border
    shadow: '#000000',        // Shadow color
  },
  
  // Medical/Healthcare specific colors
  medical: {
    pulse: '#E53E3E',         // Heart rate, vital signs
    oxygen: '#3182CE',        // Oxygen levels
    temperature: '#D69E2E',   // Temperature
    pressure: '#2C7A7B',      // Blood pressure
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const borderRadius = {
  small: 6,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 50,
};

export const typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: colors.text.primary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: colors.text.primary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text.primary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text.primary,
  },
  
  // Body text
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text.primary,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary,
  },
  
  // Special text
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.text.muted,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: colors.text.secondary,
  },
};

export const shadows = {
  small: {
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Component-specific themes
export const components = {
  header: {
    backgroundColor: colors.primary,
    height: 80,
    paddingTop: 30,
  },
  
  card: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  
  button: {
    primary: {
      backgroundColor: colors.button.primary,
      borderRadius: borderRadius.medium,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.small,
    },
    secondary: {
      backgroundColor: colors.button.secondary,
      borderRadius: borderRadius.medium,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.medium,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: colors.primary,
    },
  },
  
  input: {
    backgroundColor: colors.input.background,
    borderColor: colors.input.border,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  components,
};
