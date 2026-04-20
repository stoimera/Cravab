'use client'

import { logger } from '@/lib/logger'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { geocodeAddress, checkServiceRadius, checkServiceAreaWithDriving } from '@/lib/geocoding/google-maps'

interface ServiceAreaResult {
  is_serviced: boolean
  service_area_name?: string
  distance_miles?: number
  eta_minutes?: number
  message?: string
  duration_text?: string
}

interface ServiceAreaCheckerProps {
  baseAddress: string
  serviceRadiusMiles: number
  onResult?: (result: ServiceAreaResult) => void
}

export function ServiceAreaChecker({ 
  baseAddress, 
  serviceRadiusMiles, 
  onResult 
}: ServiceAreaCheckerProps) {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<ServiceAreaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAddress = useCallback(async (useDrivingDistance = true) => {
    if (!address.trim()) {
      setError('Please enter an address')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let distanceResult

      if (useDrivingDistance) {
        distanceResult = await checkServiceAreaWithDriving(
          baseAddress,
          address,
          serviceRadiusMiles
        )
      } else {
        distanceResult = await checkServiceRadius(
          baseAddress,
          address,
          serviceRadiusMiles
        )
      }

      const serviceResult: ServiceAreaResult = {
        is_serviced: distanceResult.is_within_radius,
        service_area_name: useDrivingDistance ? 'Google Maps Service Area' : 'Straight-line Service Area',
        distance_miles: distanceResult.distance_miles,
        eta_minutes: distanceResult.duration_minutes || Math.round(distanceResult.distance_miles * 2),
        message: distanceResult.is_within_radius
          ? `We service this area! Distance: ${distanceResult.distance_miles.toFixed(1)} miles, ETA: ${distanceResult.duration_text || 'N/A'}`
          : `We don't currently service this area. Distance: ${distanceResult.distance_miles.toFixed(1)} miles (radius: ${serviceRadiusMiles} miles)`,
        duration_text: distanceResult.duration_text
      }

      setResult(serviceResult)
      onResult?.(serviceResult)
    } catch (err) {
      logger.error('Service area check error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check service area')
    } finally {
      setLoading(false)
    }
  }, [address, baseAddress, serviceRadiusMiles, onResult])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkAddress(true) // Use driving distance by default
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Service Area Checker
        </CardTitle>
        <CardDescription>
          Check if an address is within our service area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Address</label>
          <Input 
            value={baseAddress} 
            disabled 
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            Service radius: {serviceRadiusMiles} miles
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Client Address
            </label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter client address (e.g., 123 Main St, Chicago, IL)"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !address.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Service Area (Driving)'
              )}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={() => checkAddress(false)}
              disabled={loading || !address.trim()}
            >
              Straight-line
            </Button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.is_serviced ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={result.is_serviced ? 'default' : 'destructive'}>
                {result.is_serviced ? 'Service Available' : 'Outside Service Area'}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{result.message}</p>
              
              {result.distance_miles && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{result.distance_miles.toFixed(1)} miles</span>
                  </div>
                  
                  {result.eta_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {result.duration_text || `${result.eta_minutes} minutes`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Method: {result.service_area_name}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Address Autocomplete Component
interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: string) => void
  placeholder?: string
  disabled?: boolean
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Enter address...",
  disabled = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue)
    
    if (inputValue.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // In a real implementation, you would call the getAddressSuggestions function
      // For now, we'll just show a placeholder
      setSuggestions([])
    } catch (error) {
      logger.error('Address suggestions error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              onClick={() => {
                onSelect(suggestion)
                setSuggestions([])
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
