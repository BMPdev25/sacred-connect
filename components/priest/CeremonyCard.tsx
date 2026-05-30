import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { DetailCard } from '@/components/devotee/bookings/DetailCard';
import { DetailRow } from '@/components/devotee/bookings/DetailRow';
import { formatDisplayDate, formatTime12Hour } from '@/utils/bookingUtils';

interface CeremonyCardProps {
  /** The booking date string "YYYY-MM-DD" */
  date: string;
  /** Start time in "HH:MM" format */
  startTime: string;
  /** End time in "HH:MM" format */
  endTime: string;
  /** Full ceremony address details */
  address: string;
}

/**
 * Calculates duration in minutes from startTime and endTime.
 *
 * @param start - Starting time "HH:MM"
 * @param end - Ending time "HH:MM"
 * @returns Duration in minutes.
 */
function calculateDurationMinutes(start: string, end: string): number {
  try {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    return (eH * 60 + eM) - (sH * 60 + sM);
  } catch {
    return 0;
  }
}

/**
 * Formats duration in minutes to user-friendly label (e.g. "2 hrs 30 mins").
 *
 * @param durationMinutes - Duration in minutes.
 * @returns Human-friendly duration string.
 */
function formatDuration(durationMinutes: number): string {
  if (!durationMinutes) return '0 mins';
  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  
  if (hrs > 0 && mins > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
  } else if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  } else {
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }
}

/**
 * Launches native maps application to navigate to the specified location.
 *
 * @param address - Address string.
 */
function handleGetDirections(address: string): void {
  try {
    const encoded = encodeURIComponent(address);
    const url = Platform.OS === 'ios'
      ? `maps://?q=${encoded}`
      : `geo:0,0?q=${encoded}`;
    
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${encoded}`)
    );
  } catch (err) {
    console.error('Failed to launch map directions', err);
  }
}

/**
 * Renders the ceremony details card with directions linking.
 */
export default function CeremonyCard({ date, startTime, endTime, address }: CeremonyCardProps): React.JSX.Element {
  const duration = calculateDurationMinutes(startTime, endTime);
  const durationLabel = formatDuration(duration);
  const timeLabel = `${formatTime12Hour(startTime)} – ${formatTime12Hour(endTime)} (${durationLabel})`;

  return (
    <DetailCard title="Ceremony Details">
      <DetailRow iconName="calendar-outline" text={formatDisplayDate(date)} />
      <DetailRow iconName="time-outline" text={timeLabel} />
      <DetailRow iconName="location-outline" text={address || 'Address not available'} isLast />

      {address ? (
        <Pressable
          style={styles.directionsRow}
          onPress={() => handleGetDirections(address)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="map-outline" size={16} color={THEME.colors.primary} />
          <Text style={styles.directionsText}>Get Directions →</Text>
        </Pressable>
      ) : null}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  directionsText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginLeft: THEME.spacing.sm,
  },
});
