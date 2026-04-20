// Service Area Management Utilities
import { createServiceClient } from '@/lib/supabase/service'
import { 
  geocodeAddress, 
  checkServiceRadius, 
  checkServiceAreaWithDriving,
  calculateDistance,
  type GeocodingResult,
  type DistanceResult
} from '@/lib/geocoding/google-maps'
import { logger } from '@/lib/logger'

export interface ServiceAreaResult {
  is_serviced: boolean
  service_area_name?: string
  distance_miles?: number
  eta_minutes?: number
  message: string
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  formatted_address: string
}

export interface ServiceAreaCoverage {
  id: string
  tenant_id: string
  name: string
  description?: string
  center_address: string
  center_latitude: number
  center_longitude: number
  radius_miles: number
  zip_codes: string[]
  cities: string[]
  states: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompanyServiceSettings {
  base_address?: string
  base_latitude?: number
  base_longitude?: number
  service_radius_miles?: number
  service_areas?: any[]
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// geocodeAddress is now imported from @/lib/geocoding/google-maps

/**
 * Check if an address is in the service area
 */
export async function checkServiceArea(
  tenantId: string,
  address: string,
  latitude?: number,
  longitude?: number
): Promise<ServiceAreaResult> {
  try {
    const supabase = createServiceClient()
    
    // If coordinates not provided, geocode the address using Google Maps
    let lat = latitude
    let lon = longitude
    
    if (!lat || !lon) {
      try {
        // Add timeout to geocoding
        const geocodePromise = geocodeAddress(address)
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Geocoding timeout')), 10000) // 10 second timeout
        )
        
        const geocodeResult = await Promise.race([geocodePromise, timeoutPromise])
        if (!geocodeResult) {
          // Geocoding failed - try fallback with base address
          logger.warn('Geocoding returned null, trying fallback with base address')
          return await handleGeocodingFallback(tenantId, address)
        }
        lat = geocodeResult.latitude
        lon = geocodeResult.longitude
      } catch (error) {
        logger.error('Geocoding error:', error)
        // Geocoding failed - try fallback with base address instead of immediately returning false
        logger.warn('Geocoding failed, trying fallback with base address')
        return await handleGeocodingFallback(tenantId, address)
      }
    }
    
    // Call the database function to check service area
    const { data, error } = await supabase.rpc('is_address_serviced', {
      p_tenant_id: tenantId,
      p_latitude: lat,
      p_longitude: lon,
      p_address: address
    } as any) as { data: any[] | null; error: any }
    
    if (error) {
      // Fallback: Check if it's a function not found error
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        
        // Get company settings to check if we have base address
        const companySettings = await getCompanyServiceSettings(tenantId)
        
        if (companySettings?.base_address && companySettings?.service_radius_miles) {
          try {
            // Use Google Maps to check service area with driving distance
            const distanceResult = await checkServiceAreaWithDriving(
              companySettings.base_address,
              address,
              companySettings.service_radius_miles
            )
            
            return {
              is_serviced: distanceResult.is_within_radius,
              service_area_name: 'Google Maps Service Area',
              distance_miles: distanceResult.distance_miles,
              eta_minutes: distanceResult.duration_minutes || Math.round(distanceResult.distance_miles * 2),
              message: distanceResult.is_within_radius
                ? `We service this area! Distance: ${distanceResult.distance_miles.toFixed(1)} miles, ETA: ${distanceResult.duration_text || 'N/A'}`
                : `We don't currently service this area. Distance: ${distanceResult.distance_miles.toFixed(1)} miles (radius: ${companySettings.service_radius_miles} miles)`
            }
          } catch (googleMapsError) {
            
            try {
              // Fallback to straight-line distance calculation
              const distanceResult = await checkServiceRadius(
                companySettings.base_address,
                address,
                companySettings.service_radius_miles
              )
              
              return {
                is_serviced: distanceResult.is_within_radius,
                service_area_name: 'Straight-line Service Area',
                distance_miles: distanceResult.distance_miles,
                eta_minutes: Math.round(distanceResult.distance_miles * 2), // Rough estimate
                message: distanceResult.is_within_radius
                  ? `We service this area! Distance: ${distanceResult.distance_miles.toFixed(1)} miles (straight-line)`
                  : `We don't currently service this area. Distance: ${distanceResult.distance_miles.toFixed(1)} miles (radius: ${companySettings.service_radius_miles} miles)`
              }
            } catch (geocodingError) {
              // Continue to major city fallback below
            }
          }
        }
        
        // If no base coordinates, default to serviced for major cities
        const majorCities = ['chicago', 'boston', 'new york', 'los angeles', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas']
        const isMajorCity = majorCities.some(city => address.toLowerCase().includes(city))
        
        return {
          is_serviced: isMajorCity,
          service_area_name: isMajorCity ? 'Major City Coverage' : 'Limited Coverage',
          distance_miles: isMajorCity ? 0 : 999999,
          eta_minutes: isMajorCity ? 30 : undefined,
          message: isMajorCity 
            ? 'We service this major city area!'
            : 'Service area check not yet configured. Please contact us to confirm coverage.'
        }
      }
      
      return {
        is_serviced: false,
        message: 'Error checking service area'
      }
    }
    
    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0] as any
      return {
        is_serviced: result.is_serviced,
        service_area_name: result.service_area_name,
        distance_miles: result.distance_miles,
        eta_minutes: result.eta_minutes,
        message: result.is_serviced 
          ? `We service this area! Distance: ${result.distance_miles?.toFixed(1)} miles, ETA: ${result.eta_minutes} minutes`
          : `We don't currently service this area. Distance: ${result.distance_miles?.toFixed(1)} miles`
      }
    }
    
