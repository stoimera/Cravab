/**
 * Application-Level Cache Manager
 * Handles server-side caching for webhook context and frequent data
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  version: string
}

interface CallContext {
  tenantId: string
  callId: string
  clientId?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  appointmentId?: string
  appointmentDate?: string
  appointmentTime?: string
  appointmentDuration?: number
  serviceId?: string
  serviceType?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  notes?: string[]
  aiAnalysis?: string[]
  followUpRequired?: boolean
  followUpReason?: string
  quoteRequired?: boolean
  quoteDetails?: any
  callStatus?: string
  customerSentiment?: string
  lastInteraction?: number
  transcription?: string
  metadata: Record<string, any>
  lastActivity: number
}

interface TenantData {
  tenantId: string
  businessHours: any
  services: any[]
  settings: any
  lastUpdated: number
}

class AppCache {
  private callContextCache = new Map<string, CacheItem<CallContext>>()
  private tenantCache = new Map<string, CacheItem<TenantData>>()
  private generalCache = new Map<string, CacheItem<any>>()
  
  // TTL defaults (in milliseconds) - Aligned with other cache layers
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes (was 1 hour)
  private readonly CALL_CONTEXT_TTL = 30 * 1000 // 30 seconds (real-time data)
  private readonly TENANT_TTL = 5 * 60 * 1000 // 5 minutes (was 1 hour)
  
  // Cache version for consistency
  private readonly CACHE_VERSION = '1.0.0'

  constructor() {
    // Start cleanup interval
    this.startCleanupInterval()
  }

  // Call Context Management
  setCallContext(callId: string, context: CallContext): void {
    this.callContextCache.set(callId, {
      data: context,
      timestamp: Date.now(),
      ttl: this.CALL_CONTEXT_TTL,
      version: this.CACHE_VERSION
    })
  }

  getCallContext(callId: string): CallContext | null {
    const item = this.callContextCache.get(callId)
    if (!item) return null

    if (this.isExpired(item)) {
      this.callContextCache.delete(callId)
      return null
    }

    return item.data
  }

  updateCallContext(callId: string, updates: Partial<CallContext>): void {
    const existing = this.getCallContext(callId)
    if (existing) {
      this.setCallContext(callId, { ...existing, ...updates, lastActivity: Date.now() })
    }
  }

  deleteCallContext(callId: string): void {
    this.callContextCache.delete(callId)
  }

  // Tenant Data Management
  setTenantData(tenantId: string, data: TenantData): void {
    this.tenantCache.set(tenantId, {
      data,
      timestamp: Date.now(),
      ttl: this.TENANT_TTL,
      version: this.CACHE_VERSION
    })
  }

  getTenantData(tenantId: string): TenantData | null {
    const item = this.tenantCache.get(tenantId)
    if (!item) return null

    if (this.isExpired(item)) {
      this.tenantCache.delete(tenantId)
      return null
    }

    return item.data
  }

  updateTenantData(tenantId: string, updates: Partial<TenantData>): void {
    const existing = this.getTenantData(tenantId)
    if (existing) {
      this.setTenantData(tenantId, { ...existing, ...updates, lastUpdated: Date.now() })
    }
  }

  // General Cache Management
  set<T>(key: string, data: T, ttl?: number): void {
    this.generalCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
      version: this.CACHE_VERSION
    })
  }

  get<T>(key: string): T | null {
    const item = this.generalCache.get(key)
    if (!item) return null

    if (this.isExpired(item)) {
      this.generalCache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.generalCache.delete(key)
  }

  // Cache Statistics
  getStats() {
    return {
      callContexts: this.callContextCache.size,
      tenants: this.tenantCache.size,
      general: this.generalCache.size,
      total: this.callContextCache.size + this.tenantCache.size + this.generalCache.size
    }
  }

  // Cleanup expired items
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl
  }

  // Check if cache item is stale due to version mismatch
  private isStaleVersion(item: CacheItem<any>): boolean {
    return item.version !== this.CACHE_VERSION
  }

  private cleanupExpiredCache<T>(cache: Map<string, CacheItem<T>>): void {
    for (const [key, item] of cache.entries()) {
      if (this.isExpired(item) || this.isStaleVersion(item)) {
        cache.delete(key)
      }
    }
  }

  private startCleanupInterval(): void {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache(this.callContextCache)
      this.cleanupExpiredCache(this.tenantCache)
      this.cleanupExpiredCache(this.generalCache)
    }, 300000) // 5 minutes
  }

  // Clear all caches
  clearAll(): void {
    this.callContextCache.clear()
    this.tenantCache.clear()
    this.generalCache.clear()
  }

  // Clear tenant-specific data
  clearTenantData(tenantId: string): void {
    this.tenantCache.delete(tenantId)
    
    // Clear call contexts for this tenant
    for (const [callId, context] of this.callContextCache.entries()) {
      if (context.data.tenantId === tenantId) {
        this.callContextCache.delete(callId)
      }
    }
  }

  // Get cache keys by pattern (for invalidation service)
  getKeysByPattern(pattern: string): string[] {
    const keys: string[] = []
    const regex = new RegExp(pattern)
    
    // Check general cache
    for (const key of this.generalCache.keys()) {
      if (regex.test(key)) {
        keys.push(key)
      }
    }
    
    return keys
  }

  // Get cache version
  getCacheVersion(): string {
    return this.CACHE_VERSION
  }

  // Force version update (clears all caches)
  updateCacheVersion(): void {
    this.clearAll()
  }
}

// Export singleton instance
export const appCache = new AppCache()

// Export types
export type { CallContext, TenantData, CacheItem }
