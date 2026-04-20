interface GoogleMapsConfig {
  apiKey: string
  baseUrl: string
}

interface DistanceMatrixResponse {
  destination_addresses: string[]
  origin_addresses: string[]
  rows: Array<{
    elements: Array<{
      distance: {
        text: string
        value: number // in meters
      }
      duration: {
        text: string
        value: number // in seconds
      }
      status: string
    }>
  }>
  status: string
}

interface GeocodingResponse {
  results: Array<{
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    place_id: string
  }>
  status: string
}

interface TravelInfo {
  distance: {
    text: string
    meters: number
    miles: number
  }
  duration: {
    text: string
    seconds: number
    minutes: number
  }
  coordinates: {
    origin: { lat: number; lng: number }
    destination: { lat: number; lng: number }
  }
}

class GoogleMapsService {
  private config: GoogleMapsConfig

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    this.config = {
      apiKey,
      baseUrl: 'https://maps.googleapis.com/maps/api'
    }
  }

  // Geocode an address to get coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const encodedAddress = encodeURIComponent(address)
      const url = `${this.config.baseUrl}/geocode/json?address=${encodedAddress}&key=${this.config.apiKey}`
      
      const response = await fetch(url)
      const data: GeocodingResponse = await response.json()

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          lat: location.lat,
          lng: location.lng
        }
      }

      // Geocoding failed
      return null
    } catch (error) {
      // Error geocoding address
      return null
    }
  }

  // Calculate travel time and distance between two addresses
  async calculateTravelInfo(
    origin: string, 
    destination: string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<TravelInfo | null> {
    try {
      const encodedOrigin = encodeURIComponent(origin)
      const encodedDestination = encodeURIComponent(destination)
      
      const url = `${this.config.baseUrl}/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&mode=${mode}&units=imperial&key=${this.config.apiKey}`
      
      const response = await fetch(url)
      const data: DistanceMatrixResponse = await response.json()

      if (data.status === 'OK' && data.rows.length > 0 && data.rows[0].elements.length > 0) {
        const element = data.rows[0].elements[0]
        
        if (element.status === 'OK') {
          // Get coordinates for both addresses
          const [originCoords, destCoords] = await Promise.all([
            this.geocodeAddress(origin),
            this.geocodeAddress(destination)
          ])

          return {
            distance: {
              text: element.distance.text,
              meters: element.distance.value,
              miles: element.distance.value * 0.000621371 // Convert meters to miles
            },
            duration: {
              text: element.duration.text,
              seconds: element.duration.value,
              minutes: Math.round(element.duration.value / 60)
            },
            coordinates: {
              origin: originCoords || { lat: 0, lng: 0 },
              destination: destCoords || { lat: 0, lng: 0 }
            }
          }
        }
      }

      // Distance calculation failed
      return null
    } catch (error) {
      // Error calculating travel info
      return null
    }
  }

  // Calculate travel time between two addresses (simplified)
  async calculateTravelTime(
    origin: string, 
    destination: string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<number | null> {
    const travelInfo = await this.calculateTravelInfo(origin, destination, mode)
    return travelInfo?.duration.minutes || null
  }

  // Calculate distance between two addresses (simplified)
  async calculateDistance(
    origin: string, 
    destination: string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<number | null> {
    const travelInfo = await this.calculateTravelInfo(origin, destination, mode)
    return travelInfo?.distance.miles || null
  }

  // Get coordinates for an address
  async getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    return this.geocodeAddress(address)
  }

  // Format coordinates as PostGIS POINT string
  formatCoordinatesAsPoint(lat: number, lng: number): string {
    return `POINT(${lng} ${lat})`
  }

  // Parse PostGIS POINT string to coordinates
  parsePointToCoordinates(point: string): { lat: number; lng: number } | null {
    const match = point.match(/POINT\(([^ ]+) ([^ ]+)\)/)
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2])
      }
    }
    return null
  }
}

let googleMapsServiceInstance: GoogleMapsService | null = null

export function getGoogleMapsService(): GoogleMapsService {
  if (!googleMapsServiceInstance) {
    googleMapsServiceInstance = new GoogleMapsService()
  }
  return googleMapsServiceInstance
}

export const calculateTravelTime = (origin: string, destination: string, mode?: 'driving' | 'walking' | 'bicycling' | 'transit') =>
  getGoogleMapsService().calculateTravelTime(origin, destination, mode)

export const calculateDistance = (origin: string, destination: string, mode?: 'driving' | 'walking' | 'bicycling' | 'transit') =>
  getGoogleMapsService().calculateDistance(origin, destination, mode)

export const getCoordinates = (address: string) => getGoogleMapsService().getCoordinates(address)

export const calculateTravelInfo = (
  origin: string,
  destination: string,
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
) => getGoogleMapsService().calculateTravelInfo(origin, destination, mode)

export type { TravelInfo }