    return {
      is_serviced: false,
      message: 'Service area check failed'
    }
  } catch (error) {
    return {
      is_serviced: false,
      message: 'Error checking service area'
    }
  }
}

/**
 * Get service area coverage for a tenant
 */
export async function getServiceAreaCoverage(tenantId: string): Promise<ServiceAreaCoverage[]> {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('service_area_coverage')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      return []
    }
    
    return data || []
  } catch (error) {
    return []
  }
}

/**
 * Handle geocoding failure fallback - check service area using base address
 */
async function handleGeocodingFallback(
  tenantId: string,
  address: string
): Promise<ServiceAreaResult> {
  try {
    let companySettings = await getCompanyServiceSettings(tenantId)
    
    // If company_settings doesn't have base_address, check tenants table
    if (!companySettings || !companySettings.base_address) {
      const supabase = createServiceClient()
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('base_address, address, service_radius')
        .eq('id', tenantId)
        .single()
      
      if (tenantData && (tenantData.base_address || tenantData.address)) {
        companySettings = {
          base_address: (tenantData.base_address || tenantData.address) ?? undefined,
          service_radius_miles: tenantData.service_radius || 25
        }
      }
    }
    
    if (!companySettings || !companySettings.base_address) {
      return {
        is_serviced: false,
        message: 'Unable to geocode address - service area check failed'
      }
    }

    // Extract location information from addresses (city, state, ZIP)
    const extractLocation = (addr: string): { city?: string; state?: string; zip?: string } => {
      const parts = addr.split(',').map(p => p.trim().toLowerCase())
      const result: { city?: string; state?: string; zip?: string } = {}
      
      if (parts.length >= 2) {
        // Last part is usually state
        result.state = parts[parts.length - 1]
        // Second to last is usually city
        if (parts.length >= 2) {
          result.city = parts[parts.length - 2]
        }
        // Check for ZIP code in any part (5 digits or 5+4 format)
        parts.forEach(part => {
          const zipMatch = part.match(/\b\d{5}(-\d{4})?\b/)
          if (zipMatch) {
            result.zip = zipMatch[0]
          }
        })
      }
      return result
    }

    const clientLocation = extractLocation(address)
    const baseLocation = extractLocation(companySettings.base_address || '')

    // PRIORITY 1: If same ZIP code, definitely serviceable (within same small area)
    if (clientLocation.zip && baseLocation.zip && clientLocation.zip === baseLocation.zip) {
      return {
        is_serviced: true,
        service_area_name: 'Same ZIP Code',
        distance_miles: 0,
        eta_minutes: 15,
        message: `We service this area! Same ZIP code (${clientLocation.zip}) as our base location.`
      }
    }

    // PRIORITY 2: If same city and state, assume serviceable (within reasonable radius)
    // This is the primary fallback when geocoding fails but addresses are in same city/state
    if (clientLocation.city && clientLocation.state && 
        baseLocation.city && baseLocation.state &&
        clientLocation.city === baseLocation.city &&
        clientLocation.state === baseLocation.state) {
      // If we have service radius, mention it in the message
      const radiusInfo = companySettings.service_radius_miles 
        ? ` (within our ${companySettings.service_radius_miles} mile service radius)`
        : ''
      
      return {
        is_serviced: true,
        service_area_name: 'Same City/State',
        distance_miles: 0,
        eta_minutes: 30,
        message: `We service this area! Same city (${clientLocation.city}) and state (${clientLocation.state}) as our base location${radiusInfo}.`
      }
    }

    // PRIORITY 3: If base address contains the city/state from client address, assume serviceable
    const baseAddressLower = (companySettings.base_address || '').toLowerCase()
    if (clientLocation.city && baseAddressLower.includes(clientLocation.city) &&
        clientLocation.state && baseAddressLower.includes(clientLocation.state)) {
      return {
        is_serviced: true,
        service_area_name: 'City/State Match',
        distance_miles: 0,
        eta_minutes: 30,
        message: `We service this area! Same city and state as our base location.`
      }
    }

    // PRIORITY 4: Word matching - if key location words match (city name, state)
    const baseWords = baseAddressLower.split(/[,\s]+/).filter(w => w.length > 2)
    const addressWords = address.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2)
    const matchingWords = baseWords.filter(word => addressWords.includes(word))
    
    // If we have at least 2 matching location words (likely city and state), assume serviceable
    if (matchingWords.length >= 2) {
      return {
        is_serviced: true,
        service_area_name: 'Location Match',
        distance_miles: 0,
        eta_minutes: 30,
        message: `We service this area! Location matches our service area.`
      }
    }
    
    // If all fallbacks fail, return false but with helpful message
    return {
      is_serviced: false,
      message: 'Unable to verify service area - geocoding unavailable. Please contact us directly to confirm coverage.'
    }
  } catch (error) {
    logger.error('Error in geocoding fallback:', error)
    return {
      is_serviced: false,
      message: 'Unable to geocode address - service area check failed'
    }
  }
}

