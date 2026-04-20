'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressInput } from './AddressInput'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { Clock, MapPin, Route, Loader2 } from 'lucide-react'

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

interface TravelCalculatorProps {
  onTravelInfoChange?: (travelInfo: TravelInfo | null) => void
  className?: string
}

export function TravelCalculator({ onTravelInfoChange, className }: TravelCalculatorProps) {
  const { calculateTravelInfo, loading, error } = useGoogleMaps()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null)
  const [mode, setMode] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving')

  const handleCalculate = async () => {
    if (!origin || !destination) return

    const info = await calculateTravelInfo(origin, destination, mode)
    setTravelInfo(info)
    onTravelInfoChange?.(info)
  }

  const formatCoordinates = (coords: { lat: number; lng: number }) => {
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Travel Calculator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AddressInput
            label="From"
            placeholder="Starting address..."
            value={origin}
            onChange={setOrigin}
          />
          
          <AddressInput
            label="To"
            placeholder="Destination address..."
            value={destination}
            onChange={setDestination}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="driving">Driving</option>
            <option value="walking">Walking</option>
            <option value="bicycling">Bicycling</option>
            <option value="transit">Transit</option>
          </select>
          
          <Button
            onClick={handleCalculate}
            disabled={loading || !origin || !destination}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Route className="h-4 w-4 mr-2" />
                Calculate Travel Time
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {travelInfo && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Travel Time</div>
                  <div className="font-medium">{travelInfo.duration.text}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Distance</div>
                  <div className="font-medium">{travelInfo.distance.text}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Origin: {formatCoordinates(travelInfo.coordinates.origin)}</div>
                <div>Destination: {formatCoordinates(travelInfo.coordinates.destination)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
