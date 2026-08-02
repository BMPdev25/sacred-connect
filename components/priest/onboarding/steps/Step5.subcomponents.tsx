/**
 * Sub-components and pure utilities for Step5Availability.
 */

import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { DaySchedule, WeeklySchedule } from '@/types/priest.types';

// ---------------------------------------------------------------------------
// Pure Utilities
// ---------------------------------------------------------------------------

export const DAYS_OF_WEEK: (keyof WeeklySchedule)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/**
 * Toggles a day's availability in the weekly schedule.
 * If toggling ON, sets default times if they are missing or empty.
 * If toggling OFF, retains the times for when the user toggles back on.
 */
export function toggleDay(day: keyof WeeklySchedule, currentSchedule: WeeklySchedule): WeeklySchedule {
  const dayData = currentSchedule[day];
  const isAvailable = !dayData.isAvailable;
  
  return {
    ...currentSchedule,
    [day]: {
      ...dayData,
      isAvailable,
      startTime: isAvailable && !dayData.startTime ? '08:00' : dayData.startTime,
      endTime: isAvailable && !dayData.endTime ? '18:00' : dayData.endTime,
    },
  };
}

/**
 * Applies the given schedule's times to all currently ENABLED days.
 * Does not turn off days, nor turn on disabled days.
 */
export function applyScheduleToAll(sourceDaySchedule: DaySchedule, currentSchedule: WeeklySchedule): WeeklySchedule {
  const newSchedule = { ...currentSchedule };
  for (const day of DAYS_OF_WEEK) {
    if (newSchedule[day].isAvailable) {
      newSchedule[day] = {
        ...newSchedule[day],
        startTime: sourceDaySchedule.startTime,
        endTime: sourceDaySchedule.endTime,
      };
    }
  }
  return newSchedule;
}

/**
 * Formats "HH:MM" 24h string to "hh:mm A" 12h string.
 * Example: "14:30" -> "02:30 PM"
 */
export function formatTimeForDisplay(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h.toString().padStart(2, '0');
  return `${hStr}:${minutes} ${ampm}`;
}

/**
 * Parses "HH:MM" to a Date object using today's date.
 */
export function parseTime(time24: string): Date {
  const d = new Date();
  if (!time24) {
    d.setHours(8, 0, 0, 0);
    return d;
  }
  const [h, m] = time24.split(':');
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
}

/**
 * Formats a Date object back to "HH:MM".
 */
export function formatTimeTo24h(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Validates the weekly schedule.
 * Returns an array of error messages. Empty array means valid.
 */
export function validateStep5Schedule(schedule: WeeklySchedule): string[] {
  const errs: string[] = [];
  const hasEnabledDay = Object.values(schedule).some((day) => day.isAvailable);
  
  if (!hasEnabledDay) {
    errs.push('Set availability for at least one day');
  } else {
    // Validate times for enabled days
    let timesInvalid = false;
    for (const day of Object.values(schedule)) {
      if (day.isAvailable) {
        const start = parseTime(day.startTime);
        const end = parseTime(day.endTime);
        if (start >= end) {
          timesInvalid = true;
          break;
        }
      }
    }
    if (timesInvalid) {
      errs.push('Check that start time is before end time for each day');
    }
  }
  
  return errs;
}

// ---------------------------------------------------------------------------
// Day Row Component
// ---------------------------------------------------------------------------

interface DayRowProps {
  dayName: keyof WeeklySchedule;
  schedule: DaySchedule;
  onToggle: (day: keyof WeeklySchedule) => void;
  onTimePress: (day: keyof WeeklySchedule, field: 'start' | 'end') => void;
  isLast?: boolean;
}

/**
 * Renders a single day's schedule with a toggle and time picker buttons.
 */
export function DayRow({ dayName, schedule, onToggle, onTimePress, isLast = false }: DayRowProps): React.ReactElement {
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  
  return (
    <View style={[styles.dayRow, isLast && styles.lastDayRow]}>
      <View style={styles.leftCol}>
        <Text style={[styles.dayName, schedule.isAvailable ? styles.dayNameActive : styles.dayNameInactive]}>
          {capitalizedDay}
        </Text>
        
        {schedule.isAvailable ? (
          <View style={styles.timeWrapper}>
            <Ionicons name="time-outline" size={14} color={THEME.colors.primary} />
            <TouchableOpacity
              onPress={() => onTimePress(dayName, 'start')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.timeText}>{formatTimeForDisplay(schedule.startTime)}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}> – </Text>
            <TouchableOpacity
              onPress={() => onTimePress(dayName, 'end')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.timeText}>{formatTimeForDisplay(schedule.endTime)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.unavailableText}>Unavailable</Text>
        )}
      </View>
      
      <Switch
        trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
        thumbColor={THEME.colors.surface}
        ios_backgroundColor={THEME.colors.border}
        onValueChange={() => onToggle(dayName)}
        value={schedule.isAvailable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  lastDayRow: {
    borderBottomWidth: 0,
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  dayName: {
    fontSize: THEME.typography.subheading,
  },
  dayNameActive: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  dayNameInactive: {
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.primary,
    textDecorationLine: 'underline',
  },
  timeSeparator: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  unavailableText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
});

export const step5Styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  stepError: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  applyAllText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  daysCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  iosCloseBtn: {
    alignItems: 'center',
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginTop: THEME.spacing.sm,
  },
  iosCloseBtnText: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
});
