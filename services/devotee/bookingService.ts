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
      payload
    );

    if (!response.data || !response.data.success) {
      throw new Error('Failed to create booking on backend');
    }

    return response.data.data;
  } catch (err: any) {
    logger.error('createBooking failed', err);
    if (err?.response?.status === 429) {
      throw new Error('Too many booking attempts. Please try again in a few minutes.');
    }
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to create booking.');
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
    throw new Error('Payment verification failed. Contact support if amount was deducted.');
  }
}

/**
 * Fetches booking details from the backend.
 *
 * @param bookingId - The identifier of the booking record to retrieve.
 * @returns A promise that resolves to the retrieved BackendBooking details.
 * @throws An error if request fails or record is not found.
 */
export async function fetchBookingDetails(bookingId: string): Promise<BackendBooking> {
  try {
    const response = await api.get<{ success: boolean; data: BackendBooking }>(
      `/bookings/${bookingId}`
    );

    if (!response.data || !response.data.success) {
      throw new Error('Failed to retrieve booking details');
    }

    return response.data.data;
  } catch (err: any) {
    logger.error('fetchBookingDetails failed', err);
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to fetch booking details.');
  }
}
