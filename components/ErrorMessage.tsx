// src/components/ErrorMessage.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Colors from '../constants/Colors';

const APP_COLORS = {
  error: '#cc0000',
  white: Colors.light.background,
};

type Props = {
  message?: string | null;
  onRetry?: () => void;
  showRetry?: boolean;
  style?: ViewStyle | ViewStyle[];
};

const ErrorMessage: React.FC<Props> = ({
  message,
  onRetry,
  showRetry = false,
  style
}) => {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle" size={20} color={APP_COLORS.error} />
      <Text style={styles.errorText}>{message}</Text>
      {showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${APP_COLORS.error}10`,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    flex: 1,
    color: APP_COLORS.error,
    fontSize: 14,
    marginLeft: 8,
  },
  retryButton: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: APP_COLORS.error,
    borderRadius: 4,
  },
  retryText: {
    color: APP_COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ErrorMessage;