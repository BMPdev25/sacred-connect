import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/index';

/**
 * Custom hook to poll the backend for priest verification status.
 *
 * @param intervalMs - Polling interval in milliseconds (default 30000)
 */
export function useVerificationPolling(intervalMs: number = 30000): void {
  const router = useRouter();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    async function checkStatus() {
      try {
        const response = await api.get('/priest/profile');
        const status = response.data.verificationStatus;

        if (status === 'approved' || status === 'verified') {
          clearInterval(intervalId);
          Alert.alert(
            "You're verified! 🎉",
            "Your profile is now live. Start accepting bookings.",
            [
              {
                text: "Go to Dashboard",
                onPress: () => router.replace('/priest' as any),
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error polling verification status:', error);
      }
    }

    // Initial check
    checkStatus();

    // Start polling
    intervalId = setInterval(checkStatus, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs, router]);
}
