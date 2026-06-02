import api from '@/api/index';
import { ExploreFilters, PaginatedPriests, SearchSuggestion, SortOption } from '@/types/explore.types';
import { NearbyPriest } from '@/types/home.types';
import { logger } from '@/utils/logger';
import { normalizeProfilePicture } from '@/utils/imageUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps any backend priest details to NearbyPriest interface format.
 *
 * @param p - The raw priest object from backend.
 * @returns Normalized NearbyPriest object.
 */
function mapBackendPriestToNearbyPriest(p: any): NearbyPriest {
  const ratings = p.ratings || p.rating || {};
  const startingPrice = p.startingPrice || p.priceRange?.min || (p.services?.[0]?.price) || 1500;
  const spec =
    p.primarySpecialization ||
    p.religiousTradition ||
    p.services?.[0]?.ceremonyId?.name ||
    p.services?.[0]?.name ||
    p.specializations?.[0]?.name ||
    'Pandit';
  return {
    _id: p._id || p.id || '',
    userId: typeof p.userId === 'object' ? (p.userId?._id || '') : (p.userId || ''),
    name: p.name || 'Unknown Priest',
    profilePicture: normalizeProfilePicture(p.profilePicture),
    primarySpecialization: spec,
    rating: typeof ratings.average === 'number' ? ratings.average : (typeof p.rating === 'number' ? p.rating : 4.5),
    reviewCount: typeof ratings.count === 'number' ? ratings.count : (typeof p.reviewCount === 'number' ? p.reviewCount : 5),
    startingPrice,
    experienceYears: p.experience || p.experienceYears || 5,
    distance: typeof p.distance === 'number' ? p.distance : undefined,
  };
}

/**
 * Maps suggestion items from backend formats to unified SearchSuggestion.
 *
 * @param item - The raw suggestion item from backend.
 * @returns Unified SearchSuggestion.
 */
function mapSuggestion(item: any): SearchSuggestion {
  if (item.type === 'priest') {
    return {
      id: item.id || item._id,
      text: item.name || '',
      type: 'pandit',
      subtext: 'Pandit',
    };
  }
  return {
    id: item.id || item._id,
    text: item.name || '',
    type: 'ceremony',
    subtext: item.category || 'Ceremony',
  };
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Fetch a page of available priests with optional filters and sort.
 * Calls GET /api/priest/available.
 *
 * @param params - Query parameters, devotee coordinates, filters, and sort options.
 * @returns Paginated list of nearby priests.
 */
export async function fetchPriests(params: {
  page: number;
  lat: number | null;
  lng: number | null;
  filters: ExploreFilters;
  sort: SortOption;
  limit?: number;
}): Promise<PaginatedPriests> {
  try {
    const filters = params.filters;
    const queryParams: Record<string, any> = {
      page: params.page,
      limit: params.limit ?? 10,
      sort: params.sort,
      radius: filters.maxDistanceKm,
    };
    if (params.lat !== null) queryParams.lat = params.lat;
    if (params.lng !== null) queryParams.lng = params.lng;
    if (filters.minRating !== null) queryParams.minRating = filters.minRating;
    if (filters.minPrice > 0) queryParams.minPrice = filters.minPrice;
    if (filters.maxPrice < 10000) queryParams.maxPrice = filters.maxPrice;
    if (filters.languages.length > 0) queryParams.languages = filters.languages;
    if (filters.ceremonyTypes.length > 0) queryParams.ceremonyId = filters.ceremonyTypes[0];

    const response = await api.get<{ success: boolean; data: PaginatedPriests }>(
      '/priest/available',
      { params: queryParams }
    );
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch available priests');
    }
    const data = response.data.data;
    return {
      pujaris: (data.pujaris || []).map(mapBackendPriestToNearbyPriest),
      pagination: data.pagination,
    };
  } catch (err: any) {
    logger.error('fetchPriests failed', err);
    throw new Error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to fetch available priests');
  }
}

/**
 * Fetch search suggestions as user types.
 * Calls GET /api/search/suggestions.
 *
 * @param query - Autocomplete input query.
 * @returns List of suggestions, or empty array on failure.
 */
export async function fetchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { priests?: any[]; ceremonies?: any[]; combined?: any[] };
    }>('/search/suggestions', {
      params: { q: query, query, type: 'all' },
    });
    if (!response.data || !response.data.success) {
      return [];
    }
    const result = response.data.data;
    const list = result.combined || [
      ...(result.priests || []),
      ...(result.ceremonies || []),
    ];
    return list.map(mapSuggestion);
  } catch (err) {
    logger.warn('fetchSuggestions failed silently', err);
    return [];
  }
}

/**
 * Run a full text search across priests and ceremonies with filters.
 * Calls GET /api/search/universal.
 *
 * @param query - Unified search query.
 * @param page - Current pagination page number.
 * @param filters - Optional active filters to apply to search results.
 * @param sort - Optional sort selection.
 * @returns Paginated results containing mapped pujaris.
 */
export async function searchAll(
  query: string,
  page: number = 1,
  filters?: ExploreFilters,
  sort?: SortOption
): Promise<PaginatedPriests> {
  try {
    const queryParams: Record<string, any> = {
      q: query,
      query,
      page,
      limit: 10,
    };

    if (filters) {
      if (filters.ceremonyTypes.length > 0) {
        // Pass first category to match backend's expected category query param
        queryParams.category = filters.ceremonyTypes[0];
      }
      if (filters.minPrice > 0 || filters.maxPrice < 10000) {
        queryParams.priceRange = `${filters.minPrice}-${filters.maxPrice}`;
      }
    }

    if (sort) {
      if (sort === 'rating') {
        queryParams.sortBy = 'rating';
      } else if (sort === 'price_asc' || sort === 'price_desc') {
        queryParams.sortBy = 'price';
      }
    }

    const response = await api.get<{
      success: boolean;
      data: {
        priests: any[];
        ceremonies: any[];
        totalResults: number;
        pagination: { current: number; total: number; hasMore: boolean };
      };
    }>('/search/universal', {
      params: queryParams,
    });
    if (!response.data || !response.data.success) {
      throw new Error('Universal search failed');
    }
    const result = response.data.data;
    const pujaris = (result.priests || []).map(mapBackendPriestToNearbyPriest);
    return {
      pujaris,
      pagination: {
        total: result.pagination?.total || 0,
        page: result.pagination?.current || page,
        limit: 10,
        hasMore: result.pagination?.hasMore || false,
      },
    };
  } catch (err: any) {
    logger.error('searchAll failed', err);
    throw new Error(err?.response?.data?.message || err?.response?.data?.error || 'Universal search failed');
  }
}
