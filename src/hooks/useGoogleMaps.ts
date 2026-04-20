'use client'

import { logger } from '@/lib/logger'
import { useState, useCallback } from 'react'

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

interface UseGoogleMapsReturn {
  calculateTravelInfo: (origin: string, destination: string, mode?: string) => Promise<TravelInfo | null>
  geocodeAddress: (address: string) => Promise<{ lat: number; lng: number } | null>
  loading: boolean
  error: string | null
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateTravelInfo = useCallback(async (
    origin: string, 
    destination: string, 
    mode: string = 'driving'
  ): Promise<TravelInfo | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/google-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination, mode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate travel info')
      }

      const data = await response.json()
      return data.travelInfo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logger.error('Error calculating travel info:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/google-maps/geocode?address=${encodeURIComponent(address)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to geocode address')
      }

      const data = await response.json()
      return data.coordinates
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logger.error('Error geocoding address:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    calculateTravelInfo,
    geocodeAddress,
    loading,
    error,
  }
}
