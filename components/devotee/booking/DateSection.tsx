import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { setActiveSection, setSelectedDate } from '@/redux/slices/bookingSlice';
import { getDayName, formatDisplayDate, parseDaySchedule } from '@/utils/bookingUtils';

// ---------------------------------------------------------------------------
// IST date helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's date string in IST as 'YYYY-MM-DD'.
 * Uses a fixed +5:30 offset so the result is always IST-accurate on device.
 */
function getTodayIST(): string {
  const now = new Date();
  // Offset IST = UTC+5:30 = 330 minutes
  const istOffset = 330;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + istOffset * 60000);
  return ist.toISOString().split('T')[0];
}

/**
 * Returns the latest date string (today + 2 days) in IST for the instant window.
 */
function getInstantMaxIST(): string {
  const now = new Date();
  const istOffset = 330;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + istOffset * 60000);
  ist.setDate(ist.getDate() + 2);
  return ist.toISOString().split('T')[0];
}

/**
 * Returns the minimum scheduled date string (today + 3 days) in IST.
 */
function getScheduledMinIST(): string {
  const now = new Date();
  const istOffset = 330;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + istOffset * 60000);
  ist.setDate(ist.getDate() + 3);
  return ist.toISOString().split('T')[0];
}

/**
 * Returns a date string N days from today in IST.
 */
function addDaysIST(days: number): string {
  const now = new Date();
  const istOffset = 330;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + istOffset * 60000);
  ist.setDate(ist.getDate() + days);
  return ist.toISOString().split('T')[0];
}

/**
 * Returns true if dateString falls within [minDate, maxDate] inclusive.
 */
function isWithinRange(dateString: string, minDate: string, maxDate: string): boolean {
  return dateString >= minDate && dateString <= maxDate;
}

// ---------------------------------------------------------------------------
// Scheduled: build marked dates from priest weekly availability
// ---------------------------------------------------------------------------

/**
 * Builds the marked dates object for the react-native-calendars component.
 * Disables dates that are not available in the priest's weekly schedule.
 */
function buildMarkedDates(weeklySchedule?: Record<string, string[]>) {
  const marked: Record<string, any> = {};
  if (!weeklySchedule) return marked;

  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateString = d.toISOString().split('T')[0];
    const dayName = getDayName(dateString);
    const schedule = parseDaySchedule(weeklySchedule, dayName);

    if (!schedule) {
      marked[dateString] = { disabled: true, disableTouchEvent: true };
    } else {
      marked[dateString] = { marked: true, dotColor: THEME.colors.primary };
    }
  }
  return marked;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Callback type for mode conflict events. */
export type ModeConflictHandler = (conflictType: 'use_instant' | 'use_scheduled') => void;

