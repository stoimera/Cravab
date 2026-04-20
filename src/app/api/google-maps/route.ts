import { NextRequest, NextResponse } from 'next/server'
import { getGoogleMapsService } from '@/lib/google-maps'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
// POST /api/google-maps - Calculate travel info between addresses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, mode = 'driving' } = body

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    const travelInfo = await getGoogleMapsService().calculateTravelInfo(origin, destination, mode)

    if (!travelInfo) {
      return NextResponse.json(
        { error: 'Unable to calculate travel information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ travelInfo })
  } catch (error) {
    logger.error('Error in POST /api/google-maps:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/google-maps/geocode - Geocode an address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    const coordinates = await getGoogleMapsService().getCoordinates(address)

    if (!coordinates) {
      return NextResponse.json(
        { error: 'Unable to geocode address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ coordinates })
  } catch (error) {
    logger.error('Error in GET /api/google-maps/geocode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
