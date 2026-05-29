import { TimeSlot } from '@/types/booking.types';

// ---------------------------------------------------------------------------
// Time Utilities
// ---------------------------------------------------------------------------

/**
 * Parses a "HH:MM" 24-hour time string, adds specified minutes to it, and wraps around midnight.
 *
 * @param time - The base time in "HH:MM" 24-hour format.
 * @param minutes - The number of minutes to add.
 * @returns The resulting time in "HH:MM" 24-hour format.
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(newHours)}:${pad(newMins)}`;
}

/**
 * Formats a 24-hour "HH:MM" time string into a 12-hour AM/PM display label.
 *
 * @param time - The 24-hour time string, e.g., "14:30".
 * @returns The formatted 12-hour string, e.g., "2:30 PM".
 */
export function formatTime12Hour(time: string): string {
  const [hoursStr, minsStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minsStr} ${ampm}`;
}

/**
 * Determines whether a specific time slot start is in the past relative to the current local time.
 * Only checks when the booking date is today's local date.
 *
 * @param slotTime - The slot starting time in "HH:MM" 24-hour format.
 * @param date - The booking date in "YYYY-MM-DD" format.
 * @returns True if the slot has already passed, false otherwise.
 */
export function isSlotInPast(slotTime: string, date: string): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (date !== todayStr) {
    return false;
  }

  const nowHours = now.getHours();
  const nowMins = now.getMinutes();
  const [slotHours, slotMins] = slotTime.split(':').map(Number);

  if (slotHours < nowHours) return true;
  if (slotHours === nowHours && slotMins < nowMins) return true;
  return false;
}

/**
 * Generates an array of selectable time slots based on daily start and end bounds,
 * ceremony duration, and booking date.
 *
 * @param startTime - The starting hour bound of availability, e.g. "08:00".
 * @param endTime - The ending hour bound of availability, e.g. "18:00".
 * @param durationMinutes - The length of the ceremony in minutes.
 * @param selectedDate - The booking date in "YYYY-MM-DD" format.
 * @returns An array of TimeSlot structures.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  selectedDate: string
): TimeSlot[] {
  const intervalMinutes = 30;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots: TimeSlot[] = [];
  const maxStart = endTotal - durationMinutes;

  for (let current = startTotal; current <= maxStart; current += intervalMinutes) {
    const startHrs = Math.floor(current / 60) % 24;
    const startMins = current % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    const startStr = `${pad(startHrs)}:${pad(startMins)}`;
    const endStr = addMinutesToTime(startStr, durationMinutes);

    slots.push({
      startTime: startStr,
      endTime: endStr,
      displayLabel: formatTime12Hour(startStr),
      isPast: isSlotInPast(startStr, selectedDate),
    });
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Schedule & Date Parsing
// ---------------------------------------------------------------------------

/**
 * Parses a day's schedule from a weekly schedule mapping.
 * Handles both ["HH:MM", "HH:MM"] and ["HH:MM-HH:MM"] formats.
 *
 * @param weeklySchedule - The schedule object from the backend priest profile.
 * @param dayName - The lowercase name of the day of the week, e.g., "monday".
 * @returns The start and end time bounds, or null if the day is unavailable.
 */
export function parseDaySchedule(
  weeklySchedule: Record<string, string[]>,
  dayName: string
): { startTime: string; endTime: string } | null {
  if (!weeklySchedule) return null;
  const daySchedule = weeklySchedule[dayName.toLowerCase()];
  if (!daySchedule || !Array.isArray(daySchedule) || daySchedule.length === 0) {
    return null;
  }

  // Handle single-string format: ["08:00-18:00"]
  if (daySchedule.length === 1 && typeof daySchedule[0] === 'string' && daySchedule[0].includes('-')) {
    const [start, end] = daySchedule[0].split('-');
    if (start && end) {
      return { startTime: start.trim(), endTime: end.trim() };
    }
  }

  // Handle two-string format: ["08:00", "18:00"]
  if (daySchedule.length >= 2 && typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
    return { startTime: daySchedule[0].trim(), endTime: daySchedule[1].trim() };
  }

  return null;
}

/**
 * Converts a YYYY-MM-DD date string into the lowercase name of its day of the week.
 *
 * @param dateString - The date string, e.g., "2026-06-03".
 * @returns Lowercase day name, e.g., "wednesday".
 */
export function getDayName(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Formats a YYYY-MM-DD date string into a user-friendly display date.
 *
 * @param dateString - The date string, e.g., "2026-06-03".
 * @returns Mapped display date, e.g., "Wednesday, 3 June 2026".
 */
export function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${days[date.getDay()]}, ${day} ${months[date.getMonth()]} ${year}`;
}

// ---------------------------------------------------------------------------
// Booking Reference Formatter
// ---------------------------------------------------------------------------

/**
 * Generates a formatted reference string for a confirmed booking.
 *
 * @param receiptNumber - Optional receipt identifier from payment processor.
 * @param bookingId - The unique backend booking ID.
 * @param date - The booking date in YYYY-MM-DD format.
 * @returns Formatted booking reference string, e.g., "SC-20260603-4A8B".
 */
export function formatBookingReference(
  receiptNumber: string | undefined,
  bookingId: string,
  date: string
): string {
  if (receiptNumber) {
    return `SC-${receiptNumber}`;
  }
  const formattedDate = date.replace(/-/g, '');
  const lastFour = bookingId.slice(-4).toUpperCase();
  return `SC-${formattedDate}-${lastFour}`;
}