export interface DateSectionProps {
  /** Booking mode: 'instant' restricts dates to today/tomorrow/day-after;
   *  'scheduled' restricts to day+3 and beyond. */
  mode?: 'instant' | 'scheduled';
  /** Called when user taps a date that conflicts with the current mode. */
  onModeConflict?: ModeConflictHandler;
  weeklySchedule?: Record<string, string[]>;
  dateOverrides?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// DateSection component
// ---------------------------------------------------------------------------

/**
 * DateSection displays the calendar picker or the selected date.
 * In 'instant' mode, dates outside the instant window (today to day+2) trigger
 * a conflict dialog. In 'scheduled' mode, dates inside the window trigger a
 * switch-to-instant dialog.
 */
export function DateSection({
  mode = 'scheduled',
  onModeConflict,
  weeklySchedule,
  dateOverrides,
}: DateSectionProps) {
  const dispatch = useDispatch();
  const draft = useSelector((state: RootState) => state.booking);

  const [isCalendarOpen, setIsCalendarOpen] = useState(draft.activeSection === 'date');

  React.useEffect(() => {
    setIsCalendarOpen(draft.activeSection === 'date');
  }, [draft.activeSection]);

  // For 'scheduled' mode, the service must be selected first.
  // For 'instant' mode, the ceremony context is pre-loaded — skip the lock.
  const isLocked = mode === 'scheduled' && !draft.selectedService;

  // LOCKED STATE
  if (isLocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelLocked}>DATE</Text>
        <View style={[styles.card, styles.lockedCard]}>
          <Ionicons name="calendar-outline" size={20} color={THEME.colors.textMuted} />
          <View style={styles.lockedTextContainer}>
            <Text style={styles.lockedText}>Select a date</Text>
            <Text style={styles.hintText}>Complete service selection first</Text>
          </View>
        </View>
      </View>
    );
  }

  // EXPANDED STATE (Calendar open)
  if (isCalendarOpen) {
    const todayIST = getTodayIST();
    const instantMaxIST = getInstantMaxIST();
    const scheduledMinIST = getScheduledMinIST();
    const scheduledMaxIST = addDaysIST(180);

    let markedDates: Record<string, any> = {};

    if (mode === 'instant') {
      // Disable everything outside today..day+2
      const minDate = todayIST;
      const maxDate = instantMaxIST;
      // Mark the calendar for 60 days, disabling all outside the instant window
      for (let i = 0; i < 60; i++) {
        const d = addDaysIST(i);
        if (isWithinRange(d, minDate, maxDate)) {
          markedDates[d] = { marked: true, dotColor: THEME.colors.primary };
        } else {
          markedDates[d] = { disabled: true, disableTouchEvent: false };
        }
      }
    } else {
      // Scheduled: use priest availability + disable dates before scheduledMinIST
      markedDates = buildMarkedDates(weeklySchedule);
      // Also disable any dates in the instant window
      for (let i = 0; i < 3; i++) {
        const d = addDaysIST(i);
        markedDates[d] = { disabled: true, disableTouchEvent: false };
      }
    }

    // Mark selected date
    if (draft.selectedDate) {
      markedDates[draft.selectedDate] = {
        ...markedDates[draft.selectedDate],
        selected: true,
        selectedColor: THEME.colors.primary,
      };
    }

    const calMinDate = mode === 'instant' ? todayIST : scheduledMinIST;
    const calMaxDate = mode === 'instant' ? instantMaxIST : scheduledMaxIST;

    const handleDayPress = (day: { dateString: string }) => {
      const dateString = day.dateString;

      if (mode === 'instant') {
        // Date is within instant window — allow
        if (isWithinRange(dateString, todayIST, instantMaxIST)) {
          // Extra validation: if today, time must be >= now+2hrs
          if (dateString === todayIST) {
            const nowIST = new Date(
              new Date().getTime() + 330 * 60000 + new Date().getTimezoneOffset() * 60000
            );
            const latestStart = new Date(nowIST.getTime() + 2 * 3600000);
            const latestStartHour = latestStart.getHours();
            // Allow if there's still time after 22:00 IST cutoff
            if (latestStartHour >= 22) {
              Alert.alert(
                'No Instant Slots Today',
                'No instant slots are available today. Try tomorrow.',
                [{ text: 'OK' }]
              );
              return;
            }
          }
          dispatch(setSelectedDate(dateString));
        } else {
          // Date is outside instant window
          Alert.alert(
            'Schedule with a Specific Pandit?',
            'Instant booking won\'t be possible for this date — a pandit\'s response will take 12-24 hours. Would you like to browse pandits and schedule?',
            [
              {
                text: 'Browse Pandits',
                onPress: () => onModeConflict?.('use_scheduled'),
              },
              { text: 'Stay on Instant' },
            ]
          );
        }
      } else {
        // Scheduled mode
        if (isWithinRange(dateString, todayIST, instantMaxIST)) {
          // Date is in instant window
          Alert.alert(
            'Use Instant Booking?',
            'This date qualifies for instant booking — get a pandit within minutes. Note: we cannot guarantee your selected pandit will be the one who accepts.',
            [
              {
                text: 'Book Instantly',
                onPress: () => onModeConflict?.('use_instant'),
              },
              { text: 'Choose a Different Date' },
            ]
          );
        } else if (dateString >= scheduledMinIST) {
          if (markedDates[dateString]?.disabled) return;
          dispatch(setSelectedDate(dateString));
        }
      }
    };

    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelActive}>DATE</Text>

        {mode === 'instant' && !draft.preferredPriestId && (
          <View style={styles.instantWindowBanner}>
            <Ionicons name="flash-outline" size={16} color={THEME.colors.primary} />
            <Text style={styles.instantWindowBannerText}>
              ⚡ Instant availability — today, tomorrow, day-after
            </Text>
          </View>
        )}

        <View style={[styles.card, styles.calendarCard]}>
          <Calendar
            minDate={calMinDate}
            maxDate={calMaxDate}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              selectedDayBackgroundColor: THEME.colors.primary,
              todayTextColor: THEME.colors.primary,
              dotColor: THEME.colors.primary,
              arrowColor: THEME.colors.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>
      </View>
    );
  }

  // COLLAPSED/COMPLETED STATE
  if (draft.selectedDate) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelLocked}>DATE</Text>
        <View style={[styles.card, styles.completedCard]}>
          <TouchableOpacity
            style={styles.changeLink}
            onPress={() => {
              dispatch(setActiveSection('date'));
              setIsCalendarOpen(true);
              dispatch(setSelectedDate(null));
            }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>

          <Ionicons name="calendar" size={24} color={THEME.colors.primary} />
          <Text style={styles.completedDateText}>
            {formatDisplayDate(draft.selectedDate)}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.xl,
  },
  sectionLabelActive: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.primary,
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  sectionLabelLocked: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    opacity: 0.5,
    borderWidth: 1,
    borderColor: THEME.colors.textMuted,
    borderStyle: 'dashed',
  },
  lockedTextContainer: {
    marginLeft: 12,
  },
  lockedText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  hintText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  calendarCard: {
    padding: THEME.spacing.sm,
    ...THEME.shadow.card,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
    ...THEME.shadow.card,
    position: 'relative',
  },
  completedDateText: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginLeft: 12,
  },
  changeLink: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  changeText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textDecorationLine: 'underline',
  },
  instantWindowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EE',
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  instantWindowBannerText: {
    flex: 1,
    fontSize: THEME.typography.caption,
    color: '#8B5E00',
    fontWeight: '500',
  },
});
