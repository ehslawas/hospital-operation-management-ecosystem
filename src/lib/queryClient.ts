import { QueryClient } from '@tanstack/react-query'

// Create a client with optimized caching settings
// Shared instance allows direct access from non-React components (e.g., authService)
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 10 * 60 * 1000,   // 10 minutes - cache garbage collection
        },
    },
})
