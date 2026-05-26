import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';

import {
  DAYS_OF_WEEK,
  DayRow,
  applyScheduleToAll,
  formatTimeTo24h,
  parseTime,
  toggleDay,
  validateStep5Schedule,
  step5Styles as styles,
} from '@/components/priest/onboarding/steps/Step5.subcomponents';
import { THEME } from '@/constants/theme';
import { updateStep5Schedule } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { WeeklySchedule } from '@/types/priest.types';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Step 5 of the priest onboarding wizard.
 * Handles the weekly availability schedule, allowing the user to toggle days
 * and set start/end times. Includes a shortcut to apply the first enabled
 * day's times to all other enabled days.
 */
export const Step5Availability = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const schedule = useSelector((state: RootState) => state.onboarding.step5.weeklySchedule);

  const [stepErrors, setStepErrors] = useState<string[]>([]);
  
  // Time picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerConfig, setPickerConfig] = useState<{
    day: keyof WeeklySchedule | null;
    field: 'start' | 'end' | null;
    initialTime: Date;
  }>({ day: null, field: null, initialTime: new Date() });

  function handleToggleDay(day: keyof WeeklySchedule): void {
    const updated = toggleDay(day, schedule);
    dispatch(updateStep5Schedule(updated));
    setStepErrors([]);
  }

  function handleOpenPicker(day: keyof WeeklySchedule, field: 'start' | 'end'): void {
    const timeStr = field === 'start' ? schedule[day].startTime : schedule[day].endTime;
    setPickerConfig({
      day,
      field,
      initialTime: parseTime(timeStr),
    });
    setShowPicker(true);
  }

  function handleTimeChange(event: any, selectedDate?: Date): void {
    setShowPicker(Platform.OS === 'ios');
    
    if (event.type === 'dismissed' || !selectedDate || !pickerConfig.day || !pickerConfig.field) {
      if (Platform.OS !== 'ios') {
        setShowPicker(false);
      }
      return;
    }

    const newTimeStr = formatTimeTo24h(selectedDate);
    const updated = {
      ...schedule,
      [pickerConfig.day]: {
        ...schedule[pickerConfig.day],
        [pickerConfig.field === 'start' ? 'startTime' : 'endTime']: newTimeStr,
      },
    };
    
    dispatch(updateStep5Schedule(updated));

    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
  }

  function handleApplyToAll(): void {
    const firstEnabledDay = DAYS_OF_WEEK.find((d) => schedule[d].isAvailable);
    if (!firstEnabledDay) return;
    
    const updated = applyScheduleToAll(schedule[firstEnabledDay], schedule);
    dispatch(updateStep5Schedule(updated));
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs = validateStep5Schedule(schedule);
      setStepErrors(errs);
      return errs.length === 0;
    },
    validateStep5: () => {
      const errs = validateStep5Schedule(schedule);
      setStepErrors(errs);
      return { isValid: errs.length === 0, errors: errs };
    },
  } as any));

  const hasEnabledDay = Object.values(schedule).some((day) => day.isAvailable);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Validation Errors */}
      {stepErrors.map((err) => <Text key={err} style={styles.stepError}>{err}</Text>)}

      {/* Apply to All Action */}
      <View style={styles.actionHeader}>
        <Text style={styles.sectionHeading}>Weekly Schedule</Text>
        {hasEnabledDay ? (
          <TouchableOpacity onPress={handleApplyToAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.applyAllText}>Apply to all days</Text>
          </TouchableOpacity>
        ) : (
          <View /> 
        )}
      </View>

      {/* Days Card */}
      <View style={styles.daysCard}>
        {DAYS_OF_WEEK.map((day, index) => (
          <DayRow
            key={day}
            dayName={day}
            schedule={schedule[day]}
            onToggle={handleToggleDay}
            onTimePress={handleOpenPicker}
            isLast={index === DAYS_OF_WEEK.length - 1}
          />
        ))}
      </View>

      {/* Date Time Picker Modal */}
      {showPicker && (
        <DateTimePicker
          value={pickerConfig.initialTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'default' : 'spinner'}
          onChange={handleTimeChange}
        />
      )}
      
      {/* iOS requires a close button since it renders inline (often bottom sheet in real apps, but we'll provide simple UI) */}
      {showPicker && Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.iosCloseBtn} onPress={() => setShowPicker(false)}>
          <Text style={styles.iosCloseBtnText}>Done</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
});


Step5Availability.displayName = 'Step5Availability';

