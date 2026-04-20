/**
 * Performance Optimization Utilities
 * Database query optimization, caching strategies, and performance monitoring
 */

import { createServiceClient } from '@/lib/supabase/service'

interface QueryOptimization {
  useIndex: boolean
  limitResults: number
  selectOnly: string[]
  cacheKey?: string
  ttl?: number
}

interface DatabaseMetrics {
  queryCount: number
  averageQueryTime: number
  slowQueries: number
  cacheHitRate: number
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private queryMetrics: DatabaseMetrics = {
    queryCount: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    cacheHitRate: 0
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  /**
   * Optimized database query with caching
   */
  async optimizedQuery<T>(
    table: string,
    options: {
      select?: string
      filters?: Record<string, any>
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
      cacheKey?: string
      ttl?: number
    },
    tenantId: string
  ): Promise<T[]> {
    const startTime = Date.now()
    const cacheKey = options.cacheKey || `${table}_${JSON.stringify(options)}_${tenantId}`
    
    // Check cache first
    if (options.cacheKey || options.ttl) {
      const cached = this.queryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.queryMetrics.cacheHitRate = (this.queryMetrics.cacheHitRate + 1) / 2
        return cached.data
      }
    }

    try {
      const supabase = createServiceClient()
      let query = supabase.from(table).select(options.select || '*')

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        })
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      const queryTime = Date.now() - startTime
      this.updateQueryMetrics(queryTime)

      // Cache the result
      if (options.cacheKey || options.ttl) {
        this.queryCache.set(cacheKey, {
          data: data || [],
          timestamp: Date.now(),
          ttl: options.ttl || 300000 // 5 minutes default
        })
      }

      return data || []

    } catch (error) {
      // Database query error
      throw error
    }
  }

  /**
   * Batch multiple queries for better performance
   */
  async batchQueries<T>(
    queries: Array<{
      table: string
      options: any
      tenantId: string
    }>
  ): Promise<T[][]> {
    const startTime = Date.now()
    
    try {
      const supabase = createServiceClient()
      const promises = queries.map(async ({ table, options, tenantId }) => {
        let query = supabase.from(table).select(options.select || '*')
        
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value)
            }
          })
        }

        if (options.orderBy) {
          query = query.order(options.orderBy.column, { 
            ascending: options.orderBy.ascending !== false 
          })
        }

        if (options.limit) {
          query = query.limit(options.limit)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
      })

      const results = await Promise.all(promises)
      const queryTime = Date.now() - startTime
      this.updateQueryMetrics(queryTime)

      return results

    } catch (error) {
      // Batch query error
      throw error
    }
  }

  /**
   * Optimized webhook processing with connection pooling
   */
  async processWebhookWithOptimization<T>(
    operation: () => Promise<T>,
    context: {
      callId: string
      tenantId: string
      functionName: string
    }
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      // Use connection pooling if available
      const result = await operation()
      
      const duration = Date.now() - startTime
      
      // Log performance metrics
      if (duration > 1000) { // Log slow operations
        // Slow webhook operation detected
      }

      return result

    } catch (error) {
      // Webhook operation failed
      throw error
    }
  }

  /**
   * Memory optimization for large datasets
   */
  processLargeDataset<T>(
    data: T[],
    processor: (item: T) => any,
    batchSize = 100
  ): any[] {
    const results: any[] = []
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const processedBatch = batch.map(processor)
      results.push(...processedBatch)
      
      // Allow garbage collection between batches
      if (i % (batchSize * 10) === 0) {
        if (global.gc) {
          global.gc()
        }
      }
    }
    
    return results
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(queryTime: number): void {
    this.queryMetrics.queryCount++
    
    // Update average query time
    this.queryMetrics.averageQueryTime = 
      (this.queryMetrics.averageQueryTime * (this.queryMetrics.queryCount - 1) + queryTime) / 
      this.queryMetrics.queryCount

    // Track slow queries (> 1 second)
    if (queryTime > 1000) {
      this.queryMetrics.slowQueries++
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): DatabaseMetrics {
    return { ...this.queryMetrics }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(olderThanMinutes = 30): void {
    const cutoff = Date.now() - (olderThanMinutes * 60 * 1000)
    
    for (const [key, value] of this.queryCache.entries()) {
      if (value.timestamp < cutoff) {
        this.queryCache.delete(key)
      }
    }
  }

  /**
   * Optimize database indexes (for manual execution)
   */
  getIndexRecommendations(): string[] {
    return [
      'CREATE INDEX IF NOT EXISTS idx_clients_tenant_phone ON clients(tenant_id, phone);',
      'CREATE INDEX IF NOT EXISTS idx_appointments_tenant_starts_at ON appointments(tenant_id, starts_at);',
      'CREATE INDEX IF NOT EXISTS idx_calls_tenant_created_at ON calls(tenant_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_services_tenant_active ON services(tenant_id, is_active);',
      'CREATE INDEX IF NOT EXISTS idx_service_areas_tenant_active ON service_area_coverage(tenant_id, is_active);',
      'CREATE INDEX IF NOT EXISTS idx_company_settings_tenant ON company_settings(tenant_id);'
    ]
  }

  /**
   * Database connection health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: DatabaseMetrics
    recommendations: string[]
  }> {
    const recommendations: string[] = []
    
    // Check query performance
    if (this.queryMetrics.averageQueryTime > 500) {
      recommendations.push('Consider optimizing slow queries')
    }
    
    if (this.queryMetrics.slowQueries > this.queryMetrics.queryCount * 0.1) {
      recommendations.push('High number of slow queries detected')
    }
    
    if (this.queryMetrics.cacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate - consider increasing cache TTL')
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (recommendations.length > 2) {
      status = 'unhealthy'
    } else if (recommendations.length > 0) {
      status = 'degraded'
    }

    return {
      status,
      metrics: this.queryMetrics,
      recommendations
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Export types
export type { QueryOptimization, DatabaseMetrics }
