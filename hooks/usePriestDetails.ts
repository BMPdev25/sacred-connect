import { useQuery } from '@tanstack/react-query';
import * as priestDetailsService from '@/services/devotee/priestDetailsService';

/**
 * Custom hook to retrieve a priest's public profile details.
 *
 * @param priestProfileId - Unique identifier of the priest's profile document.
 * @returns Object containing profile data, loading state, request error, and refetch method.
 */
export function usePriestProfile(priestProfileId: string) {
  const query = useQuery({
    queryKey: ['priestProfile', priestProfileId],
    queryFn: () => priestDetailsService.fetchPriestProfile(priestProfileId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Custom hook to retrieve reviews of a priest.
 *
 * @param priestProfileId - Unique identifier of the priest's profile document.
 * @returns Object containing reviews page data and loading state.
 */
export function usePriestReviews(priestProfileId: string) {
  const query = useQuery({
    queryKey: ['priestReviews', priestProfileId],
    queryFn: () => priestDetailsService.fetchPriestReviews(priestProfileId),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}
