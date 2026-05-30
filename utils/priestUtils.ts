import { BOOKING_REQUEST_EXPIRY_HOURS } from '@/constants/config';
import { formatTime12Hour } from './bookingUtils';

// Re-export formatTime12Hour from bookingUtils
export { formatTime12Hour };

/**
 * Utility functions specific to priest business logic and onboarding.
 */

/**
 * Determines if a priest has completed onboarding.
 * Uses verificationStatus as fallback for priests created
 * before the onboardingCompleted field existed.
 *
 * @param onboardingCompleted - Flag representing whether the priest completed wizard steps.
 * @param verificationStatus - The registration verification status from the profile.
 * @returns True if onboarding is complete or profile was submitted, otherwise false.
 */
export function hasPriestCompletedOnboarding(
  onboardingCompleted: boolean | undefined,
  verificationStatus: string | undefined
): boolean {
  if (onboardingCompleted === true) return true;
  const submittedStatuses = ['pending', 'approved', 'rejected'];
  if (verificationStatus && submittedStatuses.includes(verificationStatus)) {
    return true;
  }
  return false;
}

/**
 * Formats a creation timestamp as a relative time string (e.g., "5 mins ago", "Just now").
 *
 * @param dateStr - The ISO date string representing creation time.
 * @returns The formatted relative time string.
 */
export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Calculates and formats the remaining time until a booking request expires.
 *
 * @param createdAt - The creation timestamp of the booking request.
 * @returns Expiry status or remaining time description.
 */
export function formatRequestExpiry(createdAt: string): string {
  if (!createdAt) return 'Expired';
  const time = new Date(createdAt).getTime();
  if (isNaN(time)) return 'Expired';

  const expiresAt = time + BOOKING_REQUEST_EXPIRY_HOURS * 60 * 60 * 1000;
  const remaining = expiresAt - Date.now();

  if (remaining <= 0) return 'Expired';

  const hoursLeft = Math.floor(remaining / (60 * 60 * 1000));
  const minsLeft = Math.floor((remaining % (60 * 60 * 1000)) / 60000);

  if (hoursLeft > 0) {
    return `Expires in ${hoursLeft} hr${hoursLeft > 1 ? 's' : ''}`;
  }
  return `Expires in ${minsLeft} min${minsLeft > 1 ? 's' : ''}`;
}

/**
 * Checks if a devotee is a first-time user (registered within the last 90 days).
 *
 * @param devoteeCreatedAt - Creation date timestamp of the devotee.
 * @returns True if the devotee joined within 90 days, false otherwise.
 */
export function isFirstTimeDevotee(devoteeCreatedAt: string): boolean {
  if (!devoteeCreatedAt) return false;
  const time = new Date(devoteeCreatedAt).getTime();
  if (isNaN(time)) return false;

  const daysSinceJoined = (Date.now() - time) / (1000 * 60 * 60 * 24);
  return daysSinceJoined <= 90;
}

/**
 * Extracts the city name from a full comma-separated address string.
 *
 * @param fullAddress - The full address string.
 * @returns The extracted city name or fallback slice of the address.
 */
export function extractCity(fullAddress: string): string {
  if (!fullAddress) return '';
  const parts = fullAddress.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return fullAddress.slice(0, 20).trim();
}
