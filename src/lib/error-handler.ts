// Comprehensive Error Handling System
import { NextResponse } from 'next/server'

export interface ErrorDetails {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId?: string
  userId?: string
  tenantId?: string
}

export interface ApiError extends Error {
  statusCode: number
  code: string
  details?: any
  isOperational: boolean
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: any
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error types
export const ErrorTypes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

// Error factory functions
export const createError = {
  unauthorized: (message: string = 'Unauthorized', details?: any) =>
    new AppError(message, 401, ErrorTypes.UNAUTHORIZED, details),
  
  forbidden: (message: string = 'Forbidden', details?: any) =>
    new AppError(message, 403, ErrorTypes.FORBIDDEN, details),
  
  notFound: (message: string = 'Resource not found', details?: any) =>
    new AppError(message, 404, ErrorTypes.RECORD_NOT_FOUND, details),
  
  validation: (message: string = 'Validation error', details?: any) =>
    new AppError(message, 400, ErrorTypes.VALIDATION_ERROR, details),
  
  database: (message: string = 'Database error', details?: any) =>
    new AppError(message, 500, ErrorTypes.DATABASE_ERROR, details),
  
  external: (message: string = 'External service error', details?: any) =>
    new AppError(message, 502, ErrorTypes.EXTERNAL_SERVICE_ERROR, details),
  
  internal: (message: string = 'Internal server error', details?: any) =>
    new AppError(message, 500, ErrorTypes.INTERNAL_ERROR, details)
}

// Error logging
export function logError(error: Error | ApiError, context?: any): void {
  const errorDetails: ErrorDetails = {
    code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
    message: error.message,
    details: 'details' in error ? error.details : undefined,
    timestamp: new Date().toISOString(),
    requestId: context?.requestId,
    userId: context?.userId,
    tenantId: context?.tenantId
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    // Error details logged in development
    // Stack trace available
    if (context) {
      // Context information available
    }
  }

  // In production, you would send to a logging service like Sentry, LogRocket, etc.
  // Example: Sentry.captureException(error, { extra: errorDetails })
}

// Error response formatter
export function formatErrorResponse(error: Error | ApiError, context?: any): NextResponse {
  logError(error, context)

  const isOperational = 'isOperational' in error ? error.isOperational : false
  const statusCode = 'statusCode' in error ? error.statusCode : 500
  const code = 'code' in error ? error.code : 'INTERNAL_ERROR'

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' && !isOperational
    ? 'An unexpected error occurred'
    : error.message

  const response = {
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        details: 'details' in error ? error.details : undefined,
        stack: error.stack
      })
    },
    timestamp: new Date().toISOString(),
    ...(context?.requestId && { requestId: context.requestId })
  }

  return NextResponse.json(response, { status: statusCode })
}

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      
      // Convert unknown errors to AppError
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        ErrorTypes.INTERNAL_ERROR,
        error instanceof Error ? error.stack : undefined
      )
    }
  }
}

// Error boundary for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return formatErrorResponse(error as Error | ApiError)
    }
  }
}

// Validation error formatter
export function formatValidationError(errors: any[]): AppError {
  const details = errors.map(error => ({
    field: error.path?.join('.') || 'unknown',
    message: error.message,
    value: error.value
  }))

  return createError.validation('Validation failed', details)
}

// Database error handler
export function handleDatabaseError(error: any): AppError {
  // Database error occurred

  // PostgreSQL error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return createError.validation('Record already exists', { constraint: error.constraint })
      case '23503': // Foreign key violation
        return createError.validation('Referenced record not found', { constraint: error.constraint })
      case '23502': // Not null violation
        return createError.validation('Required field is missing', { column: error.column })
      case '42P01': // Undefined table
        return createError.database('Database table not found')
      case '42703': // Undefined column
        return createError.database('Database column not found')
      default:
        return createError.database('Database operation failed', { code: error.code })
    }
  }

  return createError.database('Database operation failed')
}

// Rate limiting error
export function createRateLimitError(retryAfter?: number): AppError {
  return new AppError(
    'Too many requests',
    429,
    ErrorTypes.API_RATE_LIMIT,
    { retryAfter },
    true
  )
}

// Network error handler
export function handleNetworkError(error: any): AppError {
  if (error.code === 'ECONNREFUSED') {
    return createError.external('Service unavailable', { code: 'CONNECTION_REFUSED' })
  }
  
  if (error.code === 'ETIMEDOUT') {
    return createError.external('Request timeout', { code: 'TIMEOUT' })
  }
  
  if (error.code === 'ENOTFOUND') {
    return createError.external('Service not found', { code: 'DNS_ERROR' })
  }
  
  return createError.external('Network error', { code: error.code })
}
