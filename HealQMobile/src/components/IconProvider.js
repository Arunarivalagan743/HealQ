import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import Octicons from 'react-native-vector-icons/Octicons';
import Zocial from 'react-native-vector-icons/Zocial';
import { initializeIcons, getIconSize } from '../utils/iconUtils';

/**
 * HealQ Icon Constants
 * Predefined icons for the HealQ application
 */
export const HealQIcons = {
  // Core Medical Icons
  hospital: { type: 'MaterialCommunityIcons', name: 'hospital-building' },
  doctor: { type: 'FontAwesome5', name: 'user-md' },
  nurse: { type: 'MaterialCommunityIcons', name: 'nurse' },
  patient: { type: 'FontAwesome5', name: 'user-injured' },
  medicalRecords: { type: 'MaterialCommunityIcons', name: 'file-document-outline' },
  prescription: { type: 'MaterialCommunityIcons', name: 'prescription' },
  stethoscope: { type: 'FontAwesome5', name: 'stethoscope' },
  medicine: { type: 'MaterialCommunityIcons', name: 'pill' },
  
  // Appointment & Scheduling
  appointment: { type: 'MaterialCommunityIcons', name: 'calendar-clock' },
  clock: { type: 'Feather', name: 'clock' },
  confirm: { type: 'Feather', name: 'check-circle' },
  cancel: { type: 'MaterialCommunityIcons', name: 'cancel' },
  
  // User & Roles
  profile: { type: 'MaterialIcons', name: 'person' },
  users: { type: 'MaterialCommunityIcons', name: 'account-group' },
  admin: { type: 'MaterialCommunityIcons', name: 'shield-account' },
  security: { type: 'Feather', name: 'lock' },
  
  // Authentication & Security
  login: { type: 'MaterialIcons', name: 'login' },
  logout: { type: 'MaterialIcons', name: 'logout' },
  register: { type: 'MaterialCommunityIcons', name: 'account-plus' },
  key: { type: 'Feather', name: 'key' },
  verification: { type: 'MaterialCommunityIcons', name: 'shield-check' },
  
  // Navigation & Utilities
  home: { type: 'Feather', name: 'home' },
  dashboard: { type: 'MaterialCommunityIcons', name: 'view-dashboard' },
  search: { type: 'Feather', name: 'search' },
  notifications: { type: 'Ionicons', name: 'notifications-outline' },
  messages: { type: 'MaterialCommunityIcons', name: 'message-text' },
  settings: { type: 'Feather', name: 'settings' },
  help: { type: 'MaterialIcons', name: 'help-outline' }
};

/**
 * Icon Component that supports multiple icon libraries
 * @param {string} type - Icon library (MaterialIcons, FontAwesome, Ionicons, etc.)
 * @param {string} name - Icon name from the selected library
 * @param {number} size - Icon size
 * @param {string} color - Icon color
 * @param {object} style - Additional style properties
 * @returns {React.Component} Icon component
 */
const Icon = ({ type, name, size = 24, color = '#000', style = {} }) => {
  // Initialize icons when component mounts
  useEffect(() => {
    initializeIcons();
  }, []);
  
  // Ensure size is properly scaled
  const scaledSize = getIconSize(size);
  
  switch (type) {
    case 'MaterialIcons':
      return <MaterialIcons name={name} size={scaledSize} color={color} style={style} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={name} size={scaledSize} color={color} style={style} />;
    case 'FontAwesome':
      return <FontAwesome name={name} size={scaledSize} color={color} style={style} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={name} size={scaledSize} color={color} style={style} />;
    case 'Ionicons':
      return <Ionicons name={name} size={scaledSize} color={color} style={style} />;
    case 'Feather':
      return <Feather name={name} size={scaledSize} color={color} style={style} />;
    case 'Entypo':
      return <Entypo name={name} size={scaledSize} color={color} style={style} />;
    case 'EvilIcons':
      return <EvilIcons name={name} size={scaledSize} color={color} style={style} />;
    case 'AntDesign':
      return <AntDesign name={name} size={scaledSize} color={color} style={style} />;
    case 'SimpleLineIcons':
      return <SimpleLineIcons name={name} size={scaledSize} color={color} style={style} />;
    case 'Foundation':
      return <Foundation name={name} size={scaledSize} color={color} style={style} />;
    case 'Octicons':
      return <Octicons name={name} size={scaledSize} color={color} style={style} />;
    case 'Zocial':
      return <Zocial name={name} size={scaledSize} color={color} style={style} />;
    default:
      return <MaterialIcons name={name || "error"} size={scaledSize} color={color} style={style} />;
  }
};

/**
 * Helper function to use predefined HealQ icons
 * @param {string} iconName - Predefined icon name from HealQIcons
 * @param {number} size - Icon size
 * @param {string} color - Icon color
 * @param {object} style - Additional style properties
 * @returns {React.Component} Icon component
 */
export const HealQIcon = ({ iconName, size, color, style }) => {
  // Initialize icons when component mounts
  useEffect(() => {
    initializeIcons();
  }, []);
  
  const iconConfig = HealQIcons[iconName];
  if (!iconConfig) {
    console.warn(`Icon ${iconName} not found in HealQIcons`);
    return <MaterialIcons name="error" size={getIconSize(size || 24)} color={color || '#FF0000'} style={style} />;
  }
  
  return <Icon 
    type={iconConfig.type} 
    name={iconConfig.name} 
    size={getIconSize(size || 24)} 
    color={color} 
    style={style} 
  />;
};

export default Icon;
