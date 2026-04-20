/**
 * Appointment Cache Strategy
 * Implements Redis-like caching for optimal performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class AppointmentCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Cache key generators
export const CacheKeys = {
  appointment: (id: string) => `appointment:${id}`,
  appointments: (tenantId: string, page: number = 1) => `appointments:${tenantId}:${page}`,
  client: (id: string) => `client:${id}`,
  service: (id: string) => `service:${id}`,
  appointmentsByDate: (tenantId: string, date: string) => `appointments:${tenantId}:${date}`,
  appointmentsByStatus: (tenantId: string, status: string) => `appointments:${tenantId}:${status}`
}

// Singleton cache instance
export const appointmentCache = new AppointmentCache()

/**
 * Cache decorator for automatic caching
 */
export function withCache<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  ttl: number = 5 * 60 * 1000
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator(...args)
      const cached = appointmentCache.get<R>(cacheKey)
      
      if (cached) {
        return cached
      }

      const result = await method.apply(this, args)
      appointmentCache.set(cacheKey, result, ttl)
      
      return result
    }
  }
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  onAppointmentUpdate: (appointmentId: string, tenantId: string) => {
    // Invalidate specific appointment
    appointmentCache.invalidatePattern(`appointment:${appointmentId}`)
    
    // Invalidate appointment lists
    appointmentCache.invalidatePattern(`appointments:${tenantId}`)
    
    // Invalidate related client/service caches
    appointmentCache.invalidatePattern(`client:*`)
    appointmentCache.invalidatePattern(`service:*`)
  },

  onClientUpdate: (clientId: string, tenantId: string) => {
    appointmentCache.invalidatePattern(`client:${clientId}`)
    appointmentCache.invalidatePattern(`appointments:${tenantId}`)
  },

  onServiceUpdate: (serviceId: string, tenantId: string) => {
    appointmentCache.invalidatePattern(`service:${serviceId}`)
    appointmentCache.invalidatePattern(`appointments:${tenantId}`)
  }
}
