import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';

interface AddressEmptyStateProps {
  /** Fired when the user requests adding their first address */
  onAddPress: () => void;
}

/**
 * Renders the decorative and structural empty state view when no addresses are saved.
 */
export function AddressEmptyState({ onAddPress }: AddressEmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={56} color={THEME.colors.textMuted} />
      <Text style={styles.emptyTitle}>No saved addresses</Text>
      <Text style={styles.emptySubtitle}>Your saved addresses will appear here</Text>
      <View style={styles.emptyBtnWrapper}>
        <PrimaryButton
          title="Add Your First Address"
          onPress={onAddPress}
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xxl,
  },
  emptyTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.md,
  },
  emptySubtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
  },
  emptyBtnWrapper: {
    marginTop: THEME.spacing.xl,
    width: '100%',
    paddingHorizontal: THEME.spacing.xl,
  },
});
