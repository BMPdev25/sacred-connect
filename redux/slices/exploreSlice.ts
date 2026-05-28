import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_MIN_PRICE,
  DEFAULT_MAX_PRICE,
  DEFAULT_MAX_DISTANCE_KM,
  DEFAULT_SORT_BY,
} from '@/constants/explore';
import { ExploreFilters, SortOption } from '@/types/explore.types';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

/**
 * Redux state shape for the Explore Tab.
 */
export interface ExploreState extends ExploreFilters {
  /** Currently active sorting method. */
  sortBy: SortOption;
  /** Count of active filters for ui badge display. */
  activeFilterCount: number;
}

const initialState: ExploreState = {
  ceremonyTypes: [],
  languages: [],
  minRating: null,
  minPrice: DEFAULT_MIN_PRICE,
  maxPrice: DEFAULT_MAX_PRICE,
  maxDistanceKm: DEFAULT_MAX_DISTANCE_KM,
  sortBy: DEFAULT_SORT_BY as SortOption,
  activeFilterCount: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the number of active filters based on deviations from defaults.
 *
 * @param state - The current state of filters.
 * @returns Number of active filters.
 */
export function calculateActiveFilterCount(state: ExploreFilters): number {
  let count = 0;
  if (state.ceremonyTypes.length > 0) {
    count += 1;
  }
  if (state.languages.length > 0) {
    count += 1;
  }
  if (state.minRating !== null) {
    count += 1;
  }
  if (state.minPrice > DEFAULT_MIN_PRICE || state.maxPrice < DEFAULT_MAX_PRICE) {
    count += 1;
  }
  if (state.maxDistanceKm < DEFAULT_MAX_DISTANCE_KM) {
    count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const exploreSlice = createSlice({
  name: 'explore',
  initialState,
  reducers: {
    /**
     * Updates the current sorting option.
     */
    setSortBy(state, action: PayloadAction<SortOption>) {
      state.sortBy = action.payload;
      state.activeFilterCount = calculateActiveFilterCount(state);
    },

    /**
     * Toggles a ceremony type category in the filters list.
     */
    toggleCeremonyType(state, action: PayloadAction<string>) {
      const categoryId = action.payload;
      const index = state.ceremonyTypes.indexOf(categoryId);
      if (index > -1) {
        state.ceremonyTypes.splice(index, 1);
      } else {
        state.ceremonyTypes.push(categoryId);
      }
      state.activeFilterCount = calculateActiveFilterCount(state);
    },

    /**
     * Toggles a spoken language in the filters list.
     */
    toggleLanguage(state, action: PayloadAction<string>) {
      const language = action.payload;
      const index = state.languages.indexOf(language);
      if (index > -1) {
        state.languages.splice(index, 1);
      } else {
        state.languages.push(language);
      }
      state.activeFilterCount = calculateActiveFilterCount(state);
    },

    /**
     * Sets the minimum rating filter.
     */
    setMinRating(state, action: PayloadAction<number | null>) {
      state.minRating = action.payload;
      state.activeFilterCount = calculateActiveFilterCount(state);
    },

    /**
     * Sets the min and max price range filters.
     */
    setPriceRange(state, action: PayloadAction<{ min: number; max: number }>) {
      state.minPrice = action.payload.min;
      state.maxPrice = action.payload.max;
      state.activeFilterCount = calculateActiveFilterCount(state);
    },

    /**
     * Sets the maximum distance radius filter.
     */
    setMaxDistance(state, action: PayloadAction<number>) {
      state.maxDistanceKm = action.payload;
      state.activeFilterCount = calculateActiveFilterCount(state);
    },

    /**
     * Resets all filter fields to their initial states.
     */
    resetFilters(state) {
      state.ceremonyTypes = [];
      state.languages = [];
      state.minRating = null;
      state.minPrice = DEFAULT_MIN_PRICE;
      state.maxPrice = DEFAULT_MAX_PRICE;
      state.maxDistanceKm = DEFAULT_MAX_DISTANCE_KM;
      state.sortBy = DEFAULT_SORT_BY as SortOption;
      state.activeFilterCount = 0;
    },

    /**
     * Sets a preset category from home screen navigation, clearing other filters.
     */
    applyPresetCategory(state, action: PayloadAction<string>) {
      state.ceremonyTypes = [action.payload];
      state.languages = [];
      state.minRating = null;
      state.minPrice = DEFAULT_MIN_PRICE;
      state.maxPrice = DEFAULT_MAX_PRICE;
      state.maxDistanceKm = DEFAULT_MAX_DISTANCE_KM;
      state.activeFilterCount = 1;
    },
  },
});

export const {
  setSortBy,
  toggleCeremonyType,
  toggleLanguage,
  setMinRating,
  setPriceRange,
  setMaxDistance,
  resetFilters,
  applyPresetCategory,
} = exploreSlice.actions;

export default exploreSlice.reducer;
