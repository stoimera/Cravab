import { logger } from '@/lib/logger'
/**
 * Simplified Cache Manager - 2 Layer Architecture
 * 
 * Layer 1: React Query (Client-side data fetching and caching)
 * Layer 2: Service Worker Cache (PWA offline support)
 * 
 * This replaces the previous 5-layer system:
 * - AppCache (removed)
 * - CacheManager (removed) 
 * - PWAStorage (removed)
 * - OfflineCache (removed)
 * - React Query (kept)
 * - Service Worker (kept)
 */

import { QueryClient } from '@tanstack/react-query'

// Standardized TTL values - Reduced for less aggressive caching
export const CACHE_TTL = {
  REAL_TIME: 10 * 1000,      // 10 seconds (calls, live data) - reduced from 30 seconds
  FREQUENT: 1 * 60 * 1000,   // 1 minute (appointments, clients) - reduced from 5 minutes
  STABLE: 5 * 60 * 1000,     // 5 minutes (services, settings) - reduced from 15 minutes
  STATIC: 15 * 60 * 1000     // 15 minutes (business hours, company data) - reduced from 1 hour
} as const

export type CacheDataType = 'clients' | 'appointments' | 'calls' | 'services' | 'company' | 'documents' | 'reports' | 'users' | 'user-settings' | 'company-settings' | 'notification-settings' | 'vapi-config' | 'service-areas'

interface CacheInvalidationOptions {
  tenantId: string
  dataType: CacheDataType
  specificId?: string
  warmCache?: boolean
}

// Check dev mode outside class to ensure it's stable
const IS_DEV = process.env.NODE_ENV === 'development'

class SimplifiedCacheManager {
  private static instance: SimplifiedCacheManager
  private queryClient: QueryClient | null = null

  static getInstance(): SimplifiedCacheManager {
    if (!SimplifiedCacheManager.instance) {
      SimplifiedCacheManager.instance = new SimplifiedCacheManager()
    }
    return SimplifiedCacheManager.instance
  }

  // Set query client reference
  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Invalidate data across both cache layers
   */
  async invalidateData(options: CacheInvalidationOptions): Promise<void> {
    // Skip cache operations in dev mode (caching is disabled, so no need to invalidate)
    if (IS_DEV) {
      return
    }

    const { tenantId, dataType, specificId, warmCache = false } = options

    // Invalidating cache for tenant

    try {
      // 1. Invalidate React Query cache
      if (this.queryClient) {
        await this.invalidateReactQuery(tenantId, dataType, specificId)
      }

      // 2. Invalidate Service Worker cache
      await this.invalidateServiceWorkerCache(tenantId, dataType)

      // 3. Warm cache if requested
      if (warmCache) {
        await this.warmCache(tenantId, dataType)
      }

      // Successfully invalidated cache
    } catch (error) {
      logger.error(`[SimplifiedCache] Error invalidating ${dataType}:`, error)
      throw error
    }
  }

