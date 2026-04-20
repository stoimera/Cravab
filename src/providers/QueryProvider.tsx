'use client'

import { logger } from '@/lib/logger'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'

interface QueryProviderProps {
  children: React.ReactNode
}

// Check dev mode outside component to ensure it's stable
const IS_DEV = process.env.NODE_ENV === 'development'

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable caching in dev mode for fresh data on every request
            staleTime: IS_DEV ? 0 : 5 * 60 * 1000, // 0 in dev, 5 minutes in prod
            gcTime: IS_DEV ? 0 : 10 * 60 * 1000, // 0 in dev, 10 minutes in prod
            // Always refetch in dev mode
            refetchOnMount: IS_DEV ? true : 'always',
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Network mode for offline support
            networkMode: 'offlineFirst',
          },
          mutations: {
            retry: 1,
            networkMode: 'offlineFirst',
          },
        },
      })
  )

  // Initialize simplified cache manager - stable dependency array
  useEffect(() => {
    simplifiedCacheManager.setQueryClient(queryClient)
    
    // Log in dev mode that caching is disabled
    if (IS_DEV) {
      logger.debug('[Dev Mode] Caching is disabled - all queries will refetch on every request')
    }
  }, [queryClient]) // Only queryClient as dependency - IS_DEV is constant

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
