import React from 'react';
import { StyleSheet, View } from 'react-native';

import { THEME } from '@/constants/theme';

interface MenuCardProps {
  /** The rows or items inside the card container */
  children: React.ReactNode;
}

/**
 * Component serving as a card container for menu lists.
 * Groups multiple MenuRow items in a card with rounded corners and shadows.
 */
export function MenuCard({ children }: MenuCardProps): React.JSX.Element {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    overflow: 'hidden',
    ...THEME.shadow.card,
  },
});
