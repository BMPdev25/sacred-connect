import api from '@/api/index';
import { DashboardStats, PriestOnlineStatus, TodayBooking } from '@/types/priest.dashboard.types';
import { logger } from '@/utils/logger';
import { normalizeProfilePicture } from '@/utils/imageUtils';

/**
 * Checks if a given date string corresponds to today's local date.
 *
 * @param dateStr - The date string to check (ISO or YYYY-MM-DD).
 * @returns True if the date matches today's date, false otherwise.
 */
export function isToday(dateStr: string): boolean {
  try {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  } catch (err) {
    logger.error('Failed to parse date string in isToday', err);
    return false;
  }
}

/**
 * Fetches the current priest's profile and returns their online availability status.
 *
 * @returns A promise resolving to the PriestOnlineStatus.
 */
export async function fetchPriestStatus(): Promise<PriestOnlineStatus> {
  try {
    const response = await api.get('/priest/profile');
    return response.data?.currentAvailability?.status || 'offline';
  } catch (err) {
    logger.error('fetchPriestStatus failed, defaulting to offline', err);
    return 'offline';
  }
}

/**
 * Toggles the online/offline status of the priest on the backend.
 *
 * @param targetStatus - The status to set ('available' or 'offline').
 * @returns A promise resolving to the updated PriestOnlineStatus.
 */
export async function toggleOnlineStatus(
  targetStatus: 'available' | 'offline'
): Promise<PriestOnlineStatus> {
  try {
    const response = await api.put('/priest/status', { status: targetStatus });
    if (response.data?.success && response.data?.data?.currentAvailability?.status) {
      return response.data.data.currentAvailability.status;
    }
    return response.data?.status || targetStatus;
  } catch (err) {
    logger.error('toggleOnlineStatus failed', err);
    throw new Error('Failed to update status. Check your connection and try again.');
  }
}

/**
 * Helper to sort bookings by their start time ascending.
 *
 * @param a - First booking.
 * @param b - Second booking.
 * @returns Sort indicator number.
 */
function sortBookingsByStartTime(a: TodayBooking, b: TodayBooking): number {
  return a.startTime.localeCompare(b.startTime);
}

/**
 * Fetches today's confirmed bookings for the priest.
 *
 * @returns A promise resolving to an array of TodayBooking.
 */
export async function fetchTodayBookings(): Promise<TodayBooking[]> {
  try {
    const response = await api.get('/priest/bookings?status=confirmed');
    // Mongoose response may wrap the bookings array in data or success format
    const bookingsList: any[] = response.data?.data?.all || response.data?.data || response.data || [];
    
    const todayBookings: TodayBooking[] = bookingsList
      .filter((booking: any) => booking && booking.date && isToday(booking.date))
      .map((booking: any) => ({
        _id: booking._id,
        ceremonyType: booking.ceremonyType,
        startTime: booking.startTime,
        endTime: booking.endTime,
        date: new Date(booking.date).toISOString().split('T')[0],
        status: booking.status,
        devoteeId: {
          _id: booking.devoteeId?._id || booking.devoteeId,
          name: booking.devoteeId?.name || 'Devotee',
          profilePicture: normalizeProfilePicture(booking.devoteeId?.profilePicture),
        },
      }));

    return todayBookings.sort(sortBookingsByStartTime);
  } catch (err) {
    logger.error('fetchTodayBookings failed', err);
    return [];
  }
}

/**
 * Fetches earnings statistics and ratings for the priest.
 *
 * @returns A promise resolving to the DashboardStats.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await api.get('/priest/earnings');
    const data = response.data?.data || response.data || {};
    
    return {
      thisMonth: data.earnings?.thisMonth ?? 0,
      totalBookings: data.ceremonyCount ?? 0,
      rating: data.ratings?.average ?? 0,
      pendingPayout: data.earnings?.pendingPayments ?? 0,
    };
  } catch (err) {
    logger.error('fetchDashboardStats failed', err);
    return {
      thisMonth: 0,
      totalBookings: 0,
      rating: 0,
      pendingPayout: 0,
    };
  }
}

/**
 * Service package containing all priest dashboard API endpoints.
 */
export const PriestDashboardService = {
  isToday,
  fetchPriestStatus,
  toggleOnlineStatus,
  fetchTodayBookings,
  fetchDashboardStats,
};
