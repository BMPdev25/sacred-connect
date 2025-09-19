// src/components/Button.js
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import Colors from '../constants/Colors';

const APP_COLORS = {
  primary: Colors.light.tint,
  secondary: Colors.light.tabIconDefault,
  white: Colors.light.background,
  black: Colors.light.text,
  lightGray: '#eee',
  gray: '#6b6b6b',
  error: '#cc0000',
  background: Colors.light.background,
};
 
type ButtonType = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = {
  title: React.ReactNode;
  onPress?: () => void;
  type?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  [key: string]: any;
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    if (type === 'primary') return styles.primaryButton;
    if (type === 'secondary') return styles.secondaryButton;
    if (type === 'outline') return styles.outlineButton;
    if (type === 'text') return styles.textButton;
    return styles.primaryButton;
  };

  const getButtonTextStyle = () => {
    if (type === 'primary') return styles.primaryButtonText;
    if (type === 'secondary') return styles.secondaryButtonText;
    if (type === 'outline') return styles.outlineButtonText;
    if (type === 'text') return styles.textButtonText;
    return styles.primaryButtonText;
  };

  const getButtonSize = () => {
    if (size === 'small') return styles.smallButton;
    if (size === 'medium') return styles.mediumButton;
    if (size === 'large') return styles.largeButton;
    return styles.mediumButton;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getButtonSize(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={type === 'primary' ? APP_COLORS.white : APP_COLORS.primary}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            getButtonTextStyle(),
            disabled && styles.disabledButtonText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Button types
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  // Text styles
  primaryButtonText: {
    color: APP_COLORS.white,
  },
  secondaryButtonText: {
    color: APP_COLORS.black,
  },
  outlineButtonText: {
    color: APP_COLORS.primary,
  },
  textButtonText: {
    color: APP_COLORS.primary,
  },
  // Button sizes
  smallButton: {
    height: 36,
    paddingHorizontal: 12,
  },
  mediumButton: {
    height: 48,
    paddingHorizontal: 16,
  },
  largeButton: {
    height: 56,
    paddingHorizontal: 24,
  },
  // Disabled state
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.8,
  },
});

export default Button;