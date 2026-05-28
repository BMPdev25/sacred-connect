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
 * @returns Flattened pujaris list, state info, and request paginated next-page triggers.
 */
export function useExplorePriests(
  searchQuery: string,
  filters: ExploreFilters,
  sort: SortOption,
  coordinates: { latitude: number; longitude: number } | null
) {
  const queryResult = useInfiniteQuery({
    queryKey: ['explorePriests', searchQuery, filters, sort, coordinates],
    queryFn: ({ pageParam = 1 }) => {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length > 0) {
        return exploreService.searchAll(trimmedQuery, pageParam);
      }
      return exploreService.fetchPriests({
        page: pageParam,
        lat: coordinates?.latitude ?? null,
        lng: coordinates?.longitude ?? null,
        filters,
        sort,
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

  return {
    priests,
    isLoading: queryResult.isLoading,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    refetch: queryResult.refetch,
    error: queryResult.error,
  };
}
