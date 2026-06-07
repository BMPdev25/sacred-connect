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

/** Location payload for an instant booking. */
export interface InstantBookingLocation {
  /** Full street address. */
  address: string;
  /** City name. */
  city: string;
  /** Optional geographic coordinates. */
  coordinates?: { lat: number; lng: number };
}

/** Arguments for creating an instant booking. */
export interface CreateInstantBookingPayload {
  /** Ceremony id (instant bookings are keyed by ceremony, not priest). */
  ceremonyId: string;
  /** Booking date 'YYYY-MM-DD'. */
  date: string;
  /** Start time 'HH:MM'. */
  startTime: string;
  /** End time 'HH:MM'. */
  endTime: string;
  /** Ceremony location. */
  location: InstantBookingLocation;
  /** Optional preferred priest who gets a 3-min head-start. */
  preferredPriestId?: string | null;
}

/**
 * Creates an INSTANT booking (accept-then-pay flow).
 *
 * No priest is chosen and NO payment is taken now — the request is broadcast to
 * priests who perform the ceremony and returns a booking in 'searching' status.
 * The devotee pays only after a priest accepts (booking → 'pending').
 *
 * On a date outside the instant window the backend returns 400 with code
 * 'NOT_INSTANT_WINDOW'; the thrown error carries `.code` so callers can offer
 * to switch to scheduling.
 *
 * @param payload - Ceremony, date/time, location, and optional preferred priest.
 * @returns A promise resolving to the created BackendBooking (status 'searching').
 */
export async function createInstantBooking(
  payload: CreateInstantBookingPayload
): Promise<BackendBooking> {
  try {
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
    const code = err?.response?.data?.code;
    let message: string;
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
      message = 'Request timed out. Please check your connection and try again.';
    } else if (err?.response?.status === 429) {
      message = 'Too many booking attempts. Please try again in a few minutes.';
    } else {
      message = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to create instant booking.';
    }
    const wrapped: any = new Error(message);
    wrapped.code = code;
    wrapped.response = err?.response;
    throw wrapped;
  }
}

/**
 * Cancels an instant booking that is still searching for a priest.
 *
 * @param bookingId - The booking to cancel.
 */
export async function cancelInstantBooking(bookingId: string): Promise<void> {
  try {
    await api.put(`/bookings/${bookingId}/cancel-devotee`, {
      reason: 'Devotee cancelled while searching',
    });
  } catch (err: any) {
    logger.error('cancelInstantBooking failed', err);
    throw new Error(
      err?.response?.data?.message || err?.response?.data?.error || 'Failed to cancel the search.'
    );
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

