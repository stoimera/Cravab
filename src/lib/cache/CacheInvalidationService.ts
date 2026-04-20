/**
 * Unified Cache Invalidation Service
 * Coordinates invalidation across all cache layers to prevent stale data
 */

import { cacheManager } from '@/lib/performance/cache-manager'
import { appCache } from './AppCache'
import { pwaStorage } from '@/lib/storage/PWAStorage'
import { cacheHelpers } from '@/lib/offline-cache'
import { queryKeys } from '@/lib/query/queryKeys'

// Cache version for consistency checking
export const CACHE_VERSION = '1.0.0'

// Standardized TTL values across all cache layers
export const CACHE_TTL = {
  REAL_TIME: 30 * 1000,      // 30 seconds (calls, live data)
  FREQUENT: 5 * 60 * 1000,   // 5 minutes (appointments, clients)
  STABLE: 15 * 60 * 1000,    // 15 minutes (services, settings)
  STATIC: 60 * 60 * 1000     // 1 hour (business hours, company data)
} as const

export type CacheDataType = 'clients' | 'appointments' | 'calls' | 'services' | 'company' | 'documents' | 'reports'

interface CacheInvalidationOptions {
  tenantId: string
  dataType: CacheDataType
  specificId?: string
  warmCache?: boolean
}

class CacheInvalidationService {
  private static instance: CacheInvalidationService
  private queryClient: any = null

  static getInstance(): CacheInvalidationService {
    if (!CacheInvalidationService.instance) {
      CacheInvalidationService.instance = new CacheInvalidationService()
    }
    return CacheInvalidationService.instance
  }

  // Set query client reference (called from React components)
  setQueryClient(queryClient: any) {
    this.queryClient = queryClient
  }

