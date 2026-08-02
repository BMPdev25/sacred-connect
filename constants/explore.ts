/**
 * Default sorting option for the available priests list.
 */
export const DEFAULT_SORT_BY = 'rating';

/**
 * Default starting minimum price filter boundary.
 */
export const DEFAULT_MIN_PRICE = 0;

/**
 * Default starting maximum price filter boundary.
 */
export const DEFAULT_MAX_PRICE = 10000;

/**
 * Default maximum distance radius filter boundary (in kilometers).
 */
export const DEFAULT_MAX_DISTANCE_KM = 50;

/**
 * Default pagination page size/limit.
 */
export const DEFAULT_PAGE_LIMIT = 10;

/**
 * Available minimum rating options for filter selection.
 */
export const RATING_OPTIONS = [
  { label: 'Any', value: null },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
] as const;

/**
 * Spoken languages available for priest filters.
 */
export const LANGUAGES = [
  'Hindi', 'Sanskrit', 'English', 'Telugu', 'Tamil',
  'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati',
  'Punjabi', 'Odia',
] as const;

