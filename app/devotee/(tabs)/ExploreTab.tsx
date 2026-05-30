/**
 * ExploreTab — main discoverability tab for devotees.
 */

import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
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

import { ExploreHeader } from '@/components/devotee/explore/ExploreHeader';
import SortChips from '@/components/devotee/explore/SortChips';
import PriestList from '@/components/devotee/explore/PriestList';
import ExploreEmptyState, { ExploreEmptyReason } from '@/components/devotee/explore/ExploreEmptyState';
import FilterBottomSheet from '@/components/devotee/explore/FilterBottomSheet';

/**
 * Returns empty state reason if applicable, otherwise null.
 */
function getEmptyStateReason(
  priests: NearbyPriest[],
  isLoading: boolean,
  permissionStatus: string,
  searchInput: string,
  error: any
): ExploreEmptyReason | null {
  if (isLoading) return null;
  if (error) return 'error';
  if (priests.length > 0) return null;
  if (permissionStatus === 'denied') return 'no_location';
  if (searchInput.length > 0) return 'search_empty';
  return 'no_results';
}

/**
 * Discovery tab component coordinating search suggestions, list pagination, and filters.
 */
export default function ExploreTab(): React.JSX.Element {
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{ focusSearch?: string; categoryId?: string }>();
  const filters = useSelector((state: RootState) => state.explore);
  const { coordinates, permissionStatus } = useUserLocation();
  const categories = useCategories();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const { suggestions, isLoading: isLoadingSuggestions } = useSearchSuggestions(debouncedSearch);
  const { priests, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, error } = useExplorePriests(
    debouncedSearch,
    filters,
    filters.sortBy,
    coordinates
  );

  useEffect(() => {
    if (params.categoryId) dispatch(applyPresetCategory(params.categoryId));
  }, [params.categoryId, dispatch]);

  const emptyReason = getEmptyStateReason(priests, isLoading, permissionStatus, searchInput, error);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ExploreHeader
        title="Explore Pandits"
        searchInput={searchInput}
        onChangeSearchInput={(text) => {
          setSearchInput(text);
          setIsSuggestionOpen(text.length >= 2);
        }}
        isSuggestionOpen={isSuggestionOpen}
        setIsSuggestionOpen={setIsSuggestionOpen}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        filterCount={filters.activeFilterCount}
        onFilterPress={() => setIsFilterSheetOpen(true)}
        autoFocus={params.focusSearch === 'true'}
        onSuggestionPress={(s) => {
          setSearchInput(s.text);
          setIsSuggestionOpen(false);
        }}
        onSearchSubmit={(q) => {
          setIsSuggestionOpen(false);
          setSearchInput(q);
        }}
        onSearchClear={() => {
          setSearchInput('');
          setIsSuggestionOpen(false);
        }}
        onFocus={() => {
          if (searchInput.length >= 2) setIsSuggestionOpen(true);
        }}
      />

      <View style={styles.sortWrap}>
        <SortChips selectedSort={filters.sortBy} onSortChange={(sort) => dispatch(setSortBy(sort))} />
      </View>

      {emptyReason ? (
        <ExploreEmptyState
          reason={emptyReason}
          searchQuery={searchInput}
          onClearFilters={() => dispatch(resetFilters())}
          onEnableLocation={() => Linking.openSettings()}
          onRetry={refetch}
        />
      ) : (
        <PriestList
          priests={priests}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onEndReached={fetchNextPage}
          onPriestPress={(id, userId) => router.push({ pathname: '/devotee/(screens)/PriestDetails' as any, params: { id, userId } })}
          resultCount={priests.length}
          isSearchActive={searchInput.length > 0}
        />
      )}

      <FilterBottomSheet
        isVisible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={() => setIsFilterSheetOpen(false)}
        categories={categories.data ?? []}
        resultCount={priests.length}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  sortWrap: { marginVertical: THEME.spacing.md, zIndex: 1 },
});
