import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '@/constants/theme';

/**
 * Placeholder screen for the Profile tab.
 * Will be replaced with the full ProfileTab implementation in a future task.
 */
export default function ProfileTab(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile — Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
});
