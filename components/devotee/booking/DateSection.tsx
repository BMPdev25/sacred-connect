import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { setActiveSection, setSelectedDate } from '@/redux/slices/bookingSlice';
import { usePriestProfile } from '@/hooks/usePriestDetails';
import { getDayName, formatDisplayDate, parseDaySchedule } from '@/utils/bookingUtils';

/**
 * Builds the marked dates object for the react-native-calendars component.
 * Disables dates that are not available in the priest's weekly schedule.
 */
function buildMarkedDates(weeklySchedule?: Record<string, string[]>) {
  const marked: Record<string, any> = {};
  if (!weeklySchedule) return marked;

  const today = new Date();
  // Generate for the next 60 days
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    // Format YYYY-MM-DD
    const dateString = d.toISOString().split('T')[0];
    const dayName = getDayName(dateString);
    const schedule = parseDaySchedule(weeklySchedule, dayName);

    if (!schedule) {
      marked[dateString] = { 
        disabled: true, 
        disableTouchEvent: true 
      };
    } else {
      marked[dateString] = { 
        marked: true, 
        dotColor: THEME.colors.primary 
      };
    }
  }
  return marked;
}

interface DateSectionProps {
  weeklySchedule?: Record<string, string[]>;
  dateOverrides?: Record<string, any>;
}

/**
 * DateSection displays the calendar picker or the selected date.
 */
export function DateSection({ weeklySchedule, dateOverrides }: DateSectionProps) {
  const dispatch = useDispatch();
  const draft = useSelector((state: RootState) => state.booking);
  
  // Local state to manage calendar visibility when active
  const [isCalendarOpen, setIsCalendarOpen] = useState(draft.activeSection === 'date');
  
  // Sync local state with Redux activeSection if it changes externally
  React.useEffect(() => {
    setIsCalendarOpen(draft.activeSection === 'date');
  }, [draft.activeSection]);

  const isLocked = !draft.selectedService;

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
    const todayString = new Date().toISOString().split('T')[0];
    const markedDates = buildMarkedDates(weeklySchedule);
    
    // Also mark the currently selected date if any
    if (draft.selectedDate) {
      markedDates[draft.selectedDate] = {
        ...markedDates[draft.selectedDate],
        selected: true,
        selectedColor: THEME.colors.primary,
      };
    }

    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelActive}>DATE</Text>
        <View style={[styles.card, styles.calendarCard]}>
          <Calendar
            minDate={todayString}
            markedDates={markedDates}
            onDayPress={(day: any) => {
              // The disabled flag from markedDates should ideally prevent onDayPress, 
              // but we double check here just in case.
              if (markedDates[day.dateString]?.disabled) return;
              
              dispatch(setSelectedDate(day.dateString));
            }}
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
});
