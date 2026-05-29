import { AvailabilitySlot, PriestReview, PublicPriestProfile, RatingBreakdown } from '@/types/priestDetails.types';

/**
 * Format durationMinutes into a human-readable string.
 *
 * @param minutes - Duration in minutes.
 * @returns Mapped user-friendly duration string.
 */
export function formatDuration(minutes: number): string {
  if (minutes === 30) return "30 min";
  if (minutes === 60) return "1 Hour";
  if (minutes === 90) return "1.5 Hours";
  if (minutes === 120) return "2 Hours";
  const hours = minutes / 60;
  return `${hours.toFixed(1)} Hours`;
}

/**
 * Get the minimum price across all services offered by a priest.
 *
 * @param services - Array of priest services.
 * @returns Minimum starting price (INR) or 0 if services is empty.
 */
export function getStartingPrice(services: PublicPriestProfile['services']): number {
  if (!services || services.length === 0) {
    return 0;
  }
  return Math.min(...services.map((s) => s.price));
}

/**
 * Calculate rating breakdown percentages (5★ to 1★).
 *
 * @param reviews - Mapped array of reviews.
 * @param totalRating - Aggregate rating details containing average and count.
 * @returns Array of 5 RatingBreakdown items ordered 5★ to 1★.
 */
export function calculateRatingBreakdown(
  reviews: PriestReview[],
  totalRating: { average: number; count: number }
): RatingBreakdown[] {
  const totalCount = totalRating.count > 0 ? totalRating.count : reviews.length;
  const breakdown: RatingBreakdown[] = [];

  for (let stars = 5; stars >= 1; stars--) {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    breakdown.push({
      stars: stars as 5 | 4 | 3 | 2 | 1,
      count,
      percentage,
    });
  }

  return breakdown;
}

/**
 * Helper to convert "HH:MM" 24h format into "h:MM AM/PM" format.
 * E.g. "09:00" -> "9:00 AM", "17:00" -> "5:00 PM".
 *
 * @param timeStr - Raw time string in "HH:MM" format.
 * @returns Formatted AM/PM string.
 */
function format12Hour(timeStr: string): string {
  const clean = timeStr.trim();
  const parts = clean.split(':');
  if (parts.length < 2) return clean;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) {
    return clean;
  }
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Formats a single 24-hour time range string into AM/PM format en-dash representation.
 * E.g. "09:00-17:00" -> "9:00 AM – 5:00 PM"
 *
 * @param slotStr - Raw slot range, e.g. "09:00-17:00".
 * @returns Human-friendly en-dash slot range or the original string if unexpected format.
 */
function formatTimeRange(slotStr: string): string | null {
  if (!slotStr) return null;
  const parts = slotStr.split('-');
  if (parts.length !== 2) {
    return slotStr;
  }
  return `${format12Hour(parts[0])} – ${format12Hour(parts[1])}`;
}

/**
 * Parse weekly schedule into upcoming available slots.
 * Checks the next 7 days starting from today and retrieves the first 3 active slots.
 *
 * @param weeklySchedule - Record containing day-of-week slots map.
 * @returns Array of up to 3 AvailabilitySlots.
 */
export function parseAvailabilitySlots(
  weeklySchedule: Record<string, string[]>
): AvailabilitySlot[] {
  if (!weeklySchedule) return [];
  
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const slots: AvailabilitySlot[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = daysOfWeek[date.getDay()];
    const dayEntries = weeklySchedule[dayName];

    if (dayEntries && dayEntries.length > 0) {
      const timeRange = formatTimeRange(dayEntries[0]);
      const dateStr = `${weekdaysShort[date.getDay()]} ${date.getDate()} ${monthsShort[date.getMonth()]}`;
      const label = i === 0 ? 'Today' : i === 1 ? `Tomorrow, ${dateStr}` : dateStr;
      
      slots.push({
        label,
        timeRange,
        isAvailableToday: label === 'Today',
      });

      if (slots.length === 3) {
        break;
      }
    }
  }

  return slots;
}

/**
 * Format relative time for review dates.
 * E.g. "Today", "Yesterday", "3 days ago", "2 weeks ago" or fallback date "30 May 2026".
 *
 * @param timestamp - ISO/standard date timestamp string.
 * @returns Human-friendly relative or formatted date string.
 */
export function formatReviewDate(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) {
    return 'Just now';
  }
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    return "Today";
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffDays < 30) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  const day = date.getDate();
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthsShort[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