/**
 * Get company service settings
 */
export async function getCompanyServiceSettings(tenantId: string): Promise<CompanyServiceSettings | null> {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('company_settings')
      .select('base_address, base_latitude, base_longitude, service_radius_miles, service_areas')
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) {
      return null
    }
    
    return data as CompanyServiceSettings | null
  } catch (error) {
    return null
  }
}

/**
 * Create a new service area coverage
 */
export async function createServiceAreaCoverage(
  tenantId: string,
  coverage: {
    coverage_type: string
    coverage_value: string
    is_active?: boolean
    description?: string
    center_address?: string
    center_latitude?: number
    center_longitude?: number
    radius_miles?: number
    zip_codes?: string[]
    cities?: string[]
    states?: string[]
  }
): Promise<any> {
  try {
    const supabase = createServiceClient()
    
    // Use the RPC function for better type safety and validation
    const { data, error } = await (supabase as any).rpc('create_service_area_coverage', {
      p_tenant_id: tenantId,
      p_coverage_type: coverage.coverage_type,
      p_coverage_value: coverage.coverage_value,
      p_is_active: coverage.is_active ?? true
    })
    
    if (error) {
      return null
    }
    
    return data?.[0] || data
  } catch (error) {
    return null
  }
}

/**
 * Update company service settings
 */
export async function updateCompanyServiceSettings(
  tenantId: string,
  settings: Partial<CompanyServiceSettings>
): Promise<boolean> {
  try {
    const supabase = createServiceClient()
    
    const updateData: any = {}
    if (settings.base_address !== undefined) updateData.base_address = settings.base_address
    if (settings.base_latitude !== undefined) updateData.base_latitude = settings.base_latitude
    if (settings.base_longitude !== undefined) updateData.base_longitude = settings.base_longitude
    if (settings.service_radius_miles !== undefined) updateData.service_radius_miles = settings.service_radius_miles
    if (settings.service_areas !== undefined) updateData.service_areas = settings.service_areas
    
    const { error } = await supabase
      .from('company_settings')
      .update(updateData)
      .eq('tenant_id', tenantId)
    
    if (error) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}
