/**
 * Cache Health Monitoring Service
 * Monitors cache consistency and performance across all layers
 */

import { appCache } from './AppCache'
import { cacheManager } from '@/lib/performance/cache-manager'
import { pwaStorage } from '@/lib/storage/PWAStorage'
import { cacheHelpers } from '@/lib/offline-cache'
import { CACHE_VERSION } from './CacheInvalidationService'

interface CacheHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  layers: {
    appCache: LayerHealth
    cacheManager: LayerHealth
    pwaStorage: LayerHealth
    offlineCache: LayerHealth
  }
  recommendations: string[]
  timestamp: number
}

interface LayerHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  size: number
  hitRate?: number
  issues: string[]
}

interface ConsistencyCheck {
  consistent: boolean
  discrepancies: {
    layer: string
    key: string
    expected: any
    actual: any
  }[]
}

class CacheHealthMonitor {
  private static instance: CacheHealthMonitor
  private healthHistory: CacheHealthReport[] = []
  private maxHistorySize = 100

  static getInstance(): CacheHealthMonitor {
    if (!CacheHealthMonitor.instance) {
      CacheHealthMonitor.instance = new CacheHealthMonitor()
    }
    return CacheHealthMonitor.instance
  }

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport(tenantId?: string): Promise<CacheHealthReport> {
    const timestamp = Date.now()
    const layers = await this.checkAllLayers(tenantId)
    const overall = this.determineOverallHealth(layers)
    const recommendations = this.generateRecommendations(layers)

    const report: CacheHealthReport = {
      overall,
      layers,
      recommendations,
      timestamp
    }

    // Store in history
    this.healthHistory.push(report)
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift()
    }

