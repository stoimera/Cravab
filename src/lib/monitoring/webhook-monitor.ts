/**
 * Webhook Performance Monitoring
 * Real-time monitoring and alerting for webhook performance
 */

interface WebhookMetrics {
  callId: string
  tenantId: string
  functionName: string
  startTime: number
  endTime: number
  duration: number
  status: 'success' | 'error' | 'timeout'
  errorMessage?: string
  memoryUsage?: number
  cpuUsage?: number
}

interface PerformanceThresholds {
  maxResponseTime: number // ms
  maxMemoryUsage: number // MB
  maxErrorRate: number // percentage
  maxConcurrentRequests: number
}

interface AlertConfig {
  enabled: boolean
  webhookUrl?: string
  emailRecipients?: string[]
  slackWebhook?: string
}

class WebhookMonitor {
  private static instance: WebhookMonitor
  private metrics: WebhookMetrics[] = []
  private thresholds: PerformanceThresholds = {
    maxResponseTime: 5000, // 5 seconds
    maxMemoryUsage: 100, // 100 MB
    maxErrorRate: 10, // 10%
    maxConcurrentRequests: 50
  }
  private alertConfig: AlertConfig = {
    enabled: true,
    emailRecipients: [],
    slackWebhook: process.env.SLACK_WEBHOOK_URL
  }
  private activeRequests = new Map<string, WebhookMetrics>()

  static getInstance(): WebhookMonitor {
    if (!WebhookMonitor.instance) {
      WebhookMonitor.instance = new WebhookMonitor()
    }
    return WebhookMonitor.instance
  }

  /**
   * Start monitoring a webhook request
   */
  startRequest(callId: string, tenantId: string, functionName: string): void {
    const metric: WebhookMetrics = {
      callId,
      tenantId,
      functionName,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      status: 'success'
    }

    this.activeRequests.set(callId, metric)
    
    // Check concurrent request limit
    if (this.activeRequests.size > this.thresholds.maxConcurrentRequests) {
      this.sendAlert('High Concurrent Requests', {
        current: this.activeRequests.size,
        threshold: this.thresholds.maxConcurrentRequests
      })
    }
  }

  /**
   * Complete monitoring a webhook request
   */
  completeRequest(callId: string, status: 'success' | 'error' | 'timeout', errorMessage?: string): void {
    const metric = this.activeRequests.get(callId)
    if (!metric) return

    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime
    metric.status = status
    if (errorMessage) {
      metric.errorMessage = errorMessage
    }

    // Add memory usage if available
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage()
      metric.memoryUsage = memUsage.heapUsed / 1024 / 1024 // Convert to MB
    }

    this.metrics.push(metric)
    this.activeRequests.delete(callId)

    // Check performance thresholds
    this.checkPerformanceThresholds(metric)

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * Check if current metrics exceed thresholds
   */
  private checkPerformanceThresholds(metric: WebhookMetrics): void {
    // Check response time
    if (metric.duration > this.thresholds.maxResponseTime) {
      this.sendAlert('Slow Webhook Response', {
        callId: metric.callId,
        functionName: metric.functionName,
        duration: metric.duration,
        threshold: this.thresholds.maxResponseTime
      })
    }

    // Check memory usage
    if (metric.memoryUsage && metric.memoryUsage > this.thresholds.maxMemoryUsage) {
      this.sendAlert('High Memory Usage', {
        callId: metric.callId,
        functionName: metric.functionName,
        memoryUsage: metric.memoryUsage,
        threshold: this.thresholds.maxMemoryUsage
      })
    }

    // Check error rate (last 100 requests)
    const recentMetrics = this.metrics.slice(-100)
    const errorCount = recentMetrics.filter(m => m.status === 'error').length
    const errorRate = (errorCount / recentMetrics.length) * 100

    if (errorRate > this.thresholds.maxErrorRate) {
      this.sendAlert('High Error Rate', {
        errorRate: errorRate.toFixed(2),
        threshold: this.thresholds.maxErrorRate,
        errorCount,
        totalRequests: recentMetrics.length
      })
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(title: string, data: any): Promise<void> {
    if (!this.alertConfig.enabled) return

    const alert = {
      title,
      timestamp: new Date().toISOString(),
      data,
      environment: process.env.NODE_ENV || 'development'
    }

    // Webhook alert triggered

    // Send to Slack if configured
    if (this.alertConfig.slackWebhook) {
      try {
        await fetch(this.alertConfig.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 *${title}*`,
            attachments: [{
              color: 'danger',
              fields: Object.entries(data).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true
              }))
            }]
          })
        })
      } catch (error) {
        // Failed to send Slack alert
      }
    }

    // Send to webhook if configured
    if (this.alertConfig.webhookUrl) {
      try {
        await fetch(this.alertConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      } catch (error) {
        // Failed to send webhook alert
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): {
    totalRequests: number
    successRate: number
    averageResponseTime: number
    errorRate: number
    activeRequests: number
    memoryUsage: number
  } {
    const now = Date.now()
    const window = timeWindow || 60 * 60 * 1000 // 1 hour default
    const recentMetrics = this.metrics.filter(m => now - m.startTime < window)
    
    const totalRequests = recentMetrics.length
    const successCount = recentMetrics.filter(m => m.status === 'success').length
    const errorCount = recentMetrics.filter(m => m.status === 'error').length
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0

    const memUsage = process.memoryUsage()
    const memoryUsage = memUsage.heapUsed / 1024 / 1024 // MB

    return {
      totalRequests,
      successRate: Number(successRate.toFixed(2)),
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      errorRate: Number(errorRate.toFixed(2)),
      activeRequests: this.activeRequests.size,
      memoryUsage: Number(memoryUsage.toFixed(2))
    }
  }

  /**
   * Get detailed metrics for analysis
   */
  getDetailedMetrics(limit = 100): WebhookMetrics[] {
    return this.metrics.slice(-limit)
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config }
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.startTime > cutoff)
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    stats: ReturnType<WebhookMonitor['getStats']>
  } {
    const stats = this.getStats()
    const issues: string[] = []

    if (stats.errorRate > this.thresholds.maxErrorRate) {
      issues.push(`High error rate: ${stats.errorRate}%`)
    }

    if (stats.averageResponseTime > this.thresholds.maxResponseTime) {
      issues.push(`Slow response time: ${stats.averageResponseTime}ms`)
    }

    if (stats.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${stats.memoryUsage}MB`)
    }

    if (stats.activeRequests > this.thresholds.maxConcurrentRequests) {
      issues.push(`Too many concurrent requests: ${stats.activeRequests}`)
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (issues.length > 0) {
      status = issues.length > 2 ? 'unhealthy' : 'degraded'
    }

    return { status, issues, stats }
  }
}

// Export singleton instance
export const webhookMonitor = WebhookMonitor.getInstance()

// Export types
export type { WebhookMetrics, PerformanceThresholds, AlertConfig }
