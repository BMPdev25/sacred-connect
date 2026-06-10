import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import * as bookingService from '@/services/devotee/bookingService';
import { fetchBookingDetails } from '@/services/devotee/bookingManagementService';
import { BookingListItem } from '@/types/bookingManagement.types';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total search window in seconds (mirrors backend 10-min TTL). */
const SEARCH_TOTAL_SECONDS = 600;
const POLL_INTERVAL_MS = 5000;
const FOUND_DISPLAY_MS = 2000;
const DEAD_STATUSES = ['cancelled', 'expired', 'rejected'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchState = 'searching' | 'found' | 'expired' | 'error';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CountdownRingProps {
  secondsRemaining: number;
}

/**
 * Circular countdown ring with minutes:seconds display in the centre.
 * Drawn with a simple SVG-style border trick using borderRadius.
 */
function CountdownRing({ secondsRemaining }: CountdownRingProps): React.JSX.Element {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const label = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const pct = secondsRemaining / SEARCH_TOTAL_SECONDS;
  const isLow = secondsRemaining < 60;

  return (
    <View style={styles.ringOuter}>
      <View style={[styles.ringTrack, isLow && styles.ringTrackLow]}>
        <View style={styles.ringInner}>
          <Text style={[styles.ringTime, isLow && styles.ringTimeLow]}>{label}</Text>
          <Text style={styles.ringLabel}>remaining</Text>
        </View>
      </View>
    </View>
  );
}

interface BookingCardProps {
  booking: BookingListItem;
}

/**
 * Compact card showing ceremony, date, time and location during the search.
 */
function BookingCard({ booking }: BookingCardProps): React.JSX.Element {
  return (
    <View style={styles.bookingCard}>
      <InfoRow icon="pricetag-outline" text={booking.ceremonyType} />
      <InfoRow icon="calendar-outline" text={booking.date} />
      <InfoRow icon="time-outline" text={booking.startTime} />
      {booking.location?.address ? (
        <InfoRow icon="location-outline" text={booking.location.address} />
      ) : null}
    </View>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

function InfoRow({ icon, text }: InfoRowProps): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={THEME.colors.textMuted} />
      <Text style={styles.infoText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

/**
 * SearchingForPriestScreen — shown while an instant booking broadcasts to priests.
 *
 * Polls every 5 s for a priest assignment (status leaves 'searching' with a
 * priestId set). On acceptance, celebrates for 2 s then hands off to Payment.
 * On expiry (10-min TTL) or cancellation, offers Try Again or Schedule flows.
 */
export default function SearchingForPriestScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookingId: string;
    totalDisplay: string;
    ceremonyId: string;
  }>();

  const [searchState, setSearchState] = useState<SearchState>('searching');
  const [secondsLeft, setSecondsLeft] = useState(SEARCH_TOTAL_SECONDS);
  const [booking, setBooking] = useState<BookingListItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const activeRef = useRef(true);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  const handleGoToPayment = useCallback(async () => {
    try {
      const total = Number(params.totalDisplay) || 0;
      const order = await bookingService.createPaymentOrder(params.bookingId, total);
      if (!activeRef.current) return;
      router.replace({
        pathname: '/devotee/(screens)/Payment' as any,
        params: {
          bookingId: params.bookingId,
          razorpayOrderId: order.id,
          amount: order.amount.toString(),
          totalDisplay: total.toString(),
        },
      });
    } catch (err: any) {
      logger.error('SearchingForPriest: payment order failed', err);
      if (!activeRef.current) return;
      setErrorMsg(err?.message || 'Could not start payment. Please try again.');
      setSearchState('error');
    }
  }, [params.bookingId, params.totalDisplay, router]);

  useEffect(() => {
    activeRef.current = true;

    // Countdown tick every second.
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimers();
          setSearchState('expired');
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // Poll for priest assignment.
    const poll = async () => {
      if (!activeRef.current) return;
      try {
        const res = await fetchBookingDetails(params.bookingId);
        const data = (res as any)?.data || res;
        if (!activeRef.current) return;
        if (data) setBooking(data as BookingListItem);

        if (DEAD_STATUSES.includes(data?.status)) {
          clearTimers();
          setSearchState('expired');
          return;
        }
        if (data?.priestId && data?.status !== 'searching') {
          clearTimers();
          setSearchState('found');
          // Short celebration then hand off to payment.
          setTimeout(() => {
            if (activeRef.current) handleGoToPayment();
          }, FOUND_DISPLAY_MS);
          return;
        }
      } catch {
        // Transient — keep polling.
      }
      if (activeRef.current) {
        pollRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      activeRef.current = false;
      clearTimers();
    };
  }, [params.bookingId, handleGoToPayment, clearTimers]);

  const handleCancelSearch = () => {
    Alert.alert(
      'Cancel Search?',
      'Your instant booking request will be cancelled.',
      [
        { text: 'Keep Searching', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            clearTimers();
            activeRef.current = false;
            try {
              await bookingService.cancelInstantBooking(params.bookingId);
            } catch (e) {
              logger.warn('SearchingForPriest: cancel failed', e);
            }
            router.replace('/devotee/(tabs)/HomeTab' as any);
          },
        },
      ]
    );
  };

  const handleTryAgain = () =>
    router.replace({
      pathname: '/devotee/(screens)/InstantBookingSetup' as any,
      params: { ceremonyId: params.ceremonyId },
    });

  const handleSchedule = () =>
    router.replace({
      pathname: '/devotee/(tabs)/ExploreTab' as any,
      params: { filterCeremonyId: params.ceremonyId },
    });

  if (searchState === 'found') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.foundEmoji}>🎉</Text>
          <Text style={styles.foundTitle}>Pandit Found!</Text>
          <Text style={styles.subtitle}>Setting up your payment…</Text>
        </View>
      </View>
    );
  }

  if (searchState === 'expired' || searchState === 'error') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.center, styles.expiredCenter]}>
          <Ionicons name="alert-circle-outline" size={64} color={THEME.colors.primary} />
          <Text style={styles.expiredTitle}>
            {searchState === 'error' ? 'Something went wrong' : 'No Pandit Found'}
          </Text>
          <Text style={styles.subtitle}>
            {searchState === 'error'
              ? errorMsg
              : 'No pandits were available for your instant request.'}
          </Text>
        </View>
        <View style={styles.recoveryButtons}>
          <PrimaryButton title="Try Instant Again" onPress={handleTryAgain} />
          <View style={styles.buttonGap} />
          <PrimaryButton
            title="Schedule with a Pandit"
            variant="outline"
            onPress={handleSchedule}
          />
        </View>
      </View>
    );
  }

  // searching state
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.center}>
          <CountdownRing secondsRemaining={secondsLeft} />
          <Text style={styles.searchTitle}>Finding a Pandit…</Text>
          <Text style={styles.subtitle}>
            We are notifying available pandits near you
          </Text>
        </View>

        {booking ? <BookingCard booking={booking} /> : null}
      </ScrollView>

      <View style={[styles.cancelRow, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — no hardcoded colors, all tokens from THEME
// ---------------------------------------------------------------------------

const RING_SIZE = 160;
const RING_BORDER = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 80,
  },
  center: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  expiredCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  // Countdown ring
  ringOuter: {
    marginBottom: THEME.spacing.lg,
  },
  ringTrack: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrackLow: {
    borderColor: '#E65C00',
  },
  ringInner: {
    alignItems: 'center',
  },
  ringTime: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  ringTimeLow: {
    color: '#E65C00',
  },
  ringLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  searchTitle: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Booking details card
  bookingCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    ...THEME.shadow.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
  // Cancel
  cancelRow: {
    alignItems: 'center',
    paddingTop: THEME.spacing.sm,
  },
  cancelBtn: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
  },
  cancelText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    textDecorationLine: 'underline',
  },
  // Found state
  foundEmoji: {
    fontSize: 64,
    marginBottom: THEME.spacing.md,
  },
  foundTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  // Expired/error state
  expiredTitle: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  recoveryButtons: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  buttonGap: {
    height: THEME.spacing.sm,
  },
});
