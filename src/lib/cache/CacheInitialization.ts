/**
 * Cache Initialization Service
 * Sets up cache coordination and initializes the unified invalidation service
 */

import { cacheInvalidationService } from './CacheInvalidationService'
import { cacheHealthMonitor } from './CacheHealthMonitor'

class CacheInitializationService {
  private static instance: CacheInitializationService
  private isInitialized = false

  static getInstance(): CacheInitializationService {
    if (!CacheInitializationService.instance) {
      CacheInitializationService.instance = new CacheInitializationService()
    }
    return CacheInitializationService.instance
  }

  /**
   * Initialize cache coordination
   */
  async initialize(queryClient?: any): Promise<void> {
    if (this.isInitialized) {
      // Cache already initialized
      return
    }

    // Initializing cache coordination

    try {
      // Set query client if provided
      if (queryClient) {
        cacheInvalidationService.setQueryClient(queryClient)
        // Query client set for cache invalidation
      }

      // Run initial health check
      const healthReport = await cacheHealthMonitor.generateHealthReport()
      // Initial health check completed

      // Log any issues
      if (healthReport.overall !== 'healthy') {
        // Cache health issues detected
      }

      this.isInitialized = true
      // Cache coordination initialized successfully
    } catch (error) {
      // Failed to initialize cache coordination
      throw error
    }
  }

  /**
   * Check if cache is initialized
   */
  isCacheInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Reset initialization state
   */
  reset(): void {
    this.isInitialized = false
    // Cache initialization state reset
  }
}

// Export singleton instance
export const cacheInitializationService = CacheInitializationService.getInstance()

// Export convenience functions
export const initializeCache = (queryClient?: any) => 
  cacheInitializationService.initialize(queryClient)

export const isCacheInitialized = () => 
  cacheInitializationService.isCacheInitialized()
