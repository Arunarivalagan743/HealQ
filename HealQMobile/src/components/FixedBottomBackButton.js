import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const FixedBottomBackButton = ({ 
  onPress = null, 
  text = '← Go Back',
  backgroundColor = '#6C757D',
  textColor = '#FFFFFF'
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.bottomButtonContainer}>
      <TouchableOpacity 
        onPress={handlePress} 
        style={[styles.bottomBackButton, { backgroundColor }]}
      >
        <Text style={[styles.bottomBackButtonText, { color: textColor }]}>
          {text}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomBackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
});

export default FixedBottomBackButton;

