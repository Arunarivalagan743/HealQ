import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import theme from '../config/theme';
import Icon from './IconProvider';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  icon,
  style,
  textStyle,
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      case 'success':
        baseStyle.push(styles.success);
        break;
      case 'warning':
        baseStyle.push(styles.warning);
        break;
      case 'error':
        baseStyle.push(styles.error);
        break;
      default:
        baseStyle.push(styles.primary);
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.small);
        break;
      case 'medium':
        baseStyle.push(styles.medium);
        break;
      case 'large':
        baseStyle.push(styles.large);
        break;
    }
    
    // State styles
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }
    
    // Custom style
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostText);
        break;
      case 'success':
        baseStyle.push(styles.successText);
        break;
      case 'warning':
        baseStyle.push(styles.warningText);
        break;
      case 'error':
        baseStyle.push(styles.errorText);
        break;
    }
    
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.white : theme.colors.primary} 
          size="small" 
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && (
            <View style={styles.iconContainer}>
              {typeof icon === 'string' ? (
                <Text style={[styles.icon, getTextStyle()]}>{icon}</Text>
              ) : (
                icon
              )}
            </View>
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: theme.colors.success,
    ...theme.shadows.small,
  },
  warning: {
    backgroundColor: theme.colors.warning,
    ...theme.shadows.small,
  },
  error: {
    backgroundColor: theme.colors.error,
    ...theme.shadows.small,
  },
  
  // Sizes
  small: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 52,
  },
  
  // States
  disabled: {
    backgroundColor: theme.colors.gray300,
    borderColor: theme.colors.gray300,
    opacity: 0.6,
  },
  
  // Text styles
  text: {
    ...theme.typography.button,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  successText: {
    color: theme.colors.white,
  },
  warningText: {
    color: theme.colors.white,
  },
  errorText: {
    color: theme.colors.white,
  },
  
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.sm,
    fontSize: 16,
    fontFamily: 'sans-serif',
  },
});

export default Button;

