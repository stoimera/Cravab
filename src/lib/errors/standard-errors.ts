import { logger } from '@/lib/logger'
/**
 * Standardized Error Response System
 * Consistent error handling across all API endpoints
 */

export interface StandardError {
  success: false
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
  }
}

export interface StandardSuccess<T = any> {
  success: true
  data: T
  timestamp: string
  requestId?: string
}

export type ApiResponse<T = any> = StandardSuccess<T> | StandardError

// Error codes
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Authentication/Authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

// HTTP status codes mapping
export const HTTP_STATUS = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
  [ERROR_CODES.INVALID_FORMAT]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.INVALID_TOKEN]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.DUPLICATE_RESOURCE]: 409,
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: 422,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.INTERNAL_ERROR]: 500
} as const

export class ApiError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any
  public readonly isOperational: boolean

  constructor(
    code: keyof typeof ERROR_CODES,
    message: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = HTTP_STATUS[code] || 500
    this.details = details
    this.isOperational = isOperational
  }
}

// Error response creators
export function createErrorResponse(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: any,
  requestId?: string
): StandardError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId
    }
  }
}

export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): StandardSuccess<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId
  }
}

// Retry mechanism
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (error instanceof ApiError && error.isOperational) {
        throw error
      }

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Error logging
export function logError(error: Error, context?: any): void {
  const errorLog = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    level: 'error'
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    logger.error('API Error:', errorLog)
  }

  // In production, you would send to a logging service
  // Example: Sentry.captureException(error, { extra: context })
}

// Common error creators
export const createValidationError = (message: string, details?: any) =>
  new ApiError(ERROR_CODES.VALIDATION_ERROR, message, details)

export const createNotFoundError = (resource: string) =>
  new ApiError(ERROR_CODES.NOT_FOUND, `${resource} not found`)

export const createUnauthorizedError = (message: string = 'Unauthorized') =>
  new ApiError(ERROR_CODES.UNAUTHORIZED, message)

export const createForbiddenError = (message: string = 'Forbidden') =>
  new ApiError(ERROR_CODES.FORBIDDEN, message)

export const createConflictError = (message: string, details?: any) =>
  new ApiError(ERROR_CODES.CONFLICT, message, details)

export const createInternalError = (message: string = 'Internal server error') =>
  new ApiError(ERROR_CODES.INTERNAL_ERROR, message, undefined, false)

export const createRateLimitError = (retryAfter?: number) =>
  new ApiError(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', { retryAfter })
