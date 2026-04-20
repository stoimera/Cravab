// API Security Middleware
// Protects API routes from common attacks

import { NextRequest, NextResponse } from 'next/server'
import { addSecurityHeaders } from './security-headers'
import { isRateLimited, sanitizers } from './input-validation'

export interface SecurityOptions {
  rateLimit?: {
    limit: number
    windowMs: number
  }
  requireAuth?: boolean
  allowedMethods?: string[]
  maxBodySize?: number
}

export function withApiSecurity(options: SecurityOptions = {}) {
  return function securityMiddleware(request: NextRequest) {
    // Check allowed methods
    if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }

    // Rate limiting
    if (options.rateLimit) {
      const clientIP = getClientIP(request)
      if (isRateLimited(clientIP, request.nextUrl.pathname, options.rateLimit.limit, options.rateLimit.windowMs)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }
    }

    // Check body size
    if (options.maxBodySize) {
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > options.maxBodySize) {
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        )
      }
    }

    // Basic input sanitization for query parameters
    const url = new URL(request.url)
    for (const [key, value] of url.searchParams.entries()) {
      // Check for potential SQL injection patterns
      if (value.includes("'") || value.includes(";") || value.includes("--") || 
          /union|select|insert|update|delete|drop/i.test(value)) {
        return NextResponse.json(
          { error: 'Invalid input detected' },
          { status: 400 }
        )
      }
    }

    return null // No security violations, continue
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

// Sanitize request body
export function sanitizeRequestBody(body: any): any {
  if (typeof body === 'string') {
    return sanitizers.string(body)
  }
  
  if (typeof body === 'object' && body !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizers.string(value)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeRequestBody(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
  
  return body
}

// Security headers for API responses
export function secureApiResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Prevent caching of sensitive API responses
  if (status >= 400) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }
  
  return response
}

// Validate and sanitize API input
export function validateApiInput<T>(
  schema: any,
  input: unknown,
  sanitizer?: (input: string) => string
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    let processedInput = input
    
    // Apply sanitizer if provided and input is string
    if (sanitizer && typeof input === 'string') {
      processedInput = sanitizer(input)
    }
    
    const result = schema.parse(processedInput)
    return { success: true, data: result }
  } catch (error: any) {
    return {
      success: false,
      response: secureApiResponse(
        { error: 'Invalid input', details: error.message },
        400
      )
    }
  }
}
