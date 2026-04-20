// Performance Monitoring and Optimization System
// Production-ready performance tracking for 10-20 users per month

import { NextRequest, NextResponse } from 'next/server'
import { ErrorLogger, LogLevel } from './error-handling'
import { logger } from '@/lib/logger'

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: string
  context: {
    endpoint?: string
    method?: string
    userId?: string
    tenantId?: string
    userAgent?: string
    ipAddress?: string
  }
  tags?: Record<string, string>
}

interface PerformanceThreshold {
  name: string
  warning: number
  critical: number
  unit: string
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private thresholds: Map<string, PerformanceThreshold> = new Map()
  private logger: ErrorLogger

  private constructor() {
    this.logger = ErrorLogger.getInstance()
    this.setupDefaultThresholds()
    this.startCleanupInterval()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private setupDefaultThresholds(): void {
    this.thresholds.set('response_time', {
      name: 'API Response Time',
      warning: 1000, // 1 second
      critical: 3000, // 3 seconds
      unit: 'ms'
    })

    this.thresholds.set('database_query_time', {
      name: 'Database Query Time',
      warning: 500, // 500ms
      critical: 2000, // 2 seconds
      unit: 'ms'
    })

    this.thresholds.set('memory_usage', {
      name: 'Memory Usage',
      warning: 100 * 1024 * 1024, // 100MB
      critical: 500 * 1024 * 1024, // 500MB
      unit: 'bytes'
    })

    this.thresholds.set('cpu_usage', {
      name: 'CPU Usage',
      warning: 70, // 70%
      critical: 90, // 90%
      unit: '%'
    })

    this.thresholds.set('error_rate', {
      name: 'Error Rate',
      warning: 5, // 5%
      critical: 10, // 10%
      unit: '%'
    })
  }

  public recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    }

    this.metrics.push(fullMetric)
    this.checkThresholds(fullMetric)
  }

  public recordResponseTime(
    endpoint: string,
    method: string,
    duration: number,
    context: Partial<PerformanceMetric['context']> = {}
  ): void {
    this.recordMetric({
      name: 'response_time',
      value: duration,
      unit: 'ms',
      context: {
        endpoint,
        method,
        ...context
      }
    })
  }

  public recordDatabaseQuery(
    query: string,
    duration: number,
    context: Partial<PerformanceMetric['context']> = {}
  ): void {
    this.recordMetric({
      name: 'database_query_time',
      value: duration,
      unit: 'ms',
      context: {
        ...context
      },
      tags: {
        query: query.substring(0, 100) // Truncate long queries
      }
    })
  }

  public recordMemoryUsage(context: Partial<PerformanceMetric['context']> = {}): void {
    const usage = process.memoryUsage()
    
    this.recordMetric({
      name: 'memory_usage',
      value: usage.heapUsed,
      unit: 'bytes',
      context: {
        ...context
      }
    })

    this.recordMetric({
      name: 'memory_rss',
      value: usage.rss,
      unit: 'bytes',
      context: {
        ...context
      }
    })
  }

  public recordErrorRate(
    endpoint: string,
    errorCount: number,
    totalRequests: number,
    context: Partial<PerformanceMetric['context']> = {}
  ): void {
    const rate = (errorCount / totalRequests) * 100
    
    this.recordMetric({
      name: 'error_rate',
      value: rate,
      unit: '%',
      context: {
        endpoint,
        ...context
      }
    })
  }

  public recordCustomMetric(
    name: string,
    value: number,
    unit: string,
    context: Partial<PerformanceMetric['context']> = {},
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      value,
      unit,
      context: {
        ...context
      },
      tags
    })
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name)
    if (!threshold) return

    if (metric.value >= threshold.critical) {
      this.logger.log(LogLevel.CRITICAL, `Performance threshold exceeded`, {
        timestamp: metric.timestamp,
        additionalData: {
          metric: metric.name,
          value: metric.value,
          threshold: threshold.critical,
          unit: threshold.unit,
          ...metric.context
        }
      })
    } else if (metric.value >= threshold.warning) {
      this.logger.log(LogLevel.WARN, `Performance threshold warning`, {
        timestamp: metric.timestamp,
        additionalData: {
          metric: metric.name,
          value: metric.value,
          threshold: threshold.warning,
          unit: threshold.unit,
          ...metric.context
        }
      })
    }
  }

  public getMetrics(
    name?: string,
    startTime?: Date,
    endTime?: Date
  ): PerformanceMetric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    if (startTime) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= startTime)
    }

    if (endTime) {
      filtered = filtered.filter(m => new Date(m.timestamp) <= endTime)
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  public getAverageMetric(
    name: string,
    startTime?: Date,
    endTime?: Date
  ): number {
    const metrics = this.getMetrics(name, startTime, endTime)
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  public getMetricPercentile(
    name: string,
    percentile: number,
    startTime?: Date,
    endTime?: Date
  ): number {
    const metrics = this.getMetrics(name, startTime, endTime)
    if (metrics.length === 0) return 0

    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * values.length) - 1
    return values[Math.max(0, index)]
  }

  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: Record<string, {
      current: number
      average: number
      p95: number
      threshold: PerformanceThreshold
      status: 'healthy' | 'warning' | 'critical'
    }>
  } {
    const now = new Date()
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000)
    
    const status: any = {
      status: 'healthy',
      metrics: {}
    }

    for (const [name, threshold] of this.thresholds) {
      const current = this.getAverageMetric(name, last5Minutes, now)
      const average = this.getAverageMetric(name, new Date(now.getTime() - 60 * 60 * 1000), now)
      const p95 = this.getMetricPercentile(name, 95, last5Minutes, now)

      let metricStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (current >= threshold.critical) {
        metricStatus = 'critical'
        status.status = 'unhealthy'
      } else if (current >= threshold.warning) {
        metricStatus = 'warning'
        if (status.status === 'healthy') {
          status.status = 'degraded'
        }
      }

      status.metrics[name] = {
        current,
        average,
        p95,
        threshold,
        status: metricStatus
      }
    }

    return status
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private startCleanupInterval(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // Keep 24 hours
      this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoff)
    }, 60 * 60 * 1000)
  }

  public destroy(): void {
    this.metrics = []
  }
}

