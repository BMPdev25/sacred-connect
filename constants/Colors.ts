const tintColorLight = '#FF9933'; // Saffron
const tintColorDark = '#fff';

const Colors = {
  light: {
    text: '#333333',
    background: '#F8F9FA',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};

export const APP_COLORS = {
  // Core Design System — Stitch UI
  primary: '#FF9933', // Orange
  secondary: '#9D6D43', // Light Brown
  tertiary: '#704214', // Dark Brown (for Headings)
  neutral: '#FDFBF7', // Background
  saffron: '#FF9933', // Alias
  background: '#FDFBF7',
  surface: '#FFFFFF',
  headingText: '#704214',
  bodyText: '#9D6D43',

  // Backward-compatible aliases
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#E5DFD7',
  gray: '#9D6D43', // Use secondary for gray areas
  error: '#B22222', // Deeper red based on Stitch palette
  info: '#3178c6',
  success: '#2E8B57', // Forest green
  warning: '#FF9933',
  text: '#704214',
  
  // Additional tokens
  cardShadow: 'rgba(112,66,20,0.08)', // Tinted shadow
  divider: '#E5DFD7',
  saffronLight: '#FF993320',
  maroon: '#704214', // Map backward maroon to tertiary
};

export default Colors;
