/**
 * Service layer for the /api/metadata endpoints.
 * API calls never live inside components — always in services/ layer.
 */

import api from '@/api/index';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A ceremony category returned by the backend GET /api/metadata/categories.
 * Maps to the CeremonyCategory mongoose model.
 */
export interface Ceremony {
  /** MongoDB ObjectId string. */
  _id: string;
  /** Display name of the ceremony (e.g. "Griha Pravesh"). */
  name: string;
  /** Ionicons icon name string. */
  icon?: string;
  /** Hex colour associated with the category. */
  color?: string;
  /** Optional description of the ceremony. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Fetches all active ceremony categories from the backend.
 *
 * @returns Array of Ceremony objects.
 * @throws Error with mapped error message on failure.
 */
export async function fetchCeremonies(): Promise<Ceremony[]> {
  try {
    const response = await api.get<{ ceremonies: Ceremony[] }>('/ceremonies?limit=100');
    return response.data?.ceremonies ?? [];
  } catch (err) {
    logger.error('fetchCeremonies failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}
