import { useQuery } from '@tanstack/react-query';

import { fetchUnifiedSearch } from '@/services/devotee/exploreService';
import { CeremonySearchResult, PriestSearchResult } from '@/types/explore.types';

/**
 * Fetches unified typeahead results (ceremonies + priests) as the user types.
 * Skips the request when the query is shorter than 2 characters.
 *
 * @param query - The debounced search input string.
 */
export function useUnifiedSearch(query: string): {
  ceremonies: CeremonySearchResult[];
  priests: PriestSearchResult[];
  isLoading: boolean;
} {
  const trimmed = query.trim();
  const result = useQuery({
    queryKey: ['unifiedSearch', trimmed],
    queryFn: () => fetchUnifiedSearch(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30 * 1000,
  });

  return {
    ceremonies: result.data?.ceremonies ?? [],
    priests: result.data?.priests ?? [],
    isLoading: result.isLoading,
  };
}
