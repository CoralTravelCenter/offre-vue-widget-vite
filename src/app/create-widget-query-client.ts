import { QueryClient, type QueryClientConfig } from "@tanstack/vue-query";

const DEFAULT_STALE_TIME = 60_000;
const DEFAULT_GC_TIME = 5 * 60_000;

export function createWidgetQueryClient(config: QueryClientConfig = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      },
      mutations: {
        retry: 0
      }
    },
    ...config
  });
}
