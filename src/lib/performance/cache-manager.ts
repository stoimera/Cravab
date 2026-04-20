/**
 * Advanced caching system with TTL and invalidation
 */

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  version: string
  tags?: string[]
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

class CacheManager {
  private static instance: CacheManager
  private cache = new Map<string, CacheEntry>()
  private stats = {
    hits: 0,
    misses: 0
  }
  private maxSize = 1000
  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  private cacheVersion = '1.0.0'

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Set cache entry
   */
  set<T>(
    key: string, 
    data: T, 
    ttl: number = this.defaultTTL,
    tags: string[] = []
  ): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.cacheVersion,
      tags
    })
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired or version mismatch
    if (Date.now() - entry.timestamp > entry.ttl || entry.version !== this.cacheVersion) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  /**
   * Get or set cache entry
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl, tags)
    return data
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Invalidate by tags
   */
  invalidateByTags(tags: string[]): number {
    let deleted = 0
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
        deleted++
      }
    }
    return deleted
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
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let deleted = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl || entry.version !== this.cacheVersion) {
        this.cache.delete(key)
        deleted++
      }
    }
    
    return deleted
  }

  /**
   * Evict oldest entries
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1)
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  /**
   * Get cache keys by pattern
   */
  getKeysByPattern(pattern: RegExp): string[] {
    return Array.from(this.cache.keys()).filter(key => pattern.test(key))
  }

  /**
   * Get cache version
   */
  getCacheVersion(): string {
    return this.cacheVersion
  }

  /**
   * Update cache version (clears all caches)
   */
  updateCacheVersion(newVersion: string = '1.0.0'): void {
    this.cacheVersion = newVersion
    this.clear()
  }
}

// Cleanup expired entries every 2 minutes
const cacheManager = CacheManager.getInstance()
setInterval(() => {
  cacheManager.cleanup()
}, 2 * 60 * 1000)

export { CacheManager }
export { cacheManager }
