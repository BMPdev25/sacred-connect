import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchUpcomingBookings, fetchPastBookings } from '@/services/devotee/bookingManagementService';
import { BookingListItem } from '@/types/bookingManagement.types';

interface UseBookingsResult {
  bookings: BookingListItem[];
  isLoading: boolean;
  hasMore: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Custom hook to retrieve upcoming bookings (pending and confirmed) with infinite scroll.
 *
 * @returns An object containing bookings, loading/pagination states, fetchNextPage, and refetch functions.
 */
export function useUpcomingBookings(): UseBookingsResult {
  const queryResult = useInfiniteQuery({
    queryKey: ['upcomingBookings'],
    queryFn: ({ pageParam = 1 }) => fetchUpcomingBookings(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const bookings = queryResult.data?.pages.flatMap((page) => page.bookings) ?? [];

  const fetchNextPage = () => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  };

  return {
    bookings,
    isLoading: queryResult.isLoading,
    hasMore: !!queryResult.hasNextPage,
    fetchNextPage,
    refetch: queryResult.refetch,
  };
}

/**
 * Custom hook to retrieve past bookings (completed, cancelled, and rejected) with infinite scroll.
 *
 * @returns An object containing bookings, loading/pagination states, fetchNextPage, and refetch functions.
 */
export function usePastBookings(): UseBookingsResult {
  const queryResult = useInfiniteQuery({
    queryKey: ['pastBookings'],
    queryFn: ({ pageParam = 1 }) => fetchPastBookings(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const bookings = queryResult.data?.pages.flatMap((page) => page.bookings) ?? [];

  const fetchNextPage = () => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  };

  return {
    bookings,
    isLoading: queryResult.isLoading,
    hasMore: !!queryResult.hasNextPage,
    fetchNextPage,
    refetch: queryResult.refetch,
  };
}
