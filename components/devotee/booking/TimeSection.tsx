import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { setActiveSection, setSelectedTimeSlot } from '@/redux/slices/bookingSlice';
import { usePriestProfile } from '@/hooks/usePriestDetails';
import { TimeSlot } from '@/types/booking.types';
import { 
  generateTimeSlots, 
  parseDaySchedule, 
  getDayName, 
  formatDisplayDate 
} from '@/utils/bookingUtils';

const { width: screenWidth } = Dimensions.get('window');
// (screenWidth - 48 (left padding from stepper) - 32 (right padding/margins)) / 3 - 8 (gap)
const PILL_WIDTH = (screenWidth - 80) / 3 - 8;

// Instant flow has no priest yet (broadcast picks one), so there is no
// weekly schedule to read. Fall back to a generous general-availability
// window rather than blocking time selection entirely.
const INSTANT_DEFAULT_SCHEDULE = { startTime: '06:00', endTime: '21:00' };

interface TimeSlotPillProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}

function TimeSlotPill({ slot, isSelected, onSelect }: TimeSlotPillProps) {
  if (slot.isPast) {
    return (
      <View style={[styles.pill, styles.pillPast]}>
        <Text style={styles.pillTextPast}>{slot.displayLabel}</Text>
      </View>
    );
  }

  if (isSelected) {
    return (
      <TouchableOpacity style={[styles.pill, styles.pillSelected]} onPress={onSelect}>
        <Text style={styles.pillTextSelected}>{slot.displayLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.pill, styles.pillAvailable]} onPress={onSelect}>
      <Text style={styles.pillTextAvailable}>{slot.displayLabel}</Text>
    </TouchableOpacity>
  );
}

interface TimeSectionProps {
  weeklySchedule?: Record<string, string[]>;
}

export function TimeSection({ weeklySchedule }: TimeSectionProps) {
  const dispatch = useDispatch();
  const draft = useSelector((state: RootState) => state.booking);

  const isLocked = !draft.selectedDate;

  // LOCKED STATE
  if (isLocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelLocked}>TIME</Text>
        <View style={[styles.card, styles.lockedCard]}>
          <Ionicons name="time-outline" size={20} color={THEME.colors.textMuted} />
          <View style={styles.lockedTextContainer}>
            <Text style={styles.lockedText}>Select a time</Text>
            <Text style={styles.hintText}>Complete date selection first</Text>
          </View>
        </View>
      </View>
    );
  }

  // ACTIVE STATE (date selected, time not yet chosen or activeSection === 'time')
  const isActive = draft.activeSection === 'time' || !draft.selectedTimeSlot;

  if (isActive && draft.selectedDate && draft.selectedService) {
    const dayName = getDayName(draft.selectedDate);
    const schedule = weeklySchedule
      ? parseDaySchedule(weeklySchedule, dayName)
      : INSTANT_DEFAULT_SCHEDULE;

    let slots: TimeSlot[] = [];
    if (schedule) {
      slots = generateTimeSlots(
        schedule.startTime,
        schedule.endTime,
        draft.selectedService.durationMinutes,
        draft.selectedDate
      );
    }

    const shortDateDisplay = formatDisplayDate(draft.selectedDate);

    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelActive}>SELECT TIME</Text>
        <Text style={styles.subtext}>Available slots for {shortDateDisplay}</Text>
        
        <View style={styles.grid}>
          {slots.map((slot, index) => (
            <TimeSlotPill
              key={`${slot.startTime}-${index}`}
              slot={slot}
              isSelected={draft.selectedTimeSlot?.startTime === slot.startTime}
              onSelect={() => dispatch(setSelectedTimeSlot(slot))}
            />
          ))}
          {slots.length === 0 && (
            <Text style={styles.noSlotsText}>No slots available for this date.</Text>
          )}
        </View>
      </View>
    );
  }

  // COMPLETED STATE
  if (draft.selectedTimeSlot) {
    const { displayLabel, endTime } = draft.selectedTimeSlot;
    // Format end time for display (e.g., generateTimeSlots provides endTime in HH:MM)
    // We could format endTime if it's 24-hour, but let's assume simple string for now, or just use what we have.
    // Assuming formatTime12Hour exists in bookingUtils, we could use it, but since it's not exported to us directly easily if we didn't import it,
    // actually we did write formatTime12Hour in bookingUtils! Let's import it to make it look perfect.
    
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelLocked}>TIME</Text>
        <View style={[styles.card, styles.completedCard]}>
          <TouchableOpacity 
            style={styles.changeLink} 
            onPress={() => dispatch(setActiveSection('time'))}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
          
          <Ionicons name="time" size={24} color={THEME.colors.primary} />
          <Text style={styles.completedTimeText}>
            {displayLabel}
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
    marginBottom: 4,
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
  subtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Counteract pill margin
  },
  noSlotsText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    padding: 8,
  },
  pill: {
    width: PILL_WIDTH,
    paddingHorizontal: 8, // adjusted to fit nicely
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  pillAvailable: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pillSelected: {
    backgroundColor: THEME.colors.primary,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  pillPast: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  pillTextAvailable: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textPrimary,
  },
  pillTextSelected: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.surface,
    fontWeight: '700',
  },
  pillTextPast: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
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
  completedTimeText: {
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
