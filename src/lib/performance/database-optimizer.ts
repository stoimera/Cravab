/**
 * Database performance optimization utilities
 */

import { createServiceClient } from '@/lib/supabase/service'

interface QueryCache {
  data: any
  timestamp: number
  ttl: number
}

interface QueryMetrics {
  queryCount: number
  averageQueryTime: number
  slowQueries: number
  cacheHits: number
  cacheMisses: number
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private queryCache = new Map<string, QueryCache>()
  private metrics: QueryMetrics = {
    queryCount: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
  private slowQueryThreshold = 1000 // 1 second

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer()
    }
    return DatabaseOptimizer.instance
  }

  /**
   * Optimized query with caching
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
    const cacheKey = options.cacheKey || this.generateCacheKey(table, options, tenantId)
    
    // Check cache first
    if (options.cacheKey || options.ttl) {
      const cached = this.queryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.metrics.cacheHits++
        return cached.data
      }
      this.metrics.cacheMisses++
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
      this.updateMetrics(queryTime)

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
   * Batch multiple queries
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
      const promises = queries.map(({ table, options, tenantId }) => {
        let query = supabase.from(table).select(options.select || '*')
        
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value)
            }
          })
        }
        
        return query
      })

      const results = await Promise.all(promises)
      const queryTime = Date.now() - startTime
      this.updateMetrics(queryTime)

      return results.map(result => result.data || [])
    } catch (error) {
      // Batch query error
      throw error
    }
  }

  /**
   * Get query metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key)
      }
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    table: string, 
    options: any, 
    tenantId: string
  ): string {
    return `${tenantId}:${table}:${JSON.stringify(options)}`
  }

  /**
   * Update metrics
   */
  private updateMetrics(queryTime: number): void {
    this.metrics.queryCount++
    
    // Update average query time
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + queryTime) / 
      this.metrics.queryCount

    // Track slow queries
    if (queryTime > this.slowQueryThreshold) {
      this.metrics.slowQueries++
    }
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.metrics.averageQueryTime > 500) {
      recommendations.push('Consider adding database indexes for frequently queried columns')
    }
    
    if (this.metrics.slowQueries > this.metrics.queryCount * 0.1) {
      recommendations.push('High number of slow queries detected - review query optimization')
    }
    
    const cacheHitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
    if (cacheHitRate < 0.5 && this.metrics.cacheHits + this.metrics.cacheMisses > 10) {
      recommendations.push('Low cache hit rate - consider increasing cache TTL')
    }

    return recommendations
  }
}

// Cleanup expired cache every 5 minutes
const optimizer = DatabaseOptimizer.getInstance()
setInterval(() => {
  optimizer.clearExpiredCache()
}, 5 * 60 * 1000)

export { DatabaseOptimizer }
export const databaseOptimizer = optimizer
