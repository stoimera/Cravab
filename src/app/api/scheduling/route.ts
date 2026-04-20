import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { AvailabilityService } from '@/lib/availability'

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'last-job':
        const lastJob = await AvailabilityService.getLastCompletedJob(tenantId)
        return createSuccessResponse({ lastJob })

      case 'optimal-schedule':
        const newAddress = searchParams.get('address')
        const duration = parseInt(searchParams.get('duration') || '60')
        const preferredDate = searchParams.get('preferredDate')

        if (!newAddress) {
          return createErrorResponse('Address is required', 400)
        }

        const suggestion = await AvailabilityService.suggestOptimalSchedule(
          tenantId,
          newAddress,
          duration,
          preferredDate ? new Date(preferredDate) : undefined
        )
        return createSuccessResponse(suggestion)

      default:
        return createErrorResponse('Invalid action', 400)
    }

  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
