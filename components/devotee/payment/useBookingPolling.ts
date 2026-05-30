import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { fetchBookingDetails } from '@/services/devotee/bookingService';

/**
 * Periodically polls the booking details from backend server.
 * When status is 'confirmed', stops polling and navigates to the confirmation page.
 *
 * @param bookingId - Unique identifier of the booking record.
 * @param isActive - Flag indicating whether polling should run.
 */
export function useBookingPolling(bookingId: string | undefined, isActive: boolean): void {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isActive || !bookingId) return;

    isActiveRef.current = true;

    const checkStatus = async () => {
      try {
        const res = await fetchBookingDetails(bookingId);
        if (res.status === 'confirmed' || res.paymentStatus === 'completed') {
          isActiveRef.current = false;
          if (intervalRef.current) {
            clearTimeout(intervalRef.current);
          }
          router.replace('/devotee/(screens)/BookingConfirmation' as any);
        }
      } catch (err) {
        // Fail silently during background polling to prevent interruption
      }
    };

    const scheduleNextPoll = () => {
      intervalRef.current = setTimeout(async () => {
        if (!isActiveRef.current) return;  // guard for cleanup
        await checkStatus();               // wait for completion
        if (isActiveRef.current) {        // still mounted?
          scheduleNextPoll();              // only then schedule next
        }
      }, 5000);
    };

    scheduleNextPoll();  // kick off first poll
    
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [bookingId, isActive, router]);
}

