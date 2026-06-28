import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents refetching data when switching tabs
      retry: 1, // Number of retry attempts on failure
      staleTime: 5 * 60 * 1000, // 5 minutes staletime
    },
  },
});
