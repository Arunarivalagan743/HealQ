import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import theme from '../config/theme';
import { useNavigation } from '@react-navigation/native';

const ScreenHeader = ({ 
  title,
  showBackButton = true,
  rightComponent = null,
  backgroundColor = theme.colors.primary,
  textColor = 'white'
}) => {
  const navigation = useNavigation();
  
  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <View style={[styles.header, { backgroundColor }]}>
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: textColor }]}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        
        <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
        
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Add extra padding for status bar
    zIndex: 10, // Ensure header is above other elements
  },
  backButton: {
    padding: 12, // Increase padding for larger touch area
    zIndex: 15, // Ensure back button stays above other elements
    minWidth: 70, // Ensure minimum width for easier tapping
    minHeight: 44, // Ensure minimum height for easier tapping
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  }
});

export default ScreenHeader;
