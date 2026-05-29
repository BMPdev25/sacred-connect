import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import { BookingDraft, BookingPriceBreakdown } from '@/types/booking.types';
import PrimaryButton from '@/components/shared/PrimaryButton';

export interface BookingBottomBarProps {
  pricing: BookingPriceBreakdown | null;
  isAllComplete: boolean;
  isLoading: boolean;
  onReviewPress: () => void;
}

/**
 * Checks if the booking draft has all required fields completed.
 */
export function isBookingComplete(draft: BookingDraft): boolean {
  return (
    draft.selectedService !== null &&
    draft.selectedDate !== null &&
    draft.selectedTimeSlot !== null &&
    draft.selectedAddress !== null
  );
}

/**
 * The sticky bottom bar on the Book Ceremony screen.
 */
export function BookingBottomBar({
  pricing,
  isAllComplete,
  isLoading,
  onReviewPress,
}: BookingBottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.leftContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        {pricing ? (
          <View>
            <Text style={styles.totalAmount}>
              ₹{pricing.totalAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.feesLabel}>incl. fees</Text>
          </View>
        ) : (
          <Text style={styles.totalPlaceholder}>₹--</Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        <PrimaryButton
          title="Review Booking"
          onPress={onReviewPress}
          disabled={!isAllComplete}
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.surface,
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  feesLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  totalPlaceholder: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  rightContainer: {
    flex: 0,
  },
  button: {
    width: 160,
  },
});
