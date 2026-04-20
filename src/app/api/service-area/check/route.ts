import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkServiceArea } from '@/lib/service-area'
import { geocodeAddress } from '@/lib/geocoding/google-maps'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const { address, tenantId } = await request.json()

    if (!address || !tenantId) {
      return NextResponse.json(
        { error: 'Address and tenantId are required' },
        { status: 400 }
      )
    }

    // Check service area using the enhanced function
    const result = await checkServiceArea(tenantId, address)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Service area check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check service area',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Geocode endpoint
export async function PUT(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Geocode the address
    const result = await geocodeAddress(address)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Geocoding error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to geocode address',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
