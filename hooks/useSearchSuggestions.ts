import { useQuery } from '@tanstack/react-query';

import * as exploreService from '@/services/devotee/exploreService';
import { SearchSuggestion } from '@/types/explore.types';

/**
 * Custom hook to retrieve search suggestions based on the user's input.
 * Excludes query strings shorter than 2 characters.
 *
 * @param query - The user's input string.
 * @returns Object containing the suggestions list and loading state.
 */
export function useSearchSuggestions(query: string) {
  const trimmed = query.trim();
  const queryResult = useQuery<SearchSuggestion[]>({
    queryKey: ['suggestions', trimmed],
    queryFn: () => exploreService.fetchSuggestions(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30 * 1000,
  });

  return {
    suggestions: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
  };
}
