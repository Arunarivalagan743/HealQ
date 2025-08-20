import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../config/theme';

const Card = ({ 
  children, 
  title, 
  subtitle,
  variant = 'default',
  padding = 'medium',
  shadow = 'medium',
  borderColor,
  style,
  headerStyle,
  contentStyle,
  ...props 
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'filled':
        baseStyle.push(styles.filled);
        break;
      case 'medical':
        baseStyle.push(styles.medical);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    // Padding styles
    switch (padding) {
      case 'none':
        baseStyle.push(styles.paddingNone);
        break;
      case 'small':
        baseStyle.push(styles.paddingSmall);
        break;
      case 'medium':
        baseStyle.push(styles.paddingMedium);
        break;
      case 'large':
        baseStyle.push(styles.paddingLarge);
        break;
    }
    
    // Shadow styles
    switch (shadow) {
      case 'none':
        break;
      case 'small':
        baseStyle.push(theme.shadows.small);
        break;
      case 'medium':
        baseStyle.push(theme.shadows.medium);
        break;
      case 'large':
        baseStyle.push(theme.shadows.large);
        break;
    }
    
    // Border color
    if (borderColor) {
      baseStyle.push({ borderColor });
    }
    
    // Custom style
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  return (
    <View style={getCardStyle()} {...props}>
      {(title || subtitle) && (
        <View style={[styles.header, headerStyle]}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  elevated: {
    backgroundColor: theme.colors.surface,
    borderColor: 'transparent',
    elevation: 8,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 2,
  },
  filled: {
    backgroundColor: theme.colors.accent,
    borderColor: 'transparent',
  },
  medical: {
    backgroundColor: theme.colors.surface,
    borderColor: 'transparent',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  
  // Padding
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: theme.spacing.md,
  },
  paddingMedium: {
    padding: theme.spacing.lg,
  },
  paddingLarge: {
    padding: theme.spacing.xl,
  },
  
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'sans-serif',
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontFamily: 'sans-serif',
  },
  content: {
    flex: 1,
  },
});

export default Card;

