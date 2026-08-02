/**
 * FilterSectionHeader — uppercase section label used in FilterBottomSheet.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';

interface FilterSectionHeaderProps {
  /** Title string shown in uppercase with letter-spacing. */
  title: string;
}

/**
 * Renders a small uppercase label to head each filter section.
 */
export function FilterSectionHeader({
  title,
}: FilterSectionHeaderProps): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.typography.caption,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
