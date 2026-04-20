import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    const calls = await DatabaseService.getCalls(tenantId)
    return createSuccessResponse(calls)
  } catch (error) {
    return createErrorResponse('Failed to fetch calls', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
