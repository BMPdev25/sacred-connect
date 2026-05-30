import React, { useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { THEME } from '@/constants/theme';
import { CalendarBooking } from '@/types/priest.calendar.types';

interface CardProps {
  /** The booking data object to display. */
  booking: CalendarBooking;
  /** Callback fired when the card is pressed. */
  onPress: () => void;
}

/**
 * Parses and formats a 24-hour "HH:MM" time string into a 12-hour AM/PM format.
 *
 * @param timeStr - Time string in "HH:MM" format.
 * @returns Formatted time string (e.g. "2:30 PM").
 */
function formatTime12Hour(timeStr: string): string {
  try {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hours = parseInt(hourStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minStr} ${ampm}`;
  } catch {
    return timeStr;
  }
}

/**
 * A styled card for a priest's daily calendar booking, with micro-scale interactive animation.
 */
export default function CalendarDayBookingCard({ booking, onPress }: CardProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.cardRow}>
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>{formatTime12Hour(booking.startTime)}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Confirmed</Text>
          </View>
        </View>
        <Text style={styles.ceremonyType}>{booking.ceremonyType}</Text>
        <Text style={styles.devoteeName}>{booking.devoteeId?.name || 'Devotee'}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  timePillText: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  statusBadgeText: {
    fontSize: THEME.typography.caption,
    fontWeight: '600',
    color: '#166534',
  },
  ceremonyType: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 10,
  },
  devoteeName: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
});
