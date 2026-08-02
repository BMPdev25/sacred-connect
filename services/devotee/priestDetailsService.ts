/*priestDetailsService.ts */
import api from '@/api/index';
import { PublicPriestProfile, ReviewsPage } from '@/types/priestDetails.types';
import { logger } from '@/utils/logger';

/**
 * Fetch full public profile details of a priest.
 *
 * @param priestProfileId - Unique identifier of the priest's profile document.
 * @returns Mapped PublicPriestProfile data.
 * @throws Error with user-friendly error message if profile not found (404) or network request fails.
 */
export async function fetchPriestProfile(priestProfileId: string): Promise<PublicPriestProfile> {
  try {
    const response = await api.get<{ success: boolean; data: PublicPriestProfile }>(
      `/priest/public/${priestProfileId}`
    );
    if (!response.data || !response.data.success) {
      throw new Error('No profile data returned');
    }
    return response.data.data;
  } catch (err: any) {
    logger.warn(`fetchPriestProfile failed for ID ${priestProfileId}, trying User ID resolution fallback...`);
    if (err?.response?.status === 404) {
      try {
        const resolveRes = await api.get<any>(`/devotee/priests/${priestProfileId}`);
        const resolvedId = resolveRes.data?._id;
        if (resolvedId && resolvedId !== priestProfileId) {
          logger.log(`Resolved User ID ${priestProfileId} to PriestProfile ID ${resolvedId}`);
          const secondResponse = await api.get<{ success: boolean; data: PublicPriestProfile }>(
            `/priest/public/${resolvedId}`
          );
          if (secondResponse.data?.success && secondResponse.data.data) {
            return secondResponse.data.data;
          }
        }
      } catch (fallbackErr) {
        logger.error(`Fallback profile resolution failed for ID ${priestProfileId}`, fallbackErr);
      }
      throw new Error("This pandit's profile is no longer available");
    }
    throw new Error("Unable to load profile. Please try again.");
  }
}

/**
 * Fetch paginated reviews left by devotees for a specific priest.
 *
 * @param priestProfileId - Unique identifier of the priest's profile document.
 * @param page - Target page index (defaults to 1).
 * @param limit - Page size limit (defaults to 5).
 * @returns ReviewsPage containing lists of reviews and pagination metadata.
 */
export async function fetchPriestReviews(
  priestProfileId: string,
  page: number = 1,
  limit: number = 5
): Promise<ReviewsPage> {
  try {
    const response = await api.get<{ success: boolean; data: ReviewsPage }>(
      `/priest/public/${priestProfileId}/reviews`,
      { params: { page, limit } }
    );
    if (!response.data || !response.data.success) {
      return {
        reviews: [],
        pagination: { total: 0, page, limit, hasMore: false },
      };
    }
    return response.data.data;
  } catch (err) {
    logger.warn(`fetchPriestReviews failed silently for ID ${priestProfileId}`, err);
    return {
      reviews: [],
      pagination: { total: 0, page, limit, hasMore: false },
    };
  }
}
