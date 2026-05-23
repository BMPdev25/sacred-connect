/**
 * Role selection screen — placeholder pending full implementation.
 * Users choose 'Devotee' or 'Priest' to continue registration.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';

/**
 * RoleSelectionScreen stub. Full implementation in a future task.
 */
export default function RoleSelectionScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Role Selection</Text>
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
    fontSize: THEME.typography.heading,
    color: THEME.colors.textPrimary,
  },
});
