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
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60')
    const bufferTime = parseInt(searchParams.get('bufferTime') || '15')

    if (!date) {
      return createErrorResponse('Date is required', 400)
    }

    const availability = await AvailabilityService.checkAvailability({   
      tenantId,
      date: new Date(date),
      duration,
      bufferTime
    })

    return createSuccessResponse(availability)

  } catch (error) {
    return createErrorResponse('Failed to check availability', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    const body = await request.json()
    const { duration, preferredDate, maxDaysAhead = 7 } = body

    if (!duration) {
      return createErrorResponse('Duration is required', 400)
    }

    const nextAvailable = await AvailabilityService.findNextAvailableSlot(
      tenantId,
      duration,
      preferredDate ? new Date(preferredDate) : undefined,
      maxDaysAhead
    )

    return createSuccessResponse({ nextAvailable })

  } catch (error) {
    return createErrorResponse('Failed to find available slot', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
