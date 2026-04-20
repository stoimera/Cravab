/**
 * Rate limiting implementation
 */

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: any) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

class RateLimiter {
  private static instance: RateLimiter
  private limits: Map<string, { count: number; resetTime: number }> = new Map()
  private configs: Map<string, RateLimitConfig> = new Map()

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  /**
   * Configure rate limiting for a specific endpoint
   */
  configure(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config)
  }

  /**
   * Check if request is allowed
   */
  isAllowed(endpoint: string, key: string): RateLimitResult {
    const config = this.configs.get(endpoint)
    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now() + 60000
      }
    }

    const now = Date.now()
    const windowStart = now - config.windowMs
    const limitKey = `${endpoint}:${key}`
    
    const current = this.limits.get(limitKey)
    
    if (!current || current.resetTime < now) {
      // New window or expired window
      this.limits.set(limitKey, {
        count: 1,
        resetTime: now + config.windowMs
      })
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      }
    }

    if (current.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }
    }

    // Increment counter
    current.count++
    this.limits.set(limitKey, current)

    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.limits.entries()) {
      if (value.resetTime < now) {
        this.limits.delete(key)
      }
    }
  }

  /**
   * Get current limits for a key
   */
  getStatus(endpoint: string, key: string): RateLimitResult {
    return this.isAllowed(endpoint, key)
  }

  /**
   * Reset limits for a key
   */
  reset(endpoint: string, key: string): void {
    const limitKey = `${endpoint}:${key}`
    this.limits.delete(limitKey)
  }

  /**
   * Get all active limits
   */
  getAllLimits(): Map<string, { count: number; resetTime: number }> {
    return new Map(this.limits)
  }
}

// Initialize rate limiter
const rateLimiter = RateLimiter.getInstance()

// Configure default rate limits
rateLimiter.configure('webhook', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  keyGenerator: (req) => {
    const forwarded = req.headers?.get('x-forwarded-for')
    return forwarded ? forwarded.split(',')[0] : 'unknown'
  }
})

rateLimiter.configure('api', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
  keyGenerator: (req) => {
    const forwarded = req.headers?.get('x-forwarded-for')
    return forwarded ? forwarded.split(',')[0] : 'unknown'
  }
})

rateLimiter.configure('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 minutes
  keyGenerator: (req) => {
    const forwarded = req.headers?.get('x-forwarded-for')
    return forwarded ? forwarded.split(',')[0] : 'unknown'
  }
})

// Cleanup expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup()
}, 5 * 60 * 1000)

export { rateLimiter, RateLimiter }
export type { RateLimitConfig, RateLimitResult }
