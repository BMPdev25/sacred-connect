import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';
import PrimaryButton from '@/components/shared/PrimaryButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingsEmptyStateProps {
  tab: 'upcoming' | 'past';
  onBookNow?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Empty state view shown when the devotee has no bookings for the selected tab.
 */
export function BookingsEmptyState({ tab, onBookNow }: BookingsEmptyStateProps) {
  const isUpcoming = tab === 'upcoming';
  
  const title = isUpcoming ? 'No upcoming bookings' : 'No past bookings yet';
  const subtitle = isUpcoming
    ? 'Your confirmed ceremonies will appear here'
    : 'Your completed ceremonies will appear here';

  return (
    <View style={styles.container}>
      <Image
        source={AssetService.getImage('devotee.emptyBookings') as any}
        style={styles.illustration}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      {isUpcoming && onBookNow && (
        <PrimaryButton
          title="Book a Ceremony"
          variant="outline"
          onPress={onBookNow}
          style={styles.button}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  button: {
    marginTop: THEME.spacing.xl,
    width: 200,
  },
});