  /**
   * Invalidate React Query cache
   */
  private async invalidateReactQuery(tenantId: string, dataType: CacheDataType, specificId?: string): Promise<void> {
    if (!this.queryClient) return

    const invalidationMap = {
      clients: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['clients', tenantId] })
        if (specificId) {
          this.queryClient!.invalidateQueries({ 
            queryKey: ['clients', tenantId, specificId] 
          })
        }
      },
      appointments: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['appointments', tenantId] })
        this.queryClient!.invalidateQueries({ queryKey: ['appointments', 'calendar', tenantId] })
        if (specificId) {
          this.queryClient!.invalidateQueries({ 
            queryKey: ['appointments', tenantId, specificId] 
          })
        }
      },
      calls: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['calls', tenantId] })
        this.queryClient!.invalidateQueries({ queryKey: ['calls', 'summary', tenantId] })
        if (specificId) {
          this.queryClient!.invalidateQueries({ 
            queryKey: ['calls', tenantId, specificId] 
          })
        }
      },
      services: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['services', tenantId] })
      },
      company: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['company', 'settings', tenantId] })
        this.queryClient!.invalidateQueries({ queryKey: ['company', 'businessHours', tenantId] })
        this.queryClient!.invalidateQueries({ queryKey: ['company', 'users', tenantId] })
      },
      documents: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['documents', tenantId] })
      },
      reports: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['reports', 'dashboard', tenantId] })
        this.queryClient!.invalidateQueries({ queryKey: ['reports', 'metrics', tenantId] })
      },
      users: () => {
        this.queryClient!.invalidateQueries({ queryKey: ['users', tenantId] })
        if (specificId) {
          this.queryClient!.invalidateQueries({ 
            queryKey: ['users', tenantId, specificId] 
          })
        }
      },
      'user-settings': () => {
        this.queryClient!.invalidateQueries({ queryKey: ['user-settings'] })
      },
      'company-settings': () => {
        this.queryClient!.invalidateQueries({ queryKey: ['company-settings'] })
      },
      'notification-settings': () => {
        this.queryClient!.invalidateQueries({ queryKey: ['notification-settings'] })
      },
      'vapi-config': () => {
        this.queryClient!.invalidateQueries({ queryKey: ['vapi-config'] })
      },
      'service-areas': () => {
        this.queryClient!.invalidateQueries({ queryKey: ['service-areas'] })
      }
    }

    const invalidator = invalidationMap[dataType]
    if (invalidator) {
      invalidator()
    }
  }

  /**
   * Invalidate Service Worker cache
   */
  private async invalidateServiceWorkerCache(tenantId: string, dataType: CacheDataType): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        // Send message to service worker to invalidate specific cache
        navigator.serviceWorker.controller.postMessage({
          type: 'INVALIDATE_CACHE',
          tenantId,
          dataType
        })
      } catch (error) {
        // Failed to invalidate service worker cache
      }
    }
  }

  /**
   * Warm cache with fresh data
   */
  private async warmCache(tenantId: string, dataType: CacheDataType): Promise<void> {
    if (!this.queryClient) return

    // Trigger fresh data fetches for the data type
    const warmMap = {
      clients: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['clients', tenantId],
          queryFn: () => fetch(`/api/clients?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      appointments: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['appointments', tenantId],
          queryFn: () => fetch(`/api/appointments?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      calls: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['calls', tenantId],
          queryFn: () => fetch(`/api/calls?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      services: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['services', tenantId],
          queryFn: () => fetch(`/api/services?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      company: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['company', 'settings', tenantId],
          queryFn: () => fetch(`/api/company/settings?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      documents: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['documents', tenantId],
          queryFn: () => fetch(`/api/documents?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      reports: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['reports', 'dashboard', tenantId],
          queryFn: () => fetch(`/api/reports/dashboard?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      users: () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['users', tenantId],
          queryFn: () => fetch(`/api/company/users?tenantId=${tenantId}`).then(res => res.json())
        })
      },
      'user-settings': () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['user-settings'],
          queryFn: () => fetch(`/api/user-settings`).then(res => res.json())
        })
      },
      'company-settings': () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['company-settings'],
          queryFn: () => fetch(`/api/company-settings`).then(res => res.json())
        })
      },
      'notification-settings': () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['notification-settings'],
          queryFn: () => fetch(`/api/notification-settings`).then(res => res.json())
        })
      },
      'vapi-config': () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['vapi-config'],
          queryFn: () => fetch(`/api/vapi/config`).then(res => res.json())
        })
      },
      'service-areas': () => {
        this.queryClient!.prefetchQuery({
          queryKey: ['service-areas'],
          queryFn: () => fetch(`/api/service-areas`).then(res => res.json())
        })
      }
    }

    const warmer = warmMap[dataType]
    if (warmer) {
      warmer()
    }
  }

  /**
   * Invalidate all caches for a tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {

    // Invalidate all React Query data for tenant
    if (this.queryClient) {
      this.queryClient.invalidateQueries()
    }

    // Invalidate Service Worker cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'INVALIDATE_ALL_CACHES',
          tenantId
        })
      } catch (error) {
        // Failed to invalidate service worker cache
      }
    }

    // Successfully invalidated all caches
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    reactQuery: {
      queryCount: number
      cacheSize: number
    }
    serviceWorker: {
      available: boolean
      controlled: boolean
    }
  } {
    const reactQueryStats = this.queryClient ? {
      queryCount: this.queryClient.getQueryCache().getAll().length,
      cacheSize: JSON.stringify(this.queryClient.getQueryCache().getAll()).length
    } : {
      queryCount: 0,
      cacheSize: 0
    }

    const serviceWorkerStats = {
      available: 'serviceWorker' in navigator,
      controlled: 'serviceWorker' in navigator && !!navigator.serviceWorker.controller
    }

    return {
      reactQuery: reactQueryStats,
      serviceWorker: serviceWorkerStats
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    // Clearing all caches

    // Clear React Query cache
    if (this.queryClient) {
      this.queryClient.clear()
    }

    // Clear Service Worker cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_ALL_CACHES'
        })
      } catch (error) {
        // Failed to clear service worker cache
      }
    }

    // Successfully cleared all caches
  }
}

// Export singleton instance
export const simplifiedCacheManager = SimplifiedCacheManager.getInstance()

// Export convenience functions
export const invalidateData = (options: CacheInvalidationOptions) => 
  simplifiedCacheManager.invalidateData(options)

export const invalidateTenant = (tenantId: string) => 
  simplifiedCacheManager.invalidateTenant(tenantId)

export const getCacheStats = () => 
  simplifiedCacheManager.getCacheStats()

export const clearAllCaches = () => 
  simplifiedCacheManager.clearAllCaches()
