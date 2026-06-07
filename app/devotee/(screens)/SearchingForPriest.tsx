import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import * as bookingService from '@/services/devotee/bookingService';
import { fetchBookingDetails } from '@/services/devotee/bookingManagementService';
import { logger } from '@/utils/logger';

type ScreenState = 'searching' | 'connecting' | 'no_priest' | 'error';

// How long to keep searching before giving up, and how often to poll.
const SEARCH_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_INTERVAL_MS = 4000;
// Statuses that mean the search is over without a priest.
const DEAD_STATUSES = ['cancelled', 'expired', 'rejected'];

/**
 * Devotee-facing screen for the INSTANT (accept-then-pay) flow.
 *
 * After an instant booking is created it sits in 'searching' while priests are
 * notified. This screen polls the booking until a priest accepts (status →
 * 'confirmed'), then opens the payment order and forwards to the Payment screen.
 * If no priest accepts before the timeout, it offers to go back.
 */
export default function SearchingForPriestScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ bookingId: string; totalDisplay: string }>();

  const [state, setState] = useState<ScreenState>('searching');
  const [errorMessage, setErrorMessage] = useState('');

  const activeRef = useRef(true);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTimers = useCallback(() => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    if (deadlineRef.current) { clearTimeout(deadlineRef.current); deadlineRef.current = null; }
  }, []);

  // When a priest accepts, open the payment order and hand off to Payment.
  const goToPayment = useCallback(async () => {
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
      logger.error('SearchingForPriest: failed to open payment', err);
      if (!activeRef.current) return;
      setErrorMessage(err?.message || 'Could not start payment. Please try again.');
      setState('error');
    }
  }, [params.bookingId, params.totalDisplay, router]);

  useEffect(() => {
    activeRef.current = true;

    const poll = async () => {
      if (!activeRef.current) return;
      try {
        const res = await fetchBookingDetails(params.bookingId);
        const booking = (res as any)?.data || res;
        if (!activeRef.current) return;

        if (booking?.status === 'confirmed') {
          stopTimers();
          setState('connecting');
          await goToPayment();
          return;
        }
        if (DEAD_STATUSES.includes(booking?.status)) {
          stopTimers();
          setState('no_priest');
          return;
        }
      } catch (err) {
        // Transient errors are ignored — keep polling until the deadline.
      }
      if (activeRef.current) {
        pollRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    deadlineRef.current = setTimeout(() => {
      if (!activeRef.current) return;
      stopTimers();
      setState('no_priest');
    }, SEARCH_TIMEOUT_MS);

    return () => {
      activeRef.current = false;
      stopTimers();
    };
  }, [params.bookingId, goToPayment, stopTimers]);

  const handleBack = () => {
    activeRef.current = false;
    stopTimers();
    router.replace('/devotee/(tabs)/HomeTab' as any);
  };

  // ---- render states ----
  if (state === 'no_priest' || state === 'error') {
    const isError = state === 'error';
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={styles.center}>
          <Ionicons
            name={isError ? 'alert-circle-outline' : 'time-outline'}
            size={64}
            color={THEME.colors.textMuted}
          />
          <Text style={styles.title}>
            {isError ? 'Something went wrong' : 'No priest available right now'}
          </Text>
          <Text style={styles.subtitle}>
            {isError
              ? errorMessage
              : 'We could not find an available priest for your ceremony. Please try again or book a specific priest.'}
          </Text>
          <View style={styles.actions}>
            <PrimaryButton title="Back to Home" onPress={handleBack} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.title}>
          {state === 'connecting' ? 'Priest found! Setting up payment…' : 'Finding a priest for you…'}
        </Text>
        <Text style={styles.subtitle}>
          {state === 'connecting'
            ? 'Please hold on a moment.'
            : 'We are notifying available priests near you. This usually takes a minute.'}
        </Text>
      </View>

      {state === 'searching' && (
        <View style={styles.bottom}>
          <PrimaryButton title="Cancel" variant="outline" onPress={handleBack} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    marginTop: THEME.spacing.xl,
  },
  bottom: {
    paddingBottom: 32,
  },
});
