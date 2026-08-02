import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';

export interface BookingBarProps {
  /** The lowest starting price for this priest's ceremonies */
  startingPrice: number;
  /** The profile ID of the priest */
  priestProfileId: string;
  /** Callback fired when the Book Now button is pressed */
  onBookNow: () => void;
}

/**
 * Absolute positioned sticky bottom bar containing the starting price
 * and the primary call-to-action button to initiate booking.
 */
export function BookingBar({ startingPrice, priestProfileId, onBookNow }: BookingBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
      <View style={styles.row}>
        <View style={styles.leftContent}>
          <Text style={styles.startingFrom}>Starting from</Text>
          <Text style={styles.price}>
            ₹{startingPrice.toLocaleString('en-IN')}
          </Text>
        </View>
        <PrimaryButton
          title="Book Now"
          onPress={onBookNow}
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
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
    // Add subtle top border for Android devices that don't render top shadows well
    ...(Platform.OS === 'android' ? { borderTopWidth: 1, borderTopColor: THEME.colors.border } : {}),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
  },
  startingFrom: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  price: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 2,
  },
  button: {
    width: 160,
    height: 48,
  },
});
