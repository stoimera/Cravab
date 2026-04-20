import { logger } from '@/lib/logger'
// Server-side geocoding using Google Maps Geocoding API
export interface GeocodingResult {
  address: string
  latitude: number
  longitude: number
  formatted_address: string
  place_id?: string
  components?: {
    street_number?: string
    route?: string
    locality?: string
    administrative_area_level_1?: string
    country?: string
    postal_code?: string
  }
}

// Distance calculation result
export interface DistanceResult {
  distance_miles: number
  distance_km: number
  duration_minutes?: number
  duration_text?: string
  is_within_radius: boolean
  radius_miles: number
}

// Geocode an address to coordinates using server-side API
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location
      
      return {
        address,
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        components: extractAddressComponents(result.address_components)
      }
    } else {
      // Log detailed error for debugging
      const errorMessage = `Geocoding failed: ${data.status}`
      if (data.status === 'REQUEST_DENIED') {
        logger.error('Google Maps API REQUEST_DENIED - Possible causes:')
        logger.error('1. API key is missing or invalid')
        logger.error('2. Geocoding API is not enabled in Google Cloud Console')
        logger.error('3. API key restrictions are blocking the request')
        logger.error('4. Billing is not enabled on the Google Cloud project')
        logger.error('5. API key has expired or been revoked')
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    logger.error('Geocoding error:', error)
    throw new Error('Failed to geocode address')
  }
}

// Extract address components from Google Maps result
function extractAddressComponents(components: any[]): GeocodingResult['components'] {
  const extracted: any = {}
  
  components.forEach(component => {
    const types = component.types
    if (types.includes('street_number')) {
      extracted.street_number = component.long_name
    } else if (types.includes('route')) {
      extracted.route = component.long_name
    } else if (types.includes('locality')) {
      extracted.locality = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      extracted.administrative_area_level_1 = component.long_name
    } else if (types.includes('country')) {
      extracted.country = component.long_name
    } else if (types.includes('postal_code')) {
      extracted.postal_code = component.long_name
    }
  })
  
  return extracted
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { distance_miles: number; distance_km: number } {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance_miles = R * c
  const distance_km = distance_miles * 1.60934
  
  return { distance_miles, distance_km }
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Get driving distance and duration using Distance Matrix API
export async function getDrivingDistance(
  origin: string,
  destination: string
): Promise<DistanceResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0]
      const distance_miles = element.distance.value / 1609.34 // Convert meters to miles
      const duration_minutes = element.duration.value / 60 // Convert seconds to minutes
      
      return {
        distance_miles,
        distance_km: distance_miles * 1.60934,
        duration_minutes,
        duration_text: element.duration.text,
        is_within_radius: false, // Will be set by caller
        radius_miles: 0 // Will be set by caller
      }
    } else {
      throw new Error('Distance calculation failed')
    }
  } catch (error) {
    logger.error('Distance calculation error:', error)
    throw new Error('Failed to calculate distance and ETA')
  }
}

// Check if address is within service radius
export async function checkServiceRadius(
  baseAddress: string,
  clientAddress: string,
  radiusMiles: number
): Promise<DistanceResult> {
  try {
    // Geocode both addresses
    const [baseResult, clientResult] = await Promise.all([
      geocodeAddress(baseAddress),
      geocodeAddress(clientAddress)
    ])
    
    // Calculate distance
    const distance = calculateDistance(
      baseResult.latitude,
      baseResult.longitude,
      clientResult.latitude,
      clientResult.longitude
    )
    
    return {
      distance_miles: distance.distance_miles,
      distance_km: distance.distance_km,
      is_within_radius: distance.distance_miles <= radiusMiles,
      radius_miles: radiusMiles
    }
  } catch (error) {
    logger.error('Error checking service radius:', error)
    throw new Error('Failed to check service radius')
  }
}

// Check service area with driving distance
export async function checkServiceAreaWithDriving(
  baseAddress: string,
  clientAddress: string,
  radiusMiles: number
): Promise<DistanceResult> {
  try {
    const distanceResult = await getDrivingDistance(baseAddress, clientAddress)
    
    return {
      ...distanceResult,
      is_within_radius: distanceResult.distance_miles <= radiusMiles,
      radius_miles: radiusMiles
    }
  } catch (error) {
    logger.error('Error checking service area with driving distance:', error)
    // Fallback to straight-line distance
    return checkServiceRadius(baseAddress, clientAddress, radiusMiles)
  }
}

// Batch geocode multiple addresses
export async function batchGeocodeAddresses(addresses: string[]): Promise<GeocodingResult[]> {
  const results = await Promise.allSettled(
    addresses.map(address => geocodeAddress(address))
  )
  
  return results
    .filter((result): result is PromiseFulfilledResult<GeocodingResult> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value)
}

// Validate address format
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  if (address.trim().length < 5) return false
  if (address.trim().length > 200) return false
  
  // Basic validation - should contain at least a number and some text
  const hasNumber = /\d/.test(address)
  const hasText = /[a-zA-Z]/.test(address)
  
  return hasNumber && hasText
}

// Format address for geocoding
export function formatAddressForGeocoding(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except common address chars
}