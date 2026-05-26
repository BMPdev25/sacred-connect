import api from '@/api/index';
import { ApiResponse } from '@/types/api.types';
import { Banner, CeremonyCategory, NearbyPriest, Festival, FestivalParsed } from '@/types/home.types';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Parses a festival date string in YYYY-MM-DD format and adjusts it to midnight IST.
 * Sets the time representation to UTC midnight + IST offset (5.5 hours).
 *
 * @param dateStr - Date string in "YYYY-MM-DD" format.
 * @returns Date object representing the festival date shifted by IST offset.
 */
export function parseFestivalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(utcDate.getTime() + istOffset);
}

/**
 * Checks if a festival date is in the future or is today (midnight IST onwards).
 *
 * @param festival - The festival entry to evaluate.
 * @returns True if the festival is today or upcoming, false otherwise.
 */
export function isUpcoming(festival: Festival): boolean {
  const parsedDate = parseFestivalDate(festival.date);
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = now.getTime() + istOffset;
  const istDate = new Date(istTime);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();

  const utcMidnight = Date.UTC(year, month, day, 0, 0, 0);
  const todayMidnight = new Date(utcMidnight + istOffset);

  return parsedDate.getTime() >= todayMidnight.getTime();
}

/**
 * Formats a raw festival entry by adding a parsed date and components.
 *
 * @param festival - The raw festival entry.
 * @returns Formatted and parsed festival object.
 */
export function formatFestivalForDisplay(festival: Festival): FestivalParsed {
  const date = parseFestivalDate(festival.date);
  const dayNumber = date.getDate().toString().padStart(2, '0');
  const monthShort = date
    .toLocaleString('en-IN', { month: 'short' })
    .toUpperCase();

  return {
    ...festival,
    parsedDate: date,
    dayNumber,
    monthShort,
  };
}

// ---------------------------------------------------------------------------
// Service Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetches all active promotional banners.
 *
 * @returns List of active Banner objects, or empty array on failure.
 */
export async function fetchBanners(): Promise<Banner[]> {
  try {
    const response = await api.get<Banner[]>('/metadata/banners');
    return response.data ?? [];
  } catch (err) {
    logger.error('fetchBanners failed', err);
    return [];
  }
}

/**
 * Fetches all active ceremony categories.
 *
 * @returns List of CeremonyCategory objects, or empty array on failure.
 */
export async function fetchCategories(): Promise<CeremonyCategory[]> {
  try {
    const response = await api.get<CeremonyCategory[]>('/metadata/categories');
    return response.data ?? [];
  } catch (err) {
    logger.error('fetchCategories failed', err);
    return [];
  }
}

/**
 * Fetches nearby priests based on latitude and longitude coordinates.
 *
 * @param latitude - User's latitude.
 * @param longitude - User's longitude.
 * @param limit - Max number of priests to fetch (default 6).
 * @returns List of NearbyPriest objects.
 */
export async function fetchNearbyPriests(
  latitude: number,
  longitude: number,
  limit: number = 6
): Promise<NearbyPriest[]> {
  try {
    const response = await api.get<ApiResponse<NearbyPriest[]>>('/priest/available', {
      params: { lat: latitude, lng: longitude, limit },
    });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (err) {
    logger.error('fetchNearbyPriests failed', err);
    return [];
  }
}

/**
 * Fetches all festivals and maps them to sorted, upcoming FestivalParsed entries.
 *
 * @param count - Max number of upcoming festivals to return.
 * @returns Filtered, sorted list of upcoming parsed festivals.
 */
export async function fetchUpcomingFestivals(
  count: number = 3
): Promise<FestivalParsed[]> {
  try {
    const response = await api.get<Festival[]>('/metadata/festivals');
    const rawFestivals = response.data ?? [];

    return rawFestivals
      .filter(isUpcoming)
      .sort((a, b) => {
        const dateA = parseFestivalDate(a.date).getTime();
        const dateB = parseFestivalDate(b.date).getTime();
        return dateA - dateB;
      })
      .slice(0, count)
      .map(formatFestivalForDisplay);
  } catch (err) {
    logger.error('fetchUpcomingFestivals failed', err);
    return [];
  }
}
