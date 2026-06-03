import api from '@/api/index';
import { BookingRequest, BookingRequestDetail } from '@/types/priest.dashboard.types';
import { logger } from '@/utils/logger';
import { extractCity } from '@/utils/priestUtils';
import { normalizeProfilePicture } from '@/utils/imageUtils';

/**
 * Helper to sort booking requests by their creation date descending (newest first).
 *
 * @param a - First request.
 * @param b - Second request.
 * @returns Sort indicator number.
 */
function sortRequestsByCreatedAtDesc(a: BookingRequest, b: BookingRequest): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Helper to map a raw API booking object to the BookingRequest frontend shape.
 *
 * @param booking - Raw booking object from the backend API.
 * @returns Formatted BookingRequest object.
 */
function mapToBookingRequest(booking: any): BookingRequest {
  const address = booking.location?.address || '';
  return {
    _id: booking._id,
    ceremonyType: booking.ceremonyType || '',
    date: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '',
    startTime: booking.startTime || '',
    endTime: booking.endTime || '',
    basePrice: booking.basePrice || 0,
    location: {
      address,
      city: extractCity(address),
    },
    devoteeId: {
      _id: booking.devoteeId?._id || booking.devoteeId || '',
      name: booking.devoteeId?.name || 'Devotee',
      profilePicture: normalizeProfilePicture(booking.devoteeId?.profilePicture),
      createdAt: booking.devoteeId?.createdAt || new Date().toISOString(),
    },
    status: booking.status || 'pending',
    createdAt: booking.createdAt || new Date().toISOString(),
  };
}

/**
 * Calculates duration in minutes from startTime and endTime.
 *
 * @param startTime - The starting time in "HH:MM" format.
 * @param endTime - The ending time in "HH:MM" format.
 * @returns The duration in minutes.
 */
function calculateDurationMinutes(startTime: string, endTime: string): number {
  try {
    if (!startTime || !endTime) return 0;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    return (eH * 60 + eM) - (sH * 60 + sM);
  } catch (err) {
    logger.error('Failed to calculate duration minutes', err);
    return 0;
  }
}

/**
 * Fetches all pending booking requests for the priest.
 *
 * @returns A promise resolving to an array of BookingRequest objects sorted by creation date descending.
 */
export async function fetchPendingRequests(): Promise<BookingRequest[]> {
  try {
    const response = await api.get('/priest/bookings?status=pending');
    const rawList: any[] = response.data?.data?.all || response.data?.data || response.data || [];
    
    const mappedRequests = rawList.map(mapToBookingRequest);
    return mappedRequests.sort(sortRequestsByCreatedAtDesc);
  } catch (err) {
    logger.error('fetchPendingRequests failed', err);
    return [];
  }
}

/**
 * Fetches the full details of a specific booking request.
 *
 * @param bookingId - Unique identifier of the booking.
 * @returns A promise resolving to the BookingRequestDetail object.
 */
export async function fetchRequestDetail(bookingId: string): Promise<BookingRequestDetail> {
  try {
    const response = await api.get(`/priest/bookings/${bookingId}`);
    const rawBooking = response.data?.data || response.data || {};
    
    const basicRequest = mapToBookingRequest(rawBooking);
    const duration = rawBooking.durationMinutes || 
      calculateDurationMinutes(basicRequest.startTime, basicRequest.endTime);

    return {
      ...basicRequest,
      durationMinutes: duration,
      distance: rawBooking.distance,
    };
  } catch (err) {
    logger.error('fetchRequestDetail failed', err);
    throw new Error('Unable to load request details.');
  }
}

/**
 * Accepts a pending booking request by changing its status to confirmed.
 *
 * @param bookingId - Unique identifier of the booking.
 * @returns A promise resolving when acceptance is successful.
 */
export async function acceptRequest(bookingId: string): Promise<void> {
  try {
    await api.put(`/priest/bookings/${bookingId}/status`, { status: 'confirmed' });
  } catch (err: any) {
    logger.error('acceptRequest failed', err);
    const status = err?.response?.status;
    if (status === 404) {
      throw new Error('This request is no longer available.');
    }
    if (status === 409) {
      throw new Error(
        'You already have a confirmed booking at this time. Please check your schedule before accepting.'
      );
    }
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to accept booking request.');
  }
}

/**
 * Declines a pending booking request with an optional reason.
 *
 * @param bookingId - Unique identifier of the booking.
 * @param reason - Optional cancellation reason.
 * @returns A promise resolving when declining is successful.
 */
export async function declineRequest(bookingId: string, reason?: string): Promise<void> {
  try {
    await api.put(`/priest/bookings/${bookingId}/status`, {
      status: 'cancelled',
      reason: reason || 'Declined by priest',
    });
  } catch (err) {
    logger.error('declineRequest failed', err);
    throw new Error('Failed to decline. Please try again.');
  }
}

/**
 * Service package containing all priest booking request actions.
 */
export const PriestRequestsService = {
  fetchPendingRequests,
  fetchRequestDetail,
  acceptRequest,
  declineRequest,
};
