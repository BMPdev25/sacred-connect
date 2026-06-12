/**
 * ExploreTab -- main discoverability tab for devotees.
 * Includes a Pandits / Ceremonies toggle. Pandits view shows the sortable
 * priest list; Ceremonies view shows a 2-column grid with category chips.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '@/redux/store';
import { applyPresetCategory, resetFilters, setSortBy } from '@/redux/slices/exploreSlice';
import { THEME } from '@/constants/theme';
import { NearbyPriest } from '@/types/home.types';

import { useUserLocation } from '@/hooks/useUserLocation';
import { useCategories } from '@/hooks/useHomeData';
import { useDebounce } from '@/hooks/useDebounce';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { useExplorePriests } from '@/hooks/useExploreData';
import api from '@/api/index';
import { getCeremonyImageSource } from '@/utils/imageUtils';

import { ExploreHeader } from '@/components/devotee/explore/ExploreHeader';
import SortChips from '@/components/devotee/explore/SortChips';
import PriestList from '@/components/devotee/explore/PriestList';
import ExploreEmptyState, { ExploreEmptyReason } from '@/components/devotee/explore/ExploreEmptyState';
import FilterBottomSheet from '@/components/devotee/explore/FilterBottomSheet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'pandits' | 'ceremonies';

interface CeremonyListItem {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  duration?: { typical?: number };
  pricing?: { basePrice?: number };
  images?: Array<{ url?: string; isPrimary?: boolean }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatDurationShort(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hr`;
}

// ---------------------------------------------------------------------------
// Ceremony card sub-component
// ---------------------------------------------------------------------------

interface CeremonyCardProps {
  item: CeremonyListItem;
  onPress: () => void;
}

function CeremonyCard({ item, onPress }: CeremonyCardProps): React.JSX.Element {
  const imgSource = getCeremonyImageSource(item.images);
  const duration = item.duration?.typical;
  const basePrice = item.pricing?.basePrice;

  return (
    <TouchableOpacity style={styles.ceremonyCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={imgSource} style={styles.ceremonyCardImage} resizeMode="cover" />
      <View style={styles.ceremonyCardBody}>
        {item.category ? (
          <View style={styles.ceremonyCategoryPill}>
            <Text style={styles.ceremonyCategoryText}>{item.category.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={styles.ceremonyCardName} numberOfLines={2}>{item.name}</Text>
        {duration != null && (
          <View style={styles.ceremonyCardMeta}>
            <Ionicons name="time-outline" size={12} color={THEME.colors.textMuted} />
            <Text style={styles.ceremonyCardMetaText}>{formatDurationShort(duration)}</Text>
          </View>
        )}
        {basePrice != null && (
          <Text style={styles.ceremonyCardPrice}>
            From ₹{basePrice.toLocaleString('en-IN')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Skeleton placeholder for loading state
function CeremonyCardSkeleton(): React.JSX.Element {
  return (
    <View style={[styles.ceremonyCard, styles.ceremonySkeleton]}>
      <View style={styles.ceremonySkeletonImage} />
      <View style={styles.ceremonyCardBody}>
        <View style={styles.ceremonySkeletonLine} />
        <View style={[styles.ceremonySkeletonLine, { width: '60%', marginTop: 6 }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExploreTab(): React.JSX.Element {
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{ focusSearch?: string; categoryId?: string }>();
  const filters = useSelector((state: RootState) => state.explore);
  const { coordinates, permissionStatus } = useUserLocation();
  const categories = useCategories();

  const [viewMode, setViewMode] = useState<ViewMode>('pandits');
  const [searchInput, setSearchInput] = useState('');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const debouncedSearch = useDebounce(searchInput, 300);

  const { ceremonies: searchCeremonies, priests: searchPriests, isLoading: isLoadingSearch } =
    useUnifiedSearch(debouncedSearch);

  const { priests, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, error } =
    useExplorePriests(debouncedSearch, filters, filters.sortBy, coordinates);

  // Fetch all ceremonies for the grid
  const { data: ceremoniesData, isLoading: isCeremoniesLoading } = useQuery<{
    ceremonies: CeremonyListItem[];
  }>({
    queryKey: ['allCeremonies'],
    queryFn: () =>
      api
        .get<{ ceremonies: CeremonyListItem[] }>('/ceremonies?limit=100')
        .then((r) => r.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const allCeremonies = ceremoniesData?.ceremonies ?? [];

  // Derive category chips from ceremony data
  const categoryChips = useMemo(() => {
    const cats = Array.from(new Set(allCeremonies.map((c) => c.category).filter(Boolean))) as string[];
    return ['All', ...cats];
  }, [allCeremonies]);

  // Filtered ceremonies
  const filteredCeremonies = useMemo(() => {
    if (selectedCategory === 'All') return allCeremonies;
    return allCeremonies.filter((c) => c.category === selectedCategory);
  }, [allCeremonies, selectedCategory]);

  useEffect(() => {
    if (params.categoryId) dispatch(applyPresetCategory(params.categoryId));
  }, [params.categoryId, dispatch]);

  const emptyReason = getEmptyStateReason(priests, isLoading, permissionStatus, searchInput, error);

  function handleSearchAllPandits(query: string): void {
    setSearchInput(query);
    setIsSuggestionOpen(false);
  }

  function handleCeremonyPress(ceremonyId: string): void {
    setSearchInput('');
    setIsSuggestionOpen(false);
    router.push({
      pathname: '/devotee/(screens)/CeremonyDetails' as any,
      params: { ceremonyId },
    });
  }

  function handlePriestPress(priestProfileId: string, userId: string): void {
    setSearchInput('');
    setIsSuggestionOpen(false);
    router.push({
      pathname: '/devotee/(screens)/PriestDetails' as any,
      params: { id: priestProfileId, userId },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ExploreHeader
        title={viewMode === 'pandits' ? 'Explore Pandits' : 'Browse Ceremonies'}
        searchInput={searchInput}
        onChangeSearchInput={(text) => {
          setSearchInput(text);
          setIsSuggestionOpen(text.length >= 2);
        }}
        isSuggestionOpen={isSuggestionOpen}
        setIsSuggestionOpen={setIsSuggestionOpen}
        ceremonies={searchCeremonies}
        priests={searchPriests}
        isLoadingSearch={isLoadingSearch}
        filterCount={filters.activeFilterCount}
        onFilterPress={() => setIsFilterSheetOpen(true)}
        autoFocus={params.focusSearch === 'true'}
        onCeremonyPress={handleCeremonyPress}
        onPriestPress={handlePriestPress}
        onSearchAllPandits={handleSearchAllPandits}
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

      {/* Backdrop */}
      {isSuggestionOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsSuggestionOpen(false)}
          accessibilityLabel="Close search suggestions"
        />
      )}

      {!isSuggestionOpen && (
        <>
          {/* ── Pandits / Ceremonies toggle ── */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'pandits' && styles.toggleBtnActive]}
              onPress={() => setViewMode('pandits')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleLabel, viewMode === 'pandits' && styles.toggleLabelActive]}>
                Pandits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'ceremonies' && styles.toggleBtnActive]}
              onPress={() => setViewMode('ceremonies')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleLabel, viewMode === 'ceremonies' && styles.toggleLabelActive]}>
                Ceremonies
              </Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'pandits' ? (
            <>
              <View style={styles.sortWrap}>
                <SortChips
                  selectedSort={filters.sortBy}
                  onSortChange={(sort) => dispatch(setSortBy(sort))}
                />
              </View>

              {emptyReason ? (
                <ExploreEmptyState
                  reason={emptyReason}
                  searchQuery={searchInput}
                  onClearFilters={() => dispatch(resetFilters())}
                  onBrowseAll={() => {
                    setSearchInput('');
                    setIsSuggestionOpen(false);
                    dispatch(resetFilters());
                  }}
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
                  onPriestPress={(id, userId) =>
                    router.push({
                      pathname: '/devotee/(screens)/PriestDetails' as any,
                      params: { id, userId },
                    })
                  }
                  resultCount={priests.length}
                  isSearchActive={searchInput.length > 0}
                />
              )}
            </>
          ) : (
            /* ── Ceremonies view ── */
            <View style={{ flex: 1 }}>
              {/* Category filter chips */}
              <FlatList
                horizontal
                data={categoryChips}
                keyExtractor={(cat) => cat}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsContainer}
                style={styles.categoryChipsRow}
                renderItem={({ item: cat }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      cat === selectedCategory && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryChipLabel,
                        cat === selectedCategory && styles.categoryChipLabelActive,
                      ]}
                    >
                      {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              {/* Ceremony grid */}
              {isCeremoniesLoading ? (
                <FlatList
                  data={Array.from({ length: 6 })}
                  numColumns={2}
                  keyExtractor={(_, i) => String(i)}
                  contentContainerStyle={styles.gridContent}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={() => <CeremonyCardSkeleton />}
                />
              ) : filteredCeremonies.length === 0 ? (
                <View style={styles.centerEmpty}>
                  <Text style={styles.emptyText}>No ceremonies found</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredCeremonies}
                  numColumns={2}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.gridContent}
                  columnWrapperStyle={styles.gridRow}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <CeremonyCard
                      item={item}
                      onPress={() => handleCeremonyPress(item._id)}
                    />
                  )}
                />
              )}
            </View>
          )}
        </>
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },

  // Toggle
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F0EDE6',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: THEME.typography.body,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  toggleLabelActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },

  // Pandits view
  sortWrap: { marginVertical: THEME.spacing.sm, zIndex: 1 },

  // Category chips
  categoryChipsRow: {
    flexGrow: 0,
    marginBottom: THEME.spacing.sm,
  },
  categoryChipsContainer: {
    paddingHorizontal: THEME.spacing.md,
    gap: 8,
  },
  categoryChip: {
    height: 34,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  categoryChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  categoryChipLabel: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
  categoryChipLabelActive: {
    color: THEME.colors.surface,
    fontWeight: '700',
  },

  // Ceremony grid
  gridContent: {
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xl,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  ceremonyCard: {
    flex: 1,
    margin: 6,
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...THEME.shadow.card,
  },
  ceremonyCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: THEME.colors.border,
  },
  ceremonyCardBody: {
    padding: 10,
  },
  ceremonyCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  ceremonyCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  ceremonyCardName: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  ceremonyCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  ceremonyCardMetaText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  ceremonyCardPrice: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 4,
  },

  // Skeleton
  ceremonySkeleton: {
    opacity: 0.5,
  },
  ceremonySkeletonImage: {
    width: '100%',
    height: 100,
    backgroundColor: THEME.colors.border,
  },
  ceremonySkeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.border,
    width: '80%',
    marginTop: 8,
  },

  // Empty
  centerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
});
