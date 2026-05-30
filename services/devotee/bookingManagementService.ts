import api from '@/api/index';
import { BookingListItem, BookingListResponse } from '@/types/bookingManagement.types';
import { logger } from '@/utils/logger';

/**
 * Fetch upcoming bookings (pending + confirmed) for the logged-in devotee.
 *
 * @param page - The page number to fetch.
 * @returns A promise resolving to the list of bookings and pagination status.
 */
export async function fetchUpcomingBookings(
  page: number = 1
): Promise<{ bookings: BookingListItem[]; hasMore: boolean }> {
  try {
    const params = new URLSearchParams();
    params.append('status', 'pending');
    params.append('status', 'confirmed');
    params.append('page', page.toString());
    params.append('limit', '10');

    const response = await api.get<BookingListResponse>(`/bookings?${params.toString()}`);

    return {
      bookings: response.data.data.all || [],
      hasMore: response.data.pagination?.hasMore || false,
    };
  } catch (error) {
    logger.error('fetchUpcomingBookings failed', error);
    return { bookings: [], hasMore: false };
  }
}

/**
 * Fetch past bookings (completed + cancelled + rejected) for the logged-in devotee.
 *
 * @param page - The page number to fetch.
 * @returns A promise resolving to the list of bookings and pagination status.
 */
export async function fetchPastBookings(
  page: number = 1
): Promise<{ bookings: BookingListItem[]; hasMore: boolean }> {
  try {
    const params = new URLSearchParams();
    params.append('status', 'completed');
    params.append('status', 'cancelled');
    params.append('status', 'rejected');
    params.append('page', page.toString());
    params.append('limit', '10');

    const response = await api.get<BookingListResponse>(`/bookings?${params.toString()}`);

    return {
      bookings: response.data.data.all || [],
      hasMore: response.data.pagination?.hasMore || false,
    };
  } catch (error) {
    logger.error('fetchPastBookings failed', error);
    return { bookings: [], hasMore: false };
  }
}

/**
 * Cancel a booking by the devotee.
 *
 * @param bookingId - The ID of the booking to cancel.
 * @param reason - The optional reason for cancellation.
 * @returns A promise resolving when cancellation is successful.
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<void> {
  try {
    await api.put(`/bookings/${bookingId}/cancel-devotee`, {
      reason: reason ?? 'Cancelled by devotee',
    });
  } catch (error: any) {
    logger.error('cancelBooking failed', error);
    const status = error?.response?.status;
    if (status === 400 || status === 404) {
      throw new Error('Booking cannot be cancelled');
    }
    const errMsg = error?.response?.data?.message || error?.response?.data?.error;
    throw new Error(errMsg || 'Failed to cancel booking');
  }
}

/**
 * Fetch detailed information for a specific booking.
 *
 * @param bookingId - The ID of the booking to fetch.
 * @returns A promise resolving to the booking details.
 */
export async function fetchBookingDetails(bookingId: string): Promise<BookingListItem> {
  try {
    const response = await api.get<{ success: boolean; data: BookingListItem }>(`/bookings/${bookingId}`);
    return response.data.data;
  } catch (error: any) {
    logger.error('fetchBookingDetails failed', error);
    const errMsg = error?.response?.data?.message || error?.response?.data?.error;
    throw new Error(errMsg || 'Failed to fetch booking details');
  }
}
