import { useInfiniteQuery } from '@tanstack/react-query';

import * as exploreService from '@/services/devotee/exploreService';
import { ExploreFilters, SortOption } from '@/types/explore.types';

/**
 * Custom React Query hook to retrieve infinite-scroll available priests.
 *
 * @param searchQuery - The devotee's active text query, if any.
 * @param filters - Currently configured filters from Redux store.
 * @param sort - Configured sort option.
 * @param coordinates - Devotee's geo-coordinates.
 * @param ceremonyId - Optional exact ceremony to filter by (e.g. ceremony-first navigation).
 * @returns Flattened pujaris list, state info, and request paginated next-page triggers.
 */
export function useExplorePriests(
  searchQuery: string,
  filters: ExploreFilters,
  sort: SortOption,
  coordinates: { latitude: number; longitude: number } | null,
  ceremonyId?: string | null
) {
  const queryResult = useInfiniteQuery({
    queryKey: ['explorePriests', searchQuery, filters, sort, coordinates, ceremonyId],
    queryFn: ({ pageParam = 1 }) => {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length > 0) {
        return exploreService.searchAll(trimmedQuery, pageParam, filters, sort);
      }
      return exploreService.fetchPriests({
        page: pageParam,
        lat: coordinates?.latitude ?? null,
        lng: coordinates?.longitude ?? null,
        filters,
        sort,
        ceremonyId,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

  const priests = queryResult.data?.pages.flatMap((page) => page.pujaris) ?? [];
  // Keep offline pandits discoverable (still bookable for a future scheduled
  // ceremony) but sink them below online ones. Stable sort preserves the
  // backend's rating/experience/price ordering within each group.
  const sortedPriests = [...priests].sort(
    (a, b) => (a.isOffline ? 1 : 0) - (b.isOffline ? 1 : 0)
  );

  return {
    priests: sortedPriests,
    isLoading: queryResult.isLoading,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    refetch: queryResult.refetch,
    error: queryResult.error,
  };
}
