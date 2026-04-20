import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

// Simple in-memory cache (in production, use Redis or similar)
const etaCache = new Map<string, { eta: number; cached_at: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      origin,
      destination,
      tenant_id
    } = body

    if (!origin || !destination) {
      return createErrorResponse('Missing origin or destination', 400)
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return createErrorResponse('Google Maps API key not configured', 500)
    }

    // Create cache key
    const cacheKey = `${origin}|${destination}`
    
    // Check cache first
    const cached = etaCache.get(cacheKey)
    if (cached && (Date.now() - cached.cached_at) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        eta_minutes: cached.eta,
        cached: true,
        origin,
        destination
      })
    }

    // Call Google Maps Distance Matrix API
    const eta = await getETAFromGoogleMaps(origin, destination)
    
    if (eta === null) {
      return createErrorResponse('Unable to calculate ETA', 500)
    }

    // Cache the result
    etaCache.set(cacheKey, {
      eta: eta,
      cached_at: Date.now()
    })

    // Suggest buffer time (20% of ETA, minimum 15 minutes)
    const suggestedBuffer = Math.max(15, Math.round(eta * 0.2))

    return createSuccessResponse({
      success: true,
      eta_minutes: eta,
      suggested_buffer_minutes: suggestedBuffer,
      total_travel_time_minutes: eta + suggestedBuffer,
      cached: false,
      origin,
      destination
    })

  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

async function getETAFromGoogleMaps(origin: string, destination: string): Promise<number | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', origin)
    url.searchParams.set('destinations', destination)
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY!)
    url.searchParams.set('units', 'imperial')
    url.searchParams.set('mode', 'driving')
    url.searchParams.set('traffic_model', 'best_guess')
    url.searchParams.set('departure_time', 'now')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      logger.error('Google Maps API error:', data.error_message)
      return null
    }

    const element = data.rows[0]?.elements[0]
    if (!element || element.status !== 'OK') {
      logger.error('No route found or invalid response')
      return null
    }

    // Convert duration from seconds to minutes
    const durationInMinutes = Math.round(element.duration_in_traffic?.value / 60 || element.duration.value / 60)
    
    return durationInMinutes

  } catch (error) {
    logger.error('Error calling Google Maps API:', error)
    return null
  }
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of etaCache.entries()) {
    if (now - value.cached_at > CACHE_DURATION) {
      etaCache.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes
