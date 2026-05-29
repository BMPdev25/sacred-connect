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
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive || !bookingId) return;

    const checkStatus = async () => {
      try {
        const res = await fetchBookingDetails(bookingId);
        if (res.status === 'confirmed' || res.paymentStatus === 'completed') {
          clearInterval(intervalRef.current!);
          router.replace('/devotee/(screens)/BookingConfirmation' as any);
        }
      } catch (err) {
        // Fail silently during background polling to prevent interruption
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId, isActive, router]);
}
