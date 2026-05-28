/**
 * ExploreTab — main marketplace search and discovery screen.
 * Orchestrates search, suggestions, filtering, and the infinite priest list.
 */

import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootState } from '@/redux/store';
import { applyPresetCategory, resetFilters, setSortBy } from '@/redux/slices/exploreSlice';
import { THEME } from '@/constants/theme';
import { SearchSuggestion } from '@/types/explore.types';
import { NearbyPriest } from '@/types/home.types';

import { useUserLocation } from '@/hooks/useUserLocation';
import { useCategories } from '@/hooks/useHomeData';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useExplorePriests } from '@/hooks/useExploreData';

import ExploreSearchBar from '@/components/devotee/explore/ExploreSearchBar';
import SuggestionDropdown from '@/components/devotee/explore/SuggestionDropdown';
import SortChips from '@/components/devotee/explore/SortChips';
import PriestList from '@/components/devotee/explore/PriestList';
import ExploreEmptyState, { ExploreEmptyReason } from '@/components/devotee/explore/ExploreEmptyState';
import FilterBottomSheet from '@/components/devotee/explore/FilterBottomSheet';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmptyStateReason(
  priests: NearbyPriest[],
  isLoading: boolean,
  permissionStatus: string,
  searchInput: string
): ExploreEmptyReason | null {
  if (isLoading) return null;
  if (priests.length > 0) return null;
  if (permissionStatus === 'denied') return 'no_location';
  if (searchInput.length > 0) return 'search_empty';
  return 'no_results';
}

// ---------------------------------------------------------------------------
// Main Screen Component
// ---------------------------------------------------------------------------

export default function ExploreTab(): React.JSX.Element {
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{ focusSearch?: string; categoryId?: string; categoryName?: string }>();

  // Global State & Hooks
  const filters = useSelector((state: RootState) => state.explore);
  const { coordinates, permissionStatus } = useUserLocation();
  const categories = useCategories();

  // Local State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Data Queries
  const { suggestions, isLoading: isLoadingSuggestions } = useSearchSuggestions(debouncedSearch);
  const { priests, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useExplorePriests(
    debouncedSearch,
    filters,
    filters.sortBy,
    coordinates
  );

  // Mount Effect
  useEffect(() => {
    if (params.categoryId) {
      dispatch(applyPresetCategory(params.categoryId));
    }
  }, [params.categoryId, dispatch]);

  // Handlers
  function handleSearchChange(text: string): void {
    setSearchInput(text);
    setIsSuggestionOpen(text.length >= 2);
  }

  function handleSearchSubmit(query: string): void {
    setIsSuggestionOpen(false);
    setSearchInput(query);
  }

  function handleSearchClear(): void {
    setSearchInput('');
    setIsSuggestionOpen(false);
  }

  function handleSuggestionPress(suggestion: SearchSuggestion): void {
    setSearchInput(suggestion.text);
    setIsSuggestionOpen(false);
  }

  function handleSuggestionSearchPress(query: string): void {
    setSearchInput(query);
    setIsSuggestionOpen(false);
  }

  function handlePriestPress(priestId: string): void {
    router.push({
      pathname: '/devotee/(screens)/PriestDetails' as any,
      params: { id: priestId },
    });
  }

  function handleClearFilters(): void {
    dispatch(resetFilters());
  }

  function handleEnableLocation(): void {
    Linking.openSettings();
  }

  function handleFilterApply(): void {
    setIsFilterSheetOpen(false);
  }

  const emptyReason = getEmptyStateReason(priests, isLoading, permissionStatus, searchInput);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Pandits</Text>

        <View style={styles.searchWrap}>
          <ExploreSearchBar
            value={searchInput}
            onChangeText={handleSearchChange}
            onSubmit={handleSearchSubmit}
            onClear={handleSearchClear}
            autoFocus={params.focusSearch === 'true'}
            filterCount={filters.activeFilterCount}
            onFilterPress={() => setIsFilterSheetOpen(true)}
          />
          <SuggestionDropdown
            visible={isSuggestionOpen}
            suggestions={suggestions}
            query={searchInput}
            isLoading={isLoadingSuggestions}
            onSuggestionPress={handleSuggestionPress}
            onSearchPress={handleSuggestionSearchPress}
          />
        </View>
      </View>

      <View style={styles.sortWrap}>
        <SortChips
          selectedSort={filters.sortBy}
          onSortChange={(sort) => dispatch(setSortBy(sort))}
        />
      </View>

      {/* ── Scrollable List / Empty State ── */}
      {emptyReason ? (
        <ExploreEmptyState
          reason={emptyReason}
          searchQuery={searchInput}
          onClearFilters={handleClearFilters}
          onEnableLocation={handleEnableLocation}
        />
      ) : (
        <PriestList
          priests={priests}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onEndReached={fetchNextPage}
          onPriestPress={handlePriestPress}
          resultCount={priests.length}
          isSearchActive={searchInput.length > 0}
        />
      )}

      {/* ── Filter Sheet ── */}
      <FilterBottomSheet
        isVisible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={handleFilterApply}
        categories={categories.data ?? []}
        resultCount={priests.length}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    zIndex: 10,
  },
  title: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  searchWrap: {
    zIndex: 20,
    position: 'relative',
  },
  sortWrap: {
    marginVertical: THEME.spacing.md,
    zIndex: 1,
  },
});