    return report
  }

  /**
   * Check all cache layers
   */
  private async checkAllLayers(tenantId?: string): Promise<CacheHealthReport['layers']> {
    const [appCacheHealth, cacheManagerHealth, pwaStorageHealth, offlineCacheHealth] = await Promise.all([
      this.checkAppCache(tenantId),
      this.checkCacheManager(tenantId),
      this.checkPWAStorage(tenantId),
      this.checkOfflineCache(tenantId)
    ])

    return {
      appCache: appCacheHealth,
      cacheManager: cacheManagerHealth,
      pwaStorage: pwaStorageHealth,
      offlineCache: offlineCacheHealth
    }
  }

  /**
   * Check AppCache health
   */
  private async checkAppCache(tenantId?: string): Promise<LayerHealth> {
    const issues: string[] = []
    const stats = appCache.getStats()
    const version = appCache.getCacheVersion()

    // Check version consistency
    if (version !== CACHE_VERSION) {
      issues.push(`Version mismatch: expected ${CACHE_VERSION}, got ${version}`)
    }

    // Check cache size
    if (stats.total > 1000) {
      issues.push(`Cache size too large: ${stats.total} entries`)
    }

    // Check for tenant-specific issues
    if (tenantId) {
      const tenantData = appCache.getTenantData(tenantId)
      if (!tenantData) {
        issues.push(`No tenant data cached for ${tenantId}`)
      }
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy',
      version,
      size: stats.total,
      issues
    }
  }

  /**
   * Check CacheManager health
   */
  private async checkCacheManager(tenantId?: string): Promise<LayerHealth> {
    const issues: string[] = []
    const stats = cacheManager.getStats()
    const version = cacheManager.getCacheVersion()

    // Check version consistency
    if (version !== CACHE_VERSION) {
      issues.push(`Version mismatch: expected ${CACHE_VERSION}, got ${version}`)
    }

    // Check hit rate
    if (stats.hitRate < 0.5) {
      issues.push(`Low hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
    }

    // Check cache size
    if (stats.size > 1000) {
      issues.push(`Cache size too large: ${stats.size} entries`)
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy',
      version,
      size: stats.size,
      hitRate: stats.hitRate,
      issues
    }
  }

  /**
   * Check PWA Storage health
   */
  private async checkPWAStorage(tenantId?: string): Promise<LayerHealth> {
    const issues: string[] = []
    const version = pwaStorage.getCacheVersion()

    // Check version consistency
    if (version !== CACHE_VERSION) {
      issues.push(`Version mismatch: expected ${CACHE_VERSION}, got ${version}`)
    }

    try {
      const stats = await pwaStorage.getStorageStats()
      if (stats) {
        const totalSize = Object.values(stats).reduce((sum: number, count: any) => sum + count, 0)
        if (totalSize > 5000) {
          issues.push(`Storage size too large: ${totalSize} entries`)
        }
      }
    } catch (error) {
      issues.push(`Failed to get storage stats: ${error}`)
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy',
      version,
      size: 0, // Will be populated by stats if available
      issues
    }
  }

  /**
   * Check Offline Cache health
   */
  private async checkOfflineCache(tenantId?: string): Promise<LayerHealth> {
    const issues: string[] = []
    const version = '1.0.0' // OfflineCache version

    // Check version consistency
    if (version !== CACHE_VERSION) {
      issues.push(`Version mismatch: expected ${CACHE_VERSION}, got ${version}`)
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy',
      version,
      size: 0,
      issues
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallHealth(layers: CacheHealthReport['layers']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(layers).map(layer => layer.status)
    
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy'
    } else if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy'
    } else {
      return 'degraded'
    }
  }

  /**
   * Generate recommendations based on health check
   */
  private generateRecommendations(layers: CacheHealthReport['layers']): string[] {
    const recommendations: string[] = []

    // Check for version mismatches
    const versionMismatches = Object.entries(layers).filter(([_, layer]) => 
      layer.version !== CACHE_VERSION
    )
    if (versionMismatches.length > 0) {
      recommendations.push(`Update cache versions: ${versionMismatches.map(([name, _]) => name).join(', ')}`)
    }

    // Check for low hit rates
    if (layers.cacheManager.hitRate && layers.cacheManager.hitRate < 0.5) {
      recommendations.push('Consider increasing cache TTL or improving cache key strategies')
    }

    // Check for large cache sizes
    const largeCaches = Object.entries(layers).filter(([_, layer]) => layer.size > 1000)
    if (largeCaches.length > 0) {
      recommendations.push(`Consider cache cleanup: ${largeCaches.map(([name, _]) => name).join(', ')}`)
    }

    // Check for unhealthy layers
    const unhealthyLayers = Object.entries(layers).filter(([_, layer]) => layer.status === 'unhealthy')
    if (unhealthyLayers.length > 0) {
      recommendations.push(`Investigate unhealthy layers: ${unhealthyLayers.map(([name, _]) => name).join(', ')}`)
    }

    return recommendations
  }

  /**
   * Check cache consistency across layers
   */
  async checkConsistency(tenantId: string, dataType: string): Promise<ConsistencyCheck> {
    const discrepancies: ConsistencyCheck['discrepancies'] = []

    try {
      // This would implement actual consistency checking
      // For now, return a placeholder
      return {
        consistent: true,
        discrepancies
      }
    } catch (error) {
      return {
        consistent: false,
        discrepancies: [{
          layer: 'error',
          key: 'consistency_check',
          expected: 'success',
          actual: error
        }]
      }
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(): CacheHealthReport[] {
    return [...this.healthHistory]
  }

  /**
   * Get latest health report
   */
  getLatestHealthReport(): CacheHealthReport | null {
    return this.healthHistory[this.healthHistory.length - 1] || null
  }

  /**
   * Clear health history
   */
  clearHealthHistory(): void {
    this.healthHistory = []
  }

  /**
   * Get cache performance metrics
   */
  getPerformanceMetrics(): {
    averageHealthScore: number
    unhealthyPeriods: number
    recommendationsCount: number
  } {
    if (this.healthHistory.length === 0) {
      return {
        averageHealthScore: 0,
        unhealthyPeriods: 0,
        recommendationsCount: 0
      }
    }

    const healthScores = this.healthHistory.map(report => {
      switch (report.overall) {
        case 'healthy': return 1
        case 'degraded': return 0.5
        case 'unhealthy': return 0
        default: return 0
      }
    })

    const averageHealthScore = healthScores.reduce((sum: number, score: any) => sum + score, 0) / healthScores.length
    const unhealthyPeriods = this.healthHistory.filter(report => report.overall === 'unhealthy').length
    const recommendationsCount = this.healthHistory.reduce((sum: number, report: any) => sum + report.recommendations.length, 0)

    return {
      averageHealthScore,
      unhealthyPeriods,
      recommendationsCount
    }
  }
}

// Export singleton instance
export const cacheHealthMonitor = CacheHealthMonitor.getInstance()

// Export convenience functions
export const generateHealthReport = (tenantId?: string) => 
  cacheHealthMonitor.generateHealthReport(tenantId)

export const checkConsistency = (tenantId: string, dataType: string) => 
  cacheHealthMonitor.checkConsistency(tenantId, dataType)

export const getHealthHistory = () => 
  cacheHealthMonitor.getHealthHistory()

export const getPerformanceMetrics = () => 
  cacheHealthMonitor.getPerformanceMetrics()
