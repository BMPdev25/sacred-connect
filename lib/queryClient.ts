import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client instance configured with global defaults.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes default stale time
      retry: 2, // Retry failed queries twice before failing
      refetchOnWindowFocus: false, // Avoid refetching when window/tab is focused
      refetchOnMount: true, // Refetch query when component mounts
    },
  },
});
