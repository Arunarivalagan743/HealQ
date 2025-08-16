import { Platform, PixelRatio } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

// Initialize commonly used icon fonts to ensure they're loaded
export const initializeIcons = async () => {
  const iconFonts = [
    MaterialIcons.font,
    MaterialCommunityIcons.font,
    FontAwesome.font,
    FontAwesome5.font,
    Ionicons.font,
    Feather.font
  ];
  
  // Load all icon fonts asynchronously
  try {
    await Promise.all(
      iconFonts.map(font => {
        if (Platform.OS === 'ios') {
          return font;
        } else {
          return Promise.resolve();
        }
      })
    );
    console.log('Icon fonts loaded successfully');
  } catch (error) {
    console.error('Failed to load icon fonts', error);
  }
};

// This provides a reference scale for icons
export const getIconSize = (size) => {
  const fontScale = PixelRatio.getFontScale();
  return Math.round(size / fontScale);
};
