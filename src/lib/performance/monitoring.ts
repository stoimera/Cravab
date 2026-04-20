/**
 * Performance Monitoring for Appointment Updates
 * Tracks query performance and optimization metrics
 */

interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
  queryCount: number
  cacheHits: number
  cacheMisses: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private readonly MAX_METRICS = 1000

  /**
   * Record performance metrics
   */
  record(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    })

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow: number = 5 * 60 * 1000): {
    averageDuration: number
    successRate: number
    totalOperations: number
    slowQueries: PerformanceMetrics[]
    errorRate: number
  } {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < timeWindow
    )

    if (recentMetrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalOperations: 0,
        slowQueries: [],
        errorRate: 0
      }
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0)
    const successfulOps = recentMetrics.filter(m => m.success).length
    const errorOps = recentMetrics.filter(m => !m.success).length
    const slowQueries = recentMetrics.filter(m => m.duration > 1000) // > 1 second

    return {
      averageDuration: totalDuration / recentMetrics.length,
      successRate: (successfulOps / recentMetrics.length) * 100,
      totalOperations: recentMetrics.length,
      slowQueries,
      errorRate: (errorOps / recentMetrics.length) * 100
    }
  }

  /**
   * Get slow queries for optimization
   */
  getSlowQueries(threshold: number = 500): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold)
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThan: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance decorator for automatic monitoring
 */
export function withPerformanceMonitoring(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      let success = true
      let error: string | undefined

      try {
        const result = await method.apply(this, args)
        return result
      } catch (err) {
        success = false
        error = err instanceof Error ? err.message : 'Unknown error'
        throw err
      } finally {
        const duration = Date.now() - startTime
        
        performanceMonitor.record({
          operation,
          duration,
          success,
          error,
          queryCount: 0, // This would be tracked by the actual implementation
          cacheHits: 0,
          cacheMisses: 0
        })
      }
    }
  }
}

/**
 * Query performance tracker
 */
export class QueryTracker {
  private queryCount = 0
  private cacheHits = 0
  private cacheMisses = 0

  incrementQuery(): void {
    this.queryCount++
  }

  recordCacheHit(): void {
    this.cacheHits++
  }

  recordCacheMiss(): void {
    this.cacheMisses++
  }

  getStats() {
    return {
      queryCount: this.queryCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) * 100
    }
  }

  reset(): void {
    this.queryCount = 0
    this.cacheHits = 0
    this.cacheMisses = 0
  }
}
