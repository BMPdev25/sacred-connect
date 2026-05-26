import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '@/constants/theme';

/**
 * Placeholder screen for the Explore tab.
 * Will be replaced with the full ExploreTab implementation in a future task.
 */
export default function ExploreTab(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore — Coming Soon</Text>
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
