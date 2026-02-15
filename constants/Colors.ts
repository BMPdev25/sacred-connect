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
  // Core Design System — "Modern Spiritual"
  saffron: '#FF9933',
  primary: '#FF9933',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  headingText: '#800000',
  bodyText: '#333333',

  // Backward-compatible aliases
  secondary: Colors.light.tabIconDefault,
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#EDEFF2',
  gray: '#6b6b6b',
  error: '#cc0000',
  info: '#3178c6',
  success: '#28a745',
  warning: '#ffc107',
  text: Colors.light.text,

  // Additional tokens
  cardShadow: 'rgba(0,0,0,0.06)',
  divider: '#E8E8E8',
  saffronLight: '#FFF3E0',
  maroon: '#800000',
};

export default Colors;
