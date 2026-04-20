import { NextRequest, NextResponse } from 'next/server'
import { serviceHelpers } from '@/lib/database-helpers'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const { tenantId, clientRequest } = await request.json()

    if (!tenantId || !clientRequest) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, clientRequest' },
        { status: 400 }
      )
    }

    // Find best matching service
    const match = await serviceHelpers.findBestMatch(tenantId, clientRequest)

    return NextResponse.json({
      success: true,
      match
    })

  } catch (error) {
    logger.error('Service matching error:', error)
    return NextResponse.json(
      { error: 'Failed to match service' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameter: tenantId' },
        { status: 400 }
      )
    }

    // Get all available service keywords for the tenant
    const keywords = await serviceHelpers.getServiceKeywords(tenantId)

    return NextResponse.json({
      success: true,
      keywords
    })

  } catch (error) {
    logger.error('Service keywords error:', error)
    return NextResponse.json(
      { error: 'Failed to get service keywords' },
      { status: 500 }
    )
  }
}
