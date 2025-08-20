import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../config/theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  variant = 'default',
  size = 'medium',
  disabled = false,
  multiline = false,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer];
    
    // Variant styles
    switch (variant) {
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'filled':
        baseStyle.push(styles.filled);
        break;
      case 'underlined':
        baseStyle.push(styles.underlined);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallContainer);
        break;
      case 'large':
        baseStyle.push(styles.largeContainer);
        break;
    }
    
    // State styles
    if (isFocused) {
      baseStyle.push(styles.focused);
    }
    
    if (error) {
      baseStyle.push(styles.error);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallInput);
        break;
      case 'large':
        baseStyle.push(styles.largeInput);
        break;
    }
    
    if (multiline) {
      baseStyle.push(styles.multilineInput);
    }
    
    if (inputStyle) {
      baseStyle.push(inputStyle);
    }
    
    return baseStyle;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={[styles.label, labelStyle, error && styles.errorLabel]}>
          {label}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Text style={styles.icon}>{leftIcon}</Text>
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.icon}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
          >
            <Text style={styles.icon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  
  label: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontFamily: 'sans-serif',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
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
  underlined: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
    borderColor: theme.colors.border,
  },
  
  // Sizes
  smallContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  largeContainer: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  
  // States
  focused: {
    borderColor: theme.colors.borderFocus,
    borderWidth: 2,
  },
  error: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  disabled: {
    backgroundColor: theme.colors.gray200,
    opacity: 0.6,
  },
  
  input: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 20,
    fontFamily: 'sans-serif',
  },
  
  smallInput: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  
  largeInput: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  leftIconContainer: {
    paddingLeft: theme.spacing.md,
  },
  
  rightIconContainer: {
    paddingRight: theme.spacing.md,
  },
  
  icon: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontFamily: 'sans-serif',
  },
  
  helperText: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    paddingLeft: theme.spacing.md,
    fontFamily: 'sans-serif',
  },
  
  errorLabel: {
    color: theme.colors.error,
  },
  
  errorText: {
    color: theme.colors.error,
    fontWeight: '500',
  },
});

export default Input;

