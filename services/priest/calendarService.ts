import api from '@/api/index';
  import { THEME } from '@/constants/theme';
  import { logger } from '@/utils/logger';
  import { CalendarBooking, MarkedDatesMap } from '@/types/priest.calendar.types';

  /**
   * Safe mapping from raw booking API payload to CalendarBooking type.
   *
   * @param booking - Raw booking item from API response.
   * @returns Mapped CalendarBooking instance.
   */
  function mapToCalendarBooking(booking: any): CalendarBooking {
    let defaultDate = '';
    if (booking.date) {
      try {
        defaultDate = new Date(booking.date).toISOString().split('T')[0];
      } catch {
        defaultDate = booking.date.split('T')[0] || '';
      }
    }
    return {
      _id: booking._id,
      ceremonyType: booking.ceremonyType || '',
      date: defaultDate,
      startTime: booking.startTime || '',
      endTime: booking.endTime || '',
      status: booking.status || '',
      devoteeId: {
        _id: booking.devoteeId?._id || booking.devoteeId || '',
        name: booking.devoteeId?.name || 'Devotee',
        profilePicture: booking.devoteeId?.profilePicture,
        phone: booking.devoteeId?.phone,
        createdAt: booking.devoteeId?.createdAt,
      },
      basePrice: booking.basePrice || 0,
      location: {
        address: booking.location?.address || '',
      },
      paymentDetails: booking.paymentDetails ? {
        receiptNumber: booking.paymentDetails.receiptNumber,
      } : undefined,
    };
  }

  /**
   * Helper to format a Date object or use current date to local YYYY-MM-DD.
   *
   * @returns Local YYYY-MM-DD date string.
   */
  function getLocalDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Fetches all confirmed bookings for building the priest's calendar schedule.
   *
   * @returns A promise resolving to an array of confirmed bookings.
   */
  export async function fetchCalendarBookings(): Promise<CalendarBooking[]> {
    try {
      const response = await api.get('/priest/bookings?status=confirmed&limit=100');
      const data = response.data?.data?.all || response.data?.data || response.data || [];
      const bookings = Array.isArray(data) ? data : [];
      return bookings.map(mapToCalendarBooking);
    } catch (err) {
      logger.error('Failed to fetch calendar bookings', err);
      return [];
    }
  }

  /**
   * Pure utility to assemble a MarkedDatesMap configuration for react-native-calendars.
   *
   * @param bookings - Current confirmed calendar bookings.
   * @param selectedDate - Currently highlighted calendar date string (YYYY-MM-DD).
   * @returns MarkedDatesMap configuration mapping dates to styling options.
   */
  export function buildMarkedDates(
    bookings: CalendarBooking[],
    selectedDate: string
  ): MarkedDatesMap {
    const marked: MarkedDatesMap = {};

    bookings.forEach((booking) => {
      const date = booking.date;
      if (!date) return;

      if (!marked[date]) {
        marked[date] = {
          dots: [{ color: THEME.colors.primary }],
        };
      } else {
        const existingDots = marked[date].dots || [];
        marked[date] = {
          ...marked[date],
          dots: [...existingDots, { color: THEME.colors.primary }],
        };
      }
    });

    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: THEME.colors.primary,
    };

    const todayStr = getLocalDateString();
    if (todayStr !== selectedDate) {
      marked[todayStr] = {
        ...marked[todayStr],
        today: true,
      };
    }

    return marked;
  }

  /**
   * Signals the backend to mark a specific booking as completed.
   * Attempting priest routes first, with fallback to standard booking completion endpoint.
   *
   * @param bookingId - Unique identifier of the booking.
   * @returns A promise resolving when success is confirmed.
   */
  export async function markBookingComplete(bookingId: string): Promise<void> {
    try {
      await api.post(`/bookings/${bookingId}/complete`, {});
    } catch (err: any) {
      logger.warn('Failed completing via standard endpoint, trying priest path', err);
      try {
        await api.post(`/priest/bookings/${bookingId}/complete`, {});
      } catch (fallbackErr: any) {
        logger.error('Failed completing via priest endpoint', fallbackErr);
        const errMsg = fallbackErr?.response?.data?.message || fallbackErr?.response?.data?.error || fallbackErr.message;
        throw new Error(errMsg || 'Failed to mark the booking as completed.');
      }
    }
  }

  /**
   * Fetches detailed data for a specific booking from the backend.
   *
   * @param bookingId - Unique identifier of the booking.
   * @returns A promise resolving to the booking data object.
   */
  export async function fetchBookingDetail(bookingId: string): Promise<any> {
    try {
      const response = await api.get(`/priest/bookings/${bookingId}`);
      return response.data?.data || response.data;
    } catch (err) {
      logger.error(`Failed to fetch booking detail for ID: ${bookingId}`, err);
      throw err;
    }
  }

  /**
   * Fetches the currently authenticated priest's profile from the backend.
   *
   * @returns A promise resolving to the priest's profile details.
   */
  export async function fetchPriestProfile(): Promise<any> {
    try {
      const response = await api.get('/priest/profile');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch priest profile', err);
      throw err;
    }
  }

  /**
   * Updates the currently authenticated priest's profile data.
   *
   * @param updates - Partial fields to update on the priest profile.
   * @returns A promise resolving to the updated profile details.
   */
  export async function updatePriestProfile(updates: Record<string, any>): Promise<any> {
    try {
      const response = await api.put('/priest/profile', updates);
      return response.data;
    } catch (err) {
      logger.error('Failed to update priest profile', err);
      throw err;
    }
  }

  /**
   * Exported CalendarService containing all calendar operations.
   */
  export const CalendarService = {
    fetchCalendarBookings,
    buildMarkedDates,
    markBookingComplete,
    fetchBookingDetail,
    fetchPriestProfile,
    updatePriestProfile,
  };
