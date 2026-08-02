import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';

interface MenuSectionLabelProps {
  /** The text label to display in uppercase */
  label: string;
}

/**
 * Component rendering a styled section header label.
 * Used for grouping categories of settings/actions.
 */
export function MenuSectionLabel({ label }: MenuSectionLabelProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xs,
  },
  text: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
  },
});
