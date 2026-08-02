/**
 * InstantBookingSetup — simplified booking form for the instant flow.
 *
 * The ceremony is already set in Redux (via setCeremonyContext). This screen
 * collects only: date (locked to instant window), start time, end time, and
 * location. It does NOT collect a priest — the broadcast picks one.
 *
 * Navigation params:
 *  ceremonyId        — the ceremony being booked
 *  preferredPriestId — (optional) priest who gets a 3-min head-start
 */

import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { setPreferredPriest } from '@/redux/slices/bookingSlice';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { DateSection } from '@/components/devotee/booking/DateSection';
import { TimeSection } from '@/components/devotee/booking/TimeSection';
import { AddressSection } from '@/components/devotee/booking/AddressSection';
import * as bookingService from '@/services/devotee/bookingService';
import { isBookingComplete } from '@/components/devotee/booking/BookingBottomBar';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

/**
 * Booking form for the instant flow. Date is restricted to today/tomorrow/day-after.
 * Submits to /bookings/instant and routes to SearchingForPriest on success.
 */
export default function InstantBookingSetupScreen(): React.JSX.Element {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    ceremonyId: string;
    preferredPriestId?: string;
  }>();

  const draft = useSelector((state: RootState) => state.booking);
  const [isLoading, setIsLoading] = useState(false);

  // Ensure preferred priest is wired into Redux from params (priest-triggered flow)
  React.useEffect(() => {
    if (params.preferredPriestId && draft.preferredPriestId !== params.preferredPriestId) {
      dispatch(setPreferredPriest(params.preferredPriestId));
    }
  }, []);

  /** Handles mode conflict when a scheduled-window date is selected. */
  const handleModeConflict = (type: 'use_instant' | 'use_scheduled') => {
    if (type === 'use_scheduled') {
      router.replace('/devotee/ExploreTab' as any);
    }
  };

  const handleSubmitInstant = async () => {
    if (
      !draft.selectedDate ||
      !draft.selectedTimeSlot ||
      !draft.selectedAddress ||
      !draft.selectedService?.ceremonyId
    ) {
      Alert.alert('Missing Details', 'Please complete date, time, and address.');
      return;
    }

    setIsLoading(true);
    try {
      const booking = await bookingService.createInstantBooking({
        ceremonyId: draft.selectedService.ceremonyId,
        date: draft.selectedDate,
        startTime: draft.selectedTimeSlot.startTime,
        endTime: draft.selectedTimeSlot.endTime,
        location: {
          address: draft.selectedAddress.fullAddress,
          city: draft.selectedAddress.city,
          ...(draft.selectedAddress.coordinates
            ? {
                coordinates: {
                  type: 'Point',
                  coordinates: [
                    draft.selectedAddress.coordinates.lng,
                    draft.selectedAddress.coordinates.lat,
                  ],
                },
              }
            : {}),
        },
        preferredPriestId: draft.preferredPriestId ?? null,
      });

      router.replace({
        pathname: '/devotee/SearchingForPriest' as any,
        params: {
          bookingId: booking._id,
          totalDisplay: (draft.pricing?.totalAmount ?? 0).toString(),
        },
      });
    } catch (err: any) {
      if (err?.code === 'NOT_INSTANT_WINDOW') {
        Alert.alert(
          'Instant Booking Not Available',
          'Instant booking is only available for today, tomorrow, and the day after. For this date, please browse pandits and schedule.',
          [
            {
              text: 'Browse Pandits',
              onPress: () => router.replace('/devotee/ExploreTab' as any),
            },
            { text: 'Change Date' },
          ]
        );
      } else {
        Alert.alert('Error', err?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    !!draft.selectedDate && !!draft.selectedTimeSlot && !!draft.selectedAddress;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instant Booking</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Context chip */}
        <View style={styles.ceremonyChip}>
          <Ionicons name="flash" size={16} color={THEME.colors.primary} />
          <Text style={styles.ceremonyChipText} numberOfLines={1}>
            {draft.selectedService?.ceremonyName ?? 'Ceremony'}
          </Text>
        </View>

        <View style={styles.instantBanner}>
          <Ionicons name="flash-outline" size={18} color={THEME.colors.primary} />
          <Text style={styles.instantBannerText}>
            ⚡ Instant availability — today, tomorrow, day-after
          </Text>
        </View>

        {/* Date — instant mode */}
        <DateSection mode="instant" onModeConflict={handleModeConflict} />

        {/* Time */}
        <TimeSection weeklySchedule={undefined} />

        {/* Address */}
        <AddressSection />
      </ScrollView>

      {/* Sticky bottom */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton
          title={isLoading ? 'Searching…' : 'Find a Pandit Now ⚡'}
          onPress={handleSubmitInstant}
          loading={isLoading}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 120,
  },
  ceremonyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4E6',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: THEME.spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD9A0',
  },
  ceremonyChipText: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  instantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EE',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  instantBannerText: {
    flex: 1,
    fontSize: THEME.typography.bodySmall,
    color: '#8B5E00',
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
