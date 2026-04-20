/**
 * API Route Helpers
 * Standardized helpers for API routes with consistent tenant resolution and error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getTenantIdForAPI, createTenantContext } from '@/lib/tenant-utils'
import { ErrorLogger, LogLevel } from '@/lib/error-handling'
import { getUserMessage, formatErrorForDisplay } from '@/lib/user-messages'

const logger = ErrorLogger.getInstance()

export interface AuthenticatedRequest {
  user: any
  tenantId: string
  supabase: any
}

/**
 * Standardized authentication and tenant resolution for API routes
 * This replaces the inconsistent patterns across all API routes
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  success: true
  user: any
  tenantId: string
  supabase: any
} | {
  success: false
  response: NextResponse
}> {
  const logger = ErrorLogger.getInstance()
  
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      logger.log(LogLevel.WARN, 'Unauthorized API request', {
        endpoint: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
        additionalData: {
          error: userError?.message
        }
      })
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    // Resolve tenant ID with standardized validation
    const tenantResult = await getTenantIdForAPI(user)
    
    if ('error' in tenantResult) {
      logger.log(LogLevel.ERROR, 'Tenant resolution failed in API route', {
        userId: user.id,
        endpoint: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
        additionalData: {
          userEmail: user.email,
          error: tenantResult.error
        }
      })
      return {
        success: false,
        response: NextResponse.json({ error: tenantResult.error }, { status: tenantResult.status })
      }
    }
    
    logger.log(LogLevel.INFO, 'API request authenticated successfully', {
      userId: user.id,
      tenantId: tenantResult.tenantId,
      endpoint: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      user,
      tenantId: tenantResult.tenantId,
      supabase
    }
    
  } catch (error) {
    logger.log(LogLevel.ERROR, 'Authentication error in API route', {
      endpoint: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Standardized error response formatter
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  context?: any
): NextResponse {
  const logger = ErrorLogger.getInstance()
  
  // Convert technical error to user-friendly message
  const contextString = typeof context === 'string' ? context : 
    context && typeof context === 'object' ? JSON.stringify(context) : 
    undefined
  const userMessage = formatErrorForDisplay(message, contextString)
  
  logger.log(LogLevel.ERROR, 'API error response', {
    timestamp: new Date().toISOString(),
    additionalData: {
      technicalMessage: message,
      userMessage,
      status,
      context
    }
  })
  
  return NextResponse.json({ 
    error: userMessage,
    // Include technical details in development
    ...(process.env.NODE_ENV === 'development' && {
      technicalError: message,
      context
    })
  }, { status })
}

/**
 * Standardized success response formatter
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Standardized tenant-scoped database query helper
 */
export async function executeTenantQuery<T>(
  supabase: any,
  table: string,
  query: (query: any) => any,
  tenantId: string
): Promise<{ data: T[] | null; error: any }> {
  const logger = ErrorLogger.getInstance()
  
  try {
    const result = await query(supabase.from(table).eq('tenant_id', tenantId))
    
    if (result.error) {
      logger.log(LogLevel.ERROR, 'Database query failed', {
        tenantId,
        timestamp: new Date().toISOString(),
        additionalData: {
          table,
          error: result.error.message
        }
      })
    }
    
    return result
  } catch (error) {
    logger.log(LogLevel.ERROR, 'Database query exception', {
      tenantId,
      timestamp: new Date().toISOString(),
      additionalData: {
        table,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Database query failed')
    }
  }
}

/**
 * Standardized tenant context for logging
 */
export function getTenantContext(tenantId: string, userId: string, additionalContext?: any) {
  return {
    ...createTenantContext(tenantId, userId),
    ...additionalContext
  }
}
