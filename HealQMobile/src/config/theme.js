// Healthcare Theme Configuration - Simplified Structure
const colors = {
  // Primary Colors
  primary: '#2C7A7B',
  secondary: '#81E6D9', 
  accent: '#EDF2F7',
  
  // Status Colors
  success: '#38A169',
  warning: '#D69E2E',
  error: '#E53E3E',
  info: '#3182CE',
  
  // Basic Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F7FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  
  // Text Colors (flat structure)
  text: '#2D3748',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textLight: '#A0AEC0',
  
  // Gray Scale
  gray50: '#F7FAFC',
  gray100: '#EDF2F7',
  gray200: '#E2E8F0',
  gray300: '#CBD5E0',
  gray400: '#A0AEC0',
  gray500: '#718096',
  gray600: '#4A5568',
  gray700: '#2D3748',
  gray800: '#1A202C',
  gray900: '#171923',
};

const spacing = {
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

const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

// Font families
const fontFamily = {
  sans: 'sans-serif',
  sansLight: 'sans-serif',
  sansMedium: 'sans-serif',
  sansCondensed: 'sans-serif',
  sansCondensedMedium: 'sans-serif',
};

const typography = {
  // Headers
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontFamily: fontFamily.sans,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Body text
  body1: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  // Special text
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
};

const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
};

const components = {
  button: {
    primary: {
      backgroundColor: '#2C7A7B',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    secondary: {
      backgroundColor: '#81E6D9',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: '#2C7A7B',
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: '#2C7A7B',
    },
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
};

const theme = {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  typography,
  shadows,
  components,
};

export default theme;