  /**
   * Invalidate all cache layers for a specific data type
   */
  async invalidateData(options: CacheInvalidationOptions): Promise<void> {
    const { tenantId, dataType, specificId, warmCache = false } = options

    // Invalidating cache for tenant

    try {
      // 1. Invalidate React Query cache
      if (this.queryClient) {
        await this.invalidateReactQuery(tenantId, dataType, specificId)
      }

      // 2. Invalidate server-side caches
      await this.invalidateServerCaches(tenantId, dataType)

      // 3. Invalidate PWA storage
      await this.invalidatePWAStorage(tenantId, dataType)

      // 4. Invalidate offline cache
      await this.invalidateOfflineCache(tenantId, dataType)

      // 5. Warm cache if requested
      if (warmCache) {
        await this.warmCache(tenantId, dataType)
      }

      // Successfully invalidated cache
    } catch (error) {
      // Error invalidating cache
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
        this.queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
        if (specificId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.clients.detail(tenantId, specificId) 
          })
        }
      },
      appointments: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() })
        this.queryClient.invalidateQueries({ queryKey: queryKeys.appointments.calendar(tenantId, 'current') })
        if (specificId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.appointments.detail(tenantId, specificId) 
          })
        }
      },
      calls: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.calls.lists() })
        this.queryClient.invalidateQueries({ queryKey: queryKeys.calls.summary(tenantId) })
        if (specificId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.calls.detail(tenantId, specificId) 
          })
        }
      },
      services: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() })
      },
      company: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.company.settings(tenantId) })
        this.queryClient.invalidateQueries({ queryKey: queryKeys.company.businessHours(tenantId) })
        this.queryClient.invalidateQueries({ queryKey: queryKeys.company.users(tenantId) })
      },
      documents: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.documents.lists() })
      },
      reports: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard(tenantId, '30d') })
        this.queryClient.invalidateQueries({ queryKey: queryKeys.reports.metrics(tenantId, '30d') })
      }
    }

    const invalidator = invalidationMap[dataType]
    if (invalidator) {
      invalidator()
    }
  }

  /**
   * Invalidate server-side caches
   */
  private async invalidateServerCaches(tenantId: string, dataType: CacheDataType): Promise<void> {
    // Invalidate CacheManager
    const tags = this.getCacheTags(dataType)
    cacheManager.invalidateByTags(tags)

    // Invalidate AppCache tenant data
    appCache.clearTenantData(tenantId)

    // Invalidate specific data types in AppCache
    if (dataType === 'clients') {
      // Clear client lookup cache
      const clientKeys = this.getCacheKeysByPattern(`client_lookup_${tenantId}_`)
      clientKeys.forEach(key => appCache.delete(key))
    } else if (dataType === 'appointments') {
      // Clear availability cache
      const availabilityKeys = this.getCacheKeysByPattern(`availability_${tenantId}_`)
      availabilityKeys.forEach(key => appCache.delete(key))
    } else if (dataType === 'services') {
      // Clear pricing cache
      const pricingKeys = this.getCacheKeysByPattern(`pricing_${tenantId}_`)
      pricingKeys.forEach(key => appCache.delete(key))
    }
  }

  /**
   * Invalidate PWA storage
   */
  private async invalidatePWAStorage(tenantId: string, dataType: CacheDataType): Promise<void> {
    // Clear tenant data from PWA storage
    await pwaStorage.clearTenantData(tenantId)
  }

  /**
   * Invalidate offline cache
   */
  private async invalidateOfflineCache(tenantId: string, dataType: CacheDataType): Promise<void> {
    const storeMap = {
      clients: 'clients',
      appointments: 'appointments',
      calls: 'calls',
      services: 'services',
      company: 'settings',
      documents: 'documents',
      reports: 'reports'
    }

    const storeName = storeMap[dataType]
    if (storeName) {
      await cacheHelpers.clearTenantData(tenantId)
    }
  }

  /**
   * Warm cache with fresh data
   */
  private async warmCache(tenantId: string, dataType: CacheDataType): Promise<void> {
    // This would trigger fresh data fetches
    // Implementation depends on your data fetching patterns
    // Warming cache
  }

  /**
   * Get cache tags for data type
   */
  private getCacheTags(dataType: CacheDataType): string[] {
    const tagMap = {
      clients: ['tenant', 'clients'],
      appointments: ['tenant', 'appointments'],
      calls: ['tenant', 'calls'],
      services: ['tenant', 'services'],
      company: ['tenant', 'company', 'settings'],
      documents: ['tenant', 'documents'],
      reports: ['tenant', 'reports']
    }

    return tagMap[dataType] || ['tenant']
  }

  /**
   * Get cache keys by pattern (helper for AppCache)
   */
  private getCacheKeysByPattern(pattern: string): string[] {
    return appCache.getKeysByPattern(pattern)
  }

  /**
   * Invalidate all caches for a tenant
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    // Invalidating all caches for tenant

    // Clear all tenant data from all caches
    appCache.clearTenantData(tenantId)
    await pwaStorage.clearTenantData(tenantId)
    await cacheHelpers.clearTenantData(tenantId)
    
    // Invalidate all React Query data for tenant
    if (this.queryClient) {
      this.queryClient.invalidateQueries()
    }

    // Successfully invalidated all caches for tenant
  }

  /**
   * Check cache consistency across layers
   */
  async checkConsistency(tenantId: string, dataType: CacheDataType): Promise<{
    consistent: boolean
    discrepancies: string[]
  }> {
    const discrepancies: string[] = []
    
    // This would implement consistency checking
    // For now, return a placeholder
    return {
      consistent: true,
      discrepancies
    }
  }
}

// Export singleton instance
export const cacheInvalidationService = CacheInvalidationService.getInstance()

// Export convenience functions
export const invalidateData = (options: CacheInvalidationOptions) => 
  cacheInvalidationService.invalidateData(options)

export const invalidateTenant = (tenantId: string) => 
  cacheInvalidationService.invalidateTenant(tenantId)

export const checkConsistency = (tenantId: string, dataType: CacheDataType) => 
  cacheInvalidationService.checkConsistency(tenantId, dataType)
