import { NearbyPriest } from './home.types';

/**
 * Active filter state for the Explore Tab.
 */
export interface ExploreFilters {
  /** Array of ceremony category _id strings. */
  ceremonyTypes: string[];
  /** Array of languages spoken. */
  languages: string[];
  /** Minimum rating score out of 5, or null if any. */
  minRating: number | null;
  /** Minimum price in Rupees. */
  minPrice: number;
  /** Maximum price in Rupees. */
  maxPrice: number;
  /** Maximum distance in kilometers from devotee location. */
  maxDistanceKm: number;
  /** City/town name to filter priests by location (matches PriestProfile address). */
  city?: string;
}

/**
 * Sort options for the available priests list.
 */
export type SortOption = 'rating' | 'distance' | 'price_asc' | 'price_desc';

/**
 * A single autocomplete search suggestion returned as user types.
 */
export interface SearchSuggestion {
  /** Unique ID of the suggestion (could be priest or ceremony ID). */
  id: string;
  /** Display text of the suggestion. */
  text: string;
  /** Type classification of the suggestion. */
  type: 'ceremony' | 'pandit';
  /** Optional secondary display information (e.g. category name). */
  subtext?: string;
}

/**
 * Paginated available priests list returned from backend endpoints.
 */
export interface PaginatedPriests {
  /** Array of nearby available priest profiles. */
  pujaris: NearbyPriest[];
  /** Page metadata structure. */
  pagination: {
    /** Total number of available records matching filters. */
    total: number;
    /** Current active page index. */
    page: number;
    /** Number of records returned per page. */
    limit: number;
    /** Indicator if subsequent pages are available. */
    hasMore: boolean;
  };
}

/**
 * Explore screen transient UI view states.
 */
export interface ExploreUIState {
  /** Current user search query string. */
  searchQuery: string;
  /** Flag representing if suggestion list overlay is open. */
  isSuggestionOpen: boolean;
  /** Flag representing if filter settings sheet is open. */
  isFilterSheetOpen: boolean;
}
