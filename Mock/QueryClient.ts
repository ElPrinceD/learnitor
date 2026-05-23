import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 2 minutes — navigating back within this
      // window shows cached data instantly, no refetch.
      staleTime: 2 * 60 * 1000,

      // Keep unused query data in memory for 5 minutes. Prevents re-fetching
      // when the user navigates away and comes back quickly.
      gcTime: 5 * 60 * 1000,

      // On navigation, refetch only if data is stale.
      refetchOnMount: true,

      // Don't refetch on window focus in mobile app context.
      refetchOnWindowFocus: false,

      // Retry once on failure, with exponential backoff.
      retry: 1,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});