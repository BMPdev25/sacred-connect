import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import api from '@/api/index';
import { isPriestVerified, normalizeVerificationStatus } from '@/utils/priestUtils';

/** Normalized priest verification status values used across the frontend. */
export type VerificationStatus = 'verified' | 'rejected' | 'pending';

/**
 * Shows the "You're verified" confirmation alert then navigates to the dashboard.
 */
function alertAndNavigateToDashboard(navigate: () => void): void {
  Alert.alert(
    "You're verified! 🎉",
    'Your profile is now live. Start accepting bookings.',
    [{ text: 'Go to Dashboard', onPress: navigate }]
  );
}

/**
 * Custom hook to poll the backend for priest verification status.
 * Fires `onStatusChange` only when the status genuinely changes after the first poll,
 * so the caller can react to transitions (e.g., pending → rejected) without
 * triggering on the initial load.
 *
 * @param intervalMs - Polling interval in milliseconds (default 30 000).
 * @param onStatusChange - Optional callback invoked on every status transition.
 */
export function useVerificationPolling(
  intervalMs: number = 30000,
  onStatusChange?: (status: VerificationStatus) => void
): void {
  const router = useRouter();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let lastSeen: VerificationStatus | null = null;

    async function poll(): Promise<void> {
      try {
        const { data } = await api.get('/priest/profile');
        const status = normalizeVerificationStatus(data.verificationStatus);

        // Skip callback on first poll — screen already loaded the profile on mount.
        // Only fire when there is a genuine transition after that.
        if (lastSeen !== null && status !== lastSeen) {
          onStatusChange?.(status);
        }
        lastSeen = status;

        if (isPriestVerified(status)) {
          clearInterval(intervalId);
          alertAndNavigateToDashboard(() => router.replace('/priest' as any));
        }
      } catch (err) {
        console.error('Verification polling error:', err);
      }
    }

    poll();
    intervalId = setInterval(poll, intervalMs);
    return () => clearInterval(intervalId);
  }, [intervalMs, router, onStatusChange]);
}
