import api from '@/api/index';
import { RatingSubmission, ExistingRating } from '@/types/bookingManagement.types';
import { logger } from '@/utils/logger';

/**
 * Submit a new priest rating and review for a booking.
 *
 * @param data - The rating submission payload.
 * @returns A promise resolving when submission is successful.
 * @throws An error on conflict (409) or other backend failures.
 */
export async function submitRating(data: RatingSubmission): Promise<void> {
  try {
    await api.post('/ratings', data);
  } catch (error: any) {
    logger.error('submitRating failed', error);
    if (error?.response?.status === 409) {
      throw new Error("You've already reviewed this booking");
    }
    const errMsg = error?.response?.data?.message || error?.response?.data?.error;
    throw new Error(errMsg || 'Failed to submit review');
  }
}

/**
 * Check if a booking has already been rated and retrieve the rating if it exists.
 *
 * @param bookingId - The booking ID to check.
 * @returns The existing rating if found, or null otherwise.
 */
export async function checkExistingRating(bookingId: string): Promise<ExistingRating | null> {
  try {
    const response = await api.get<{ success: boolean; data: ExistingRating | null }>(
      `/ratings/booking/${bookingId}`
    );
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    logger.error('checkExistingRating failed', error);
    return null;
  }
}
