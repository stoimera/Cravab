import { logger } from '@/lib/logger'
// Comprehensive Error Handling and Logging System
// Production-ready error management for 10-20 users per month

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  INTERNAL = 'INTERNAL',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC'
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string
  tenantId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  endpoint?: string
  method?: string
  timestamp: string
  additionalData?: Record<string, any>
}

export interface AppError extends Error {
  type: ErrorType
  statusCode: number
  context: ErrorContext
  isOperational: boolean
  retryable: boolean
  userMessage: string
  technicalMessage: string
}

export class CRAVABError extends Error implements AppError {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly context: ErrorContext
  public readonly isOperational: boolean
  public readonly retryable: boolean
  public readonly userMessage: string
  public readonly technicalMessage: string

  constructor(
    type: ErrorType,
    statusCode: number,
    userMessage: string,
    technicalMessage: string,
    context: ErrorContext,
    isOperational: boolean = true,
    retryable: boolean = false
  ) {
    super(technicalMessage)
    this.name = 'CRAVABError'
    this.type = type
    this.statusCode = statusCode
    this.userMessage = userMessage
    this.technicalMessage = technicalMessage
    this.context = context
    this.isOperational = isOperational
    this.retryable = retryable

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error classes for common scenarios
export class ValidationError extends CRAVABError {
  constructor(message: string, context: ErrorContext, field?: string) {
    super(
      ErrorType.VALIDATION,
      400,
      `Invalid input: ${message}`,
      `Validation failed${field ? ` for field: ${field}` : ''}: ${message}`,
      context,
      true,
      false
    )
  }
}

export class AuthenticationError extends CRAVABError {
  constructor(message: string, context: ErrorContext) {
    super(
      ErrorType.AUTHENTICATION,
      401,
      'Authentication required',
      `Authentication failed: ${message}`,
      context,
      true,
      false
    )
  }
}

export class AuthorizationError extends CRAVABError {
  constructor(message: string, context: ErrorContext) {
    super(
      ErrorType.AUTHORIZATION,
      403,
      'Access denied',
      `Authorization failed: ${message}`,
      context,
      true,
      false
    )
  }
}

export class NotFoundError extends CRAVABError {
  constructor(resource: string, context: ErrorContext) {
    super(
      ErrorType.NOT_FOUND,
      404,
      `${resource} not found`,
      `Resource not found: ${resource}`,
      context,
      true,
      false
    )
  }
}

export class ConflictError extends CRAVABError {
  constructor(message: string, context: ErrorContext) {
    super(
      ErrorType.CONFLICT,
      409,
      `Conflict: ${message}`,
      `Resource conflict: ${message}`,
      context,
      true,
      false
    )
  }
}

export class RateLimitError extends CRAVABError {
  constructor(context: ErrorContext, retryAfter?: number) {
    super(
      ErrorType.RATE_LIMIT,
      429,
      'Too many requests. Please try again later.',
      `Rate limit exceeded for user: ${context.userId || 'anonymous'}`,
      context,
      true,
      true
    )
  }
}

export class ExternalAPIError extends CRAVABError {
  constructor(service: string, message: string, context: ErrorContext) {
    super(
      ErrorType.EXTERNAL_API,
      502,
      'External service temporarily unavailable',
      `External API error (${service}): ${message}`,
      context,
      true,
      true
    )
  }
}

export class DatabaseError extends CRAVABError {
  constructor(operation: string, message: string, context: ErrorContext) {
    super(
      ErrorType.DATABASE,
      500,
      'Database operation failed',
      `Database error during ${operation}: ${message}`,
      context,
      false,
      true
    )
  }
}

export class BusinessLogicError extends CRAVABError {
  constructor(message: string, context: ErrorContext) {
    super(
      ErrorType.BUSINESS_LOGIC,
      422,
      message,
      `Business logic error: ${message}`,
      context,
      true,
      false
    )
  }
}

// Error logging system
export class ErrorLogger {
  private static instance: ErrorLogger
  private logLevel: LogLevel

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  public log(level: LogLevel, message: string, context?: ErrorContext, error?: Error): void {
    if (this.shouldLog(level)) {
      const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context: context || {},
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }

      // In production, send to external logging service
      if (process.env.NODE_ENV === 'production') {
        this.sendToExternalLogger(logEntry)
      } else {
        // Log entry processed
      }
    }
  }

  public logError(error: AppError): void {
    this.log(LogLevel.ERROR, error.technicalMessage, error.context, error)
    
    // Log to audit events for critical errors
    if (error.type === ErrorType.AUTHENTICATION || 
        error.type === ErrorType.AUTHORIZATION ||
        error.type === ErrorType.DATABASE) {
      this.logToAuditEvents(error)
    }
  }

  public logCritical(error: AppError): void {
    this.log(LogLevel.CRITICAL, error.technicalMessage, error.context, error)
    this.logToAuditEvents(error)
    
    // Send alert for critical errors
    this.sendAlert(error)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL]
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private async sendToExternalLogger(logEntry: any): Promise<void> {
    // Integration with external logging service (e.g., Sentry, LogRocket, etc.)
    try {
      // Example: Send to external service
      // await fetch(process.env.LOGGING_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // })
    } catch (error) {
      // Failed to send log to external service
    }
  }

  private async logToAuditEvents(error: AppError): Promise<void> {
    try {
      // Log critical errors to audit events table
      const { supabaseAdmin } = await import('@/lib/supabase/service')
      
      await supabaseAdmin().from('audit_logs').insert({
        tenant_id: error.context.tenantId,
        user_id: error.context.userId,
        resource_type: 'system_errors',
        resource_id: error.context.requestId || 'unknown',
        action: 'INSERT',
        old_values: null,
        new_values: {
          error_type: error.type,
          status_code: error.statusCode,
          message: error.message,
          is_operational: error.isOperational,
          retryable: error.retryable
        }
      })
    } catch (auditError) {
      // Failed to log error to audit events
    }
  }

  private async sendAlert(error: AppError): Promise<void> {
    // Send critical error alerts to administrators
    try {
      // Example: Send email/SMS alert
      // await sendAlertNotification(error)
    } catch (alertError) {
      // Failed to send alert
    }
  }
}

// Global error handler
export function handleError(error: unknown, context: ErrorContext): AppError {
  const logger = ErrorLogger.getInstance()

  if (error instanceof CRAVABError) {
    logger.logError(error)
    return error
  }

  // Handle known error types
  if (error instanceof Error) {
    // Supabase errors
    if (error.message.includes('duplicate key')) {
      return new ConflictError('Resource already exists', context)
    }
    
    if (error.message.includes('foreign key')) {
      return new ValidationError('Invalid reference', context)
    }
    
    if (error.message.includes('not found')) {
      return new NotFoundError('Resource', context)
    }

    // Network errors
    if (error.message.includes('fetch')) {
      return new ExternalAPIError('External Service', error.message, context)
    }

    // Generic internal error
    const appError = new CRAVABError(
      ErrorType.INTERNAL,
      500,
      'An unexpected error occurred',
      error.message,
      context,
      false,
      true
    )
    
    logger.logError(appError)
    return appError
  }

  // Unknown error type
  const unknownError = new CRAVABError(
    ErrorType.INTERNAL,
    500,
    'An unexpected error occurred',
    'Unknown error type',
    context,
    false,
    true
  )
  
  logger.logCritical(unknownError)
  return unknownError
}

// Error response formatter
export function formatErrorResponse(error: AppError) {
  const response = {
    error: {
      type: error.type,
      message: error.userMessage,
      statusCode: error.statusCode,
      retryable: error.retryable,
      requestId: error.context.requestId
    }
  }

  // Include additional context in development
  if (process.env.NODE_ENV === 'development') {
    const errorResponse = response.error as any
    errorResponse['technicalMessage'] = error.technicalMessage
    errorResponse['context'] = error.context || {}
  }

  return response
}

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const context: ErrorContext = {
        timestamp: new Date().toISOString(),
        endpoint: args[0]?.url || 'unknown',
        method: args[0]?.method || 'unknown'
      }
      
      throw handleError(error, context)
    }
  }
}

// Validation helper
export function validateRequired(value: any, fieldName: string, context: ErrorContext): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, context, fieldName)
  }
}

export function validateEmail(email: string, context: ErrorContext): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', context, 'email')
  }
}

export function validatePhone(phone: string, context: ErrorContext): void {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    throw new ValidationError('Invalid phone number format', context, 'phone')
  }
}

export function validateUUID(uuid: string, fieldName: string, context: ErrorContext): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(`Invalid ${fieldName} format`, context, fieldName)
  }
}
