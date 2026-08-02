import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { BookingStatus } from '@/types/bookingManagement.types';
import { getBookingCardDisplay } from '@/utils/bookingCardUtils';

interface DetailStatusSectionProps {
  status: BookingStatus;
  bookingRef: string;
}

function getStatusStyles(status: BookingStatus) {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return { bg: '#DCFCE7', icon: 'checkmark-circle', color: THEME.colors.success };
    case 'cancelled':
    case 'rejected':
      return { bg: '#FEE2E2', icon: 'close-circle', color: THEME.colors.error };
    case 'pending':
    default:
      return { bg: '#FEF3C7', icon: 'time-outline', color: '#D97706' };
  }
}

/**
 * DetailStatusSection displays the header status details.
 *
 * @param props.status - Current booking status.
 * @param props.bookingRef - Generated booking reference string.
 */
export function DetailStatusSection({ status, bookingRef }: DetailStatusSectionProps): React.JSX.Element {
  const display = getBookingCardDisplay(status);
  const statusStyles = getStatusStyles(status);

  return (
    <View style={styles.statusSection}>
      <View style={[styles.statusCircle, { backgroundColor: statusStyles.bg }]}>
        <Ionicons name={statusStyles.icon as any} size={28} color={statusStyles.color} />
      </View>
      <Text style={styles.statusHeading}>{display.badgeLabel}</Text>
      <Text style={styles.bookingRef}>{bookingRef}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusSection: {
    backgroundColor: '#FFF3E0',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  statusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeading: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.maroon,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  bookingRef: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.gold,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
});
