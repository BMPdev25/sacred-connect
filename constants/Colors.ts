const tintColorLight = '#f6831e';
const tintColorDark = '#fff';

const Colors = {
  light: {
    text: '#000',
    background: '#fff',
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
  primary: Colors.light.tint,
  secondary: Colors.light.tabIconDefault,
  white: Colors.light.background,
  black: Colors.light.text,
  lightGray: '#eee',
  gray: '#6b6b6b',
  error: '#cc0000',
  background: Colors.light.background,
  info: '#3178c6',
  success: '#28a745',
  warning: '#ffc107',
  text: Colors.light.text,
};

export default Colors;
