// src/components/LoadingSpinner.js
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { APP_COLORS } from '../constants/Colors';

/**
 * A reusable loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('small' or 'large')
 * @param {string} props.color - Color of the spinner
 * @param {string} props.text - Text to display under the spinner
 * @param {Object} props.style - Additional styles for the container
 */
type Props = {
  size?: 'small' | 'large';
  color?: string;
  text?: string | null;
  style?: any;
};

const LoadingSpinner: React.FC<Props> = ({
  size = 'large',
  color = APP_COLORS.primary,
  text = 'Loading...',
  style = {}
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    color: APP_COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingSpinner;