import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 2 minutes + random 0-30s jitter —
      // navigating back within this window shows cached data instantly.
      // Jitter prevents multiple devices from expiring caches at the same exact second.
      staleTime: 2 * 60 * 1000 + Math.floor(Math.random() * 30 * 1000),

      // Keep unused query data in memory for 5 minutes. Prevents re-fetching
      // when the user navigates away and comes back quickly.
      gcTime: 5 * 60 * 1000,

      // On navigation, refetch only if data is stale.
      refetchOnMount: true,

      // Don't refetch on window focus in mobile app context.
      refetchOnWindowFocus: false,

      // Retry once on failure, with exponential backoff + full random jitter.
      retry: 1,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * (2 ** attemptIndex) + Math.floor(Math.random() * 1000), 10000),
    },
  },
});