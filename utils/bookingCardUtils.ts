import { BookingListItem, BookingStatus, BookingCardDisplay } from '@/types/bookingManagement.types';
import { formatDisplayDate, formatTime12Hour, formatBookingReference } from '@/utils/bookingUtils';

const DISPLAY_MAP: Record<BookingStatus, BookingCardDisplay> = {
  pending: {
    badgeLabel: 'Awaiting Confirmation',
    badgeBackground: '#FEF3C7',
    badgeTextColor: '#D97706',
    actionLabel: 'View Details →',
    actionVariant: 'outline',
  },
  confirmed: {
    badgeLabel: 'Confirmed',
    badgeBackground: '#DCFCE7',
    badgeTextColor: '#16A34A',
    actionLabel: 'View Details →',
    actionVariant: 'outline',
  },
  arrived: {
    badgeLabel: 'In Progress',
    badgeBackground: '#EDE9FE',
    badgeTextColor: '#7C3AED',
    actionLabel: 'View Details →',
    actionVariant: 'outline',
  },
  in_progress: {
    badgeLabel: 'In Progress',
    badgeBackground: '#EDE9FE',
    badgeTextColor: '#7C3AED',
    actionLabel: 'View Details →',
    actionVariant: 'outline',
  },
  completed: {
    badgeLabel: 'Completed',
    badgeBackground: '#F3F4F6',
    badgeTextColor: '#374151',
    actionLabel: 'Rate Now',
    actionVariant: 'outline',
  },
  cancelled: {
    badgeLabel: 'Cancelled',
    badgeBackground: '#FEE2E2',
    badgeTextColor: '#DC2626',
    actionLabel: 'Book Again',
    actionVariant: 'outline',
  },
  rejected: {
    badgeLabel: 'Declined',
    badgeBackground: '#FEE2E2',
    badgeTextColor: '#DC2626',
    actionLabel: 'Find Pandit',
    actionVariant: 'outline',
  },
};

/**
 * Get display properties for a booking card based on status.
 *
 * @param status - The lifecycle status of the booking.
 * @returns Display configurations for rendering card badges and buttons.
 */
export function getBookingCardDisplay(status: BookingStatus): BookingCardDisplay {
  return DISPLAY_MAP[status] ?? {
    badgeLabel: status,           // show raw status as fallback
    badgeBackground: '#F3F4F6',
    badgeTextColor: '#374151',
    actionLabel: 'View Details →',
    actionVariant: 'outline' as const
  };
}

/**
 * Check if a booking is in the upcoming category.
 *
 * @param status - The lifecycle status of the booking.
 * @returns True if booking is pending or confirmed, false otherwise.
 */
export function isUpcomingBooking(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

/**
 * Format booking date+time for card display.
 *
 * @param date - The booking date in "YYYY-MM-DD" format.
 * @param startTime - The booking start time in "HH:MM" format.
 * @returns The formatted date and time strings.
 */
export function formatBookingDateTime(
  date: string,
  startTime: string
): {
  dateDisplay: string; // "Wed, 3 June 2026"
  timeDisplay: string; // "10:00 AM"
} {
  const fullDate = formatDisplayDate(date);
  const commaIndex = fullDate.indexOf(',');
  let dateDisplay = fullDate;
  if (commaIndex !== -1) {
    const dayName = fullDate.substring(0, commaIndex);
    const shortDayName = dayName.substring(0, 3);
    const datePart = fullDate.substring(commaIndex + 1);
    dateDisplay = `${shortDayName},${datePart}`;
  }

  const timeDisplay = formatTime12Hour(startTime);

  return {
    dateDisplay,
    timeDisplay,
  };
}

/**
 * Generate booking reference from booking data.
 *
 * @param booking - The booking list item details.
 * @returns The formatted reference string.
 */
export function generateBookingRef(booking: BookingListItem): string {
  return formatBookingReference(
    booking.paymentDetails?.receiptNumber,
    booking._id,
    booking.date
  );
}