// Performance monitoring decorator
export function withPerformanceMonitoring(
  metricName: string,
  context?: Partial<PerformanceMetric['context']>
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const monitor = PerformanceMonitor.getInstance()
      
      try {
        const result = await method.apply(this, args)
        
        const duration = Date.now() - startTime
        monitor.recordMetric({
          name: metricName,
          value: duration,
          unit: 'ms',
          context: {
            ...context,
            endpoint: args[0]?.url || 'unknown',
            method: args[0]?.method || 'unknown'
          }
        })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        monitor.recordMetric({
          name: `${metricName}_error`,
          value: duration,
          unit: 'ms',
          context: {
            ...context,
            endpoint: args[0]?.url || 'unknown',
            method: args[0]?.method || 'unknown'
          }
        })
        
        throw error
      }
    }
  }
}

// Database query monitoring
export function monitorDatabaseQuery<T>(
  query: string,
  operation: () => Promise<T>,
  context?: Partial<PerformanceMetric['context']>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance()
  const startTime = Date.now()
  
  return operation()
    .then(result => {
      const duration = Date.now() - startTime
      monitor.recordDatabaseQuery(query, duration, context)
      return result
    })
    .catch(error => {
      const duration = Date.now() - startTime
      monitor.recordDatabaseQuery(`${query}_error`, duration, context)
      throw error
    })
}

// API response monitoring middleware
export function createPerformanceMiddleware() {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    const monitor = PerformanceMonitor.getInstance()
    const startTime = Date.now()
    
    // Record memory usage before request
    monitor.recordMemoryUsage({
      endpoint: req.url,
      method: req.method
    })
    
    try {
      const response = await next()
      
      const duration = Date.now() - startTime
      monitor.recordResponseTime(
        req.url,
        req.method,
        duration,
        {
          userId: req.headers.get('x-user-id') || undefined,
          tenantId: req.headers.get('x-tenant-id') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          ipAddress: req.headers.get('x-forwarded-for') || undefined
        }
      )
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Performance-Monitor', 'enabled')
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      monitor.recordResponseTime(
        req.url,
        req.method,
        duration,
        {
          userId: req.headers.get('x-user-id') || undefined,
          tenantId: req.headers.get('x-tenant-id') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          ipAddress: req.headers.get('x-forwarded-for') || undefined
        }
      )
      
      throw error
    }
  }
}

// Performance API endpoint
export async function getPerformanceMetrics(req: NextRequest) {
  const monitor = PerformanceMonitor.getInstance()
  const url = new URL(req.url)
  const name = url.searchParams.get('name')
  const startTime = url.searchParams.get('startTime')
  const endTime = url.searchParams.get('endTime')
  
  const start = startTime ? new Date(startTime) : undefined
  const end = endTime ? new Date(endTime) : undefined
  
  const metrics = monitor.getMetrics(name || undefined, start, end)
  const health = monitor.getHealthStatus()
  
  return {
    metrics,
    health,
    summary: {
      total_metrics: metrics.length,
      time_range: {
        start: start?.toISOString(),
        end: end?.toISOString()
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()
