// Rate Limiting and API Protection System
// Production-ready rate limiting for 10-20 users per month

import { NextRequest } from 'next/server'
import { ErrorLogger, RateLimitError, ErrorContext } from './error-handling'
import { logger } from '@/lib/logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  onLimitReached?: (req: NextRequest, key: string) => void
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

class RateLimiter {
  private static instance: RateLimiter
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  private constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  public checkLimit(
    key: string, 
    config: RateLimitConfig, 
    context: ErrorContext
  ): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
    const now = Date.now()
    const windowStart = now - config.windowMs
    const entry = this.store.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      }
      this.store.set(key, newEntry)
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime
      }
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      if (config.onLimitReached) {
        config.onLimitReached({} as NextRequest, key)
      }

      const logger = ErrorLogger.getInstance()
      logger.log('WARN' as any, 'Rate limit exceeded', {
        ...context,
        additionalData: {
          ...context.additionalData,
          key: key,
          currentCount: entry.count,
          maxRequests: config.maxRequests,
          retryAfter
        }
      })

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      }
    }

    // Increment counter
    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // General API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      return `api:${ip}`
    }
  },

  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Stricter for auth
    keyGenerator: (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for') || 'unknown'
      return `auth:${ip}`
    }
  },

  // Webhook endpoints (more lenient)
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for') || 'unknown'
      return `webhook:${ip}`
    }
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyGenerator: (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for') || 'unknown'
      return `upload:${ip}`
    }
  },

  // Per-user rate limiting
  USER: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `user:${userId}`
    }
  },

  // Per-company rate limiting
  COMPANY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => {
      const tenantId = req.headers.get('x-tenant-id') || 'unknown'
      return `tenant:${tenantId}`
    }
  }
}

// Rate limiting middleware
export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest, context: ErrorContext) => {
    const rateLimiter = RateLimiter.getInstance()
    const key = config.keyGenerator ? config.keyGenerator(req) : 'default'
    
    const result = rateLimiter.checkLimit(key, config, context)
    
    if (!result.allowed) {
      throw new RateLimitError(context, result.retryAfter)
    }
    
    return result
  }
}

// Specific rate limiters for different endpoint types
export const apiRateLimit = createRateLimit(RateLimitConfigs.API)
export const authRateLimit = createRateLimit(RateLimitConfigs.AUTH)
export const webhookRateLimit = createRateLimit(RateLimitConfigs.WEBHOOK)
export const uploadRateLimit = createRateLimit(RateLimitConfigs.UPLOAD)
export const userRateLimit = createRateLimit(RateLimitConfigs.USER)
export const companyRateLimit = createRateLimit(RateLimitConfigs.COMPANY)

// Advanced rate limiting with multiple tiers
export class AdvancedRateLimiter {
  private rateLimiters: Map<string, RateLimiter> = new Map()

  public checkMultipleLimits(
    req: NextRequest, 
    configs: Array<{ name: string; config: RateLimitConfig }>,
    context: ErrorContext
  ): { allowed: boolean; limits: Record<string, any>; retryAfter?: number } {
    const results: Record<string, any> = {}
    let allowed = true
    let maxRetryAfter = 0

    for (const { name, config } of configs) {
      const rateLimiter = RateLimiter.getInstance()
      const key = config.keyGenerator ? config.keyGenerator(req) : `${name}:default`
      
      const result = rateLimiter.checkLimit(key, config, context)
      results[name] = result
      
      if (!result.allowed) {
        allowed = false
        if (result.retryAfter && result.retryAfter > maxRetryAfter) {
          maxRetryAfter = result.retryAfter
        }
      }
    }

    return {
      allowed,
      limits: results,
      retryAfter: maxRetryAfter > 0 ? maxRetryAfter : undefined
    }
  }
}

// IP-based rate limiting with whitelist/blacklist
export class IPRateLimiter {
  private whitelist: Set<string> = new Set()
  private blacklist: Set<string> = new Set()
  private rateLimiter: RateLimiter

  constructor() {
    this.rateLimiter = RateLimiter.getInstance()
    
    // Load whitelist/blacklist from environment or database
    this.loadLists()
  }

  private loadLists(): void {
    // Load from environment variables
    const whitelistEnv = process.env.RATE_LIMIT_WHITELIST
    const blacklistEnv = process.env.RATE_LIMIT_BLACKLIST

    if (whitelistEnv) {
      whitelistEnv.split(',').forEach(ip => this.whitelist.add(ip.trim()))
    }

    if (blacklistEnv) {
      blacklistEnv.split(',').forEach(ip => this.blacklist.add(ip.trim()))
    }
  }

  public checkIPLimit(req: NextRequest, context: ErrorContext): { allowed: boolean; reason?: string } {
    const ip = this.getClientIP(req)
    
    // Check blacklist first
    if (this.blacklist.has(ip)) {
      return { allowed: false, reason: 'IP blacklisted' }
    }

    // Whitelist bypasses rate limiting
    if (this.whitelist.has(ip)) {
      return { allowed: true }
    }

    // Apply rate limiting
    const config = RateLimitConfigs.API
    const key = `ip:${ip}`
    const result = this.rateLimiter.checkLimit(key, config, context)
    
    return {
      allowed: result.allowed,
      reason: result.allowed ? undefined : 'Rate limit exceeded'
    }
  }

  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           req.headers.get('x-real-ip') ||
           req.headers.get('cf-connecting-ip') ||
           'unknown'
  }

  public addToWhitelist(ip: string): void {
    this.whitelist.add(ip)
  }

  public addToBlacklist(ip: string): void {
    this.blacklist.add(ip)
  }

  public removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip)
  }

  public removeFromBlacklist(ip: string): void {
    this.blacklist.delete(ip)
  }
}

// Rate limiting decorator for API routes
export function withRateLimit(config: RateLimitConfig) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const req = args[0] as NextRequest
      const context: ErrorContext = {
        timestamp: new Date().toISOString(),
        endpoint: req.url,
        method: req.method,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }

      const rateLimiter = RateLimiter.getInstance()
      const key = config.keyGenerator ? config.keyGenerator(req) : 'default'
      
      const result = rateLimiter.checkLimit(key, config, context)
      
      if (!result.allowed) {
        throw new RateLimitError(context, result.retryAfter)
      }

      return method.apply(this, args)
    }
  }
}

// Export singleton instances
export const ipRateLimiter = new IPRateLimiter()
export const advancedRateLimiter = new AdvancedRateLimiter()
