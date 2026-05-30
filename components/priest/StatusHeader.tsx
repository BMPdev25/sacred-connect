import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { THEME } from '@/constants/theme';

interface StatusHeaderProps {
  ceremonyType: string;
  status: string;
  bookingRef: string;
}

/**
 * Subcomponent rendering the status badge and ceremony header inside Booking Details.
 */
export default function StatusHeader({
  ceremonyType,
  status,
  bookingRef,
}: StatusHeaderProps): React.JSX.Element {
  const getStatusStyle = () => {
    if (status === 'confirmed') return [styles.statusBadge, styles.statusConfirmed];
    if (status === 'completed') return [styles.statusBadge, styles.statusCompleted];
    return [styles.statusBadge, styles.statusCancelled];
  };

  const textStyle =
    status === 'confirmed'
      ? styles.textConfirmed
      : status === 'completed'
        ? styles.textCompleted
        : styles.textCancelled;

  return (
    <View style={styles.statusHeaderContainer}>
      <Text style={styles.ceremonyTitle} numberOfLines={2}>
        {ceremonyType}
      </Text>
      <Text style={styles.bookingRef}>{bookingRef}</Text>
      <View style={getStatusStyle()}>
        <Text style={[styles.statusText, textStyle]}>
          {status === 'confirmed' ? 'Confirmed' : status === 'completed' ? 'Completed' : 'Cancelled'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusHeaderContainer: {
    backgroundColor: '#FFF3E0',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  ceremonyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  bookingRef: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: THEME.colors.gold,
    marginTop: 4,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    marginTop: 8,
  },
  statusConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  statusCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textConfirmed: {
    color: '#16A34A',
  },
  textCompleted: {
    color: '#475569',
  },
  textCancelled: {
    color: '#DC2626',
  },
});
