import api from '@/api/index';
import { BackendBooking, BookingDraft, PaymentOrder } from '@/types/booking.types';
import { logger } from '@/utils/logger';

/**
 * Creates a booking record on the backend server.
 * Maps devotee's booking draft choices to backend schema structure.
 *
 * @param draft - The complete current active booking draft.
 * @returns A promise that resolves to the created BackendBooking object.
 * @throws An error on rate limit (429) or other backend failures.
 */
export async function createBooking(draft: BookingDraft): Promise<BackendBooking> {
  try {
    if (!draft.selectedService || !draft.selectedDate || !draft.selectedTimeSlot || !draft.selectedAddress || !draft.pricing) {
      throw new Error('Incomplete booking draft details');
    }

    const payload = {
      priestId: draft.priestUserId,
      ceremonyType: draft.selectedService.ceremonyName,
      ceremonyId: draft.selectedService.ceremonyId,
      date: draft.selectedDate,
      startTime: draft.selectedTimeSlot.startTime,
      endTime: draft.selectedTimeSlot.endTime,
      location: {
        address: draft.selectedAddress.fullAddress,
        city: draft.selectedAddress.city,
        coordinates: draft.selectedAddress.coordinates,
      },
      basePrice: draft.pricing.basePrice,
      platformFee: draft.pricing.platformFee,
      totalAmount: draft.pricing.totalAmount,
    };

    const response = await api.post<{ success: boolean; data: BackendBooking }>(
      '/bookings',
      payload,
      { timeout: 15000 } // fail fast — 15 s instead of the 30 s axios default
    );

    if (!response.data || !response.data.success) {
      throw new Error('Failed to create booking on backend');
    }

    return response.data.data;
  } catch (err: any) {
    logger.error('createBooking failed', err);
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
      throw new Error('Booking request timed out. Please check your connection and try again.');
    }
    if (err?.response?.status === 429) {
      throw new Error('Too many booking attempts. Please try again in a few minutes.');
    }
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to create booking.');
  }
}

/**
 * Creates an INSTANT booking (accept-then-pay flow).
 *
 * Unlike createBooking, no priest is chosen and NO payment is taken now — the
 * request is broadcast to verified priests and returns a booking in 'searching'
 * status. The devotee pays only after a priest accepts (see the Payment screen
 * triggered by the acceptance notification).
 *
 * @param draft - The active booking draft (priest fields are ignored).
 * @returns A promise resolving to the created BackendBooking (status 'searching').
 */
export async function createInstantBooking(draft: BookingDraft): Promise<BackendBooking> {
  try {
    if (!draft.selectedService || !draft.selectedDate || !draft.selectedTimeSlot || !draft.selectedAddress || !draft.pricing) {
      throw new Error('Incomplete booking draft details');
    }

    const payload = {
      ceremonyType: draft.selectedService.ceremonyName,
      ceremonyId: draft.selectedService.ceremonyId,
      date: draft.selectedDate,
      startTime: draft.selectedTimeSlot.startTime,
      endTime: draft.selectedTimeSlot.endTime,
      location: {
        address: draft.selectedAddress.fullAddress,
        city: draft.selectedAddress.city,
        coordinates: draft.selectedAddress.coordinates,
      },
      basePrice: draft.pricing.basePrice,
      platformFee: draft.pricing.platformFee,
      totalAmount: draft.pricing.totalAmount,
    };

    const response = await api.post<{ success: boolean; data: BackendBooking }>(
      '/bookings/instant',
      payload,
      { timeout: 15000 }
    );

    if (!response.data || !response.data.success) {
      throw new Error('Failed to create instant booking on backend');
    }

    return response.data.data;
  } catch (err: any) {
    logger.error('createInstantBooking failed', err);
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    if (err?.response?.status === 429) {
      throw new Error('Too many booking attempts. Please try again in a few minutes.');
    }
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to create instant booking.');
  }
}

/**
 * Initiates a Razorpay payment order for the specified booking.
 *
 * @param bookingId - The identifier of the created booking record.
 * @param totalAmount - The total amount to be charged.
 * @returns A promise that resolves to the created PaymentOrder.
 * @throws An error with custom message if payment order creation fails.
 */
export async function createPaymentOrder(
  bookingId: string,
  totalAmount: number
): Promise<PaymentOrder> {
  if (!bookingId || !totalAmount || totalAmount <= 0) {
    throw new Error('Invalid booking amount. Please select a service and try again.');
  }
  try {
    const response = await api.post<{ success: boolean; data: PaymentOrder }>(
      '/bookings/payment/order',
      { bookingId, amount: totalAmount }
    );

    if (!response.data || !response.data.success) {
      throw new Error('Failed to initiate payment');
    }

    return response.data.data;
  } catch (err: any) {
    logger.error('createPaymentOrder failed', err);
    const status = err?.response?.status;
    if (status === 409) {
      const e = new Error('This booking has already been paid for.');
      (e as any).code = 'ALREADY_PAID';
      throw e;
    }
    throw new Error('Failed to initiate payment. Please try again.');
  }
}

/**
 * Verifies Razorpay payment signatures and marks booking status on the backend.
 *
 * @param params - Contains bookingId, Razorpay payment ID, order ID, and signature.
 * @returns A promise that resolves to the updated BackendBooking details.
 * @throws An error with warning message on verification failure.
 */
export async function verifyPayment(params: {
  bookingId: string;
  rzpPaymentId: string;
  rzpOrderId: string;
  rzpSignature: string;
}): Promise<BackendBooking> {
  try {
    const response = await api.post<{ success: boolean; data: BackendBooking }>(
      '/bookings/payment/verify',
      params
    );

    if (!response.data || !response.data.success) {
      throw new Error('Payment verification response indicated failure');
    }

    return response.data.data;
  } catch (err: any) {
    logger.error('verifyPayment failed', err);
    if (err?.response?.status === 410) {
      const e = new Error(
        'Your payment session expired. If your card was charged, please contact support@sacredconnect.in'
      );
      (e as any).code = 'PAYMENT_SESSION_EXPIRED';
      throw e;
    }
    throw new Error('Payment verification failed. Contact support if amount was deducted.');
  }
}

