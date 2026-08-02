import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { parseAvailabilitySlots } from '@/utils/priestDetailsUtils';
import { AvailabilitySlot } from '@/types/priestDetails.types';

interface AvailabilityRowProps {
  /** The specific availability slot data */
  slot: AvailabilitySlot;
  /** Whether this is the last row, determining divider visibility */
  isLast: boolean;
}

/** Renders a single row showing a day and its availability status */
function AvailabilityRow({ slot, isLast }: AvailabilityRowProps) {
  return (
    <>
      <View style={styles.row}>
        <Text style={[styles.dayLabel, slot.isAvailableToday && styles.dayLabelToday]}>
          {slot.label}
        </Text>
        <View style={styles.rightSide}>
          {slot.isAvailableToday ? (
            <View style={styles.availablePill}>
              <Text style={styles.availablePillText}>Available</Text>
            </View>
          ) : (
            <Text style={styles.timeRangeText}>{slot.timeRange}</Text>
          )}
        </View>
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export interface AvailabilitySectionProps {
  /** The 24-hour schedules mapped by day of the week */
  weeklySchedule: Record<string, string[]> | undefined;
  /** The profile ID of the priest */
  priestProfileId: string;
}

/**
 * Section to display upcoming availability slots for a priest.
 * Hides itself entirely if the schedule is empty or invalid.
 */
export function AvailabilitySection({ weeklySchedule, priestProfileId }: AvailabilitySectionProps) {
  if (!weeklySchedule) return null;
  
  const hasAnySlots = Object.values(weeklySchedule).some((slots) => slots && slots.length > 0);
  if (!hasAnySlots) return null;

  const slots = parseAvailabilitySlots(weeklySchedule);
  if (slots.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.subheading}>Availability</Text>
      <Text style={styles.subtitle}>Next available slots</Text>
      
      <View style={styles.card}>
        {slots.slice(0, 3).map((slot, index) => (
          <AvailabilityRow 
            key={`${slot.label}-${index}`} 
            slot={slot} 
            isLast={index === Math.min(slots.length, 3) - 1} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: THEME.spacing.md,
  },
  subheading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    ...THEME.shadow.card,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dayLabel: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  dayLabelToday: {
    fontWeight: '700',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  availablePill: {
    backgroundColor: '#DCFCE7',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  availablePillText: {
    color: '#16A34A',
    fontSize: THEME.typography.caption,
    fontWeight: '600',
  },
  timeRangeText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
});
