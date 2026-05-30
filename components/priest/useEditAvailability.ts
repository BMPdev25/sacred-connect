import { useState, useEffect } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { updateStep5Schedule } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { CalendarService } from '@/services/priest/calendarService';
import { WeeklySchedule } from '@/types/priest.types';
import { validateStep5Schedule } from '@/components/priest/onboarding/steps/Step5.subcomponents';

// ---------------------------------------------------------------------------
// Pure Helpers
// ---------------------------------------------------------------------------

function mapWeeklyScheduleFromProfile(ws: any, defaultSchedule: WeeklySchedule): WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  const newSchedule = { ...defaultSchedule };
  days.forEach((day) => {
    const scheduleVal = ws?.[day];
    if (scheduleVal) {
      if (typeof scheduleVal === 'object' && 'isAvailable' in scheduleVal) {
        newSchedule[day] = {
          isAvailable: scheduleVal.isAvailable,
          startTime: scheduleVal.startTime || '09:00',
          endTime: scheduleVal.endTime || '18:00',
        };
      } else if (Array.isArray(scheduleVal)) {
        const isAvail = scheduleVal.length > 0;
        let start = '09:00';
        let end = '18:00';
        if (isAvail && typeof scheduleVal[0] === 'string') {
          const parts = scheduleVal[0].split('-');
          if (parts.length === 2) {
            start = parts[0];
            end = parts[1];
          }
        }
        newSchedule[day] = {
          isAvailable: isAvail,
          startTime: start,
          endTime: end,
        };
      }
    }
  });
  return newSchedule;
}

function mapDateOverridesFromProfile(overrides: any[]): string[] {
  if (!overrides || !Array.isArray(overrides)) return [];
  return overrides
    .filter((o: any) => o.isUnavailable)
    .map((o: any) => {
      try {
        return new Date(o.date).toISOString().split('T')[0];
      } catch {
        return typeof o.date === 'string' ? o.date.split('T')[0] : '';
      }
    })
    .filter(Boolean);
}

function mapWeeklyScheduleToBackend(ws: WeeklySchedule): Record<string, string[]> {
  const backendWeeklySchedule: Record<string, string[]> = {};
  const days: (keyof WeeklySchedule)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  days.forEach((day) => {
    const scheduleVal = ws[day];
    if (scheduleVal && scheduleVal.isAvailable) {
      backendWeeklySchedule[day] = [`${scheduleVal.startTime}-${scheduleVal.endTime}`];
    } else {
      backendWeeklySchedule[day] = [];
    }
  });
  return backendWeeklySchedule;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook containing states and save handlers for editing priest availability hours and blocked dates.
 */
export function useEditAvailability() {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const weeklySchedule = useSelector((state: RootState) => state.onboarding.step5.weeklySchedule);

  const { data: priestProfile, isLoading } = useQuery({
    queryKey: ['myPriestProfile'],
    queryFn: CalendarService.fetchPriestProfile,
    staleTime: 300000,
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (priestProfile && !hasHydrated) {
      const scheduleVal = mapWeeklyScheduleFromProfile(priestProfile.availability?.weeklySchedule, weeklySchedule);
      dispatch(updateStep5Schedule(scheduleVal));

      const overrides = mapDateOverridesFromProfile(priestProfile.availability?.dateOverrides);
      setBlockedDates(overrides);
      setHasHydrated(true);
    }
  }, [priestProfile, hasHydrated, dispatch]);

  const handleDayPress = (day: any) => {
    const dateString = day.dateString;
    setBlockedDates((prev) =>
      prev.includes(dateString)
        ? prev.filter((d) => d !== dateString)
        : [...prev, dateString]
    );
  };

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', msg);
    }
  };

  const handleSave = async () => {
    const errs = validateStep5Schedule(weeklySchedule);
    if (errs.length > 0) {
      Alert.alert('Error', errs.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      const weeklyScheduleBackend = mapWeeklyScheduleToBackend(weeklySchedule);
      const dateOverrides = blockedDates.map((dateStr) => ({
        date: dateStr,
        isUnavailable: true,
        customSlots: [],
        reason: 'Blocked',
      }));

      const payload = {
        availability: {
          weeklySchedule: weeklyScheduleBackend,
          dateOverrides,
        },
      };

      await CalendarService.updatePriestProfile(payload);
      queryClient.invalidateQueries({ queryKey: ['myPriestProfile'] });

      showToast('Availability updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save availability.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    weeklySchedule,
    priestProfile,
    blockedDates,
    isLoading,
    isSaving,
    hasHydrated,
    handleDayPress,
    handleSave,
  };
}
