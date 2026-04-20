'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressInputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onCoordinatesChange?: (coordinates: { lat: number; lng: number } | null) => void
  className?: string
  required?: boolean
}

export function AddressInput({
  label = 'Address',
  placeholder = 'Enter address...',
  value,
  onChange,
  onCoordinatesChange,
  className,
  required = false,
}: AddressInputProps) {
  const { geocodeAddress, loading, error } = useGoogleMaps()
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  // Geocode address when value changes
  useEffect(() => {
    if (value && value.length > 5) { // Only geocode if address is substantial
      const timeoutId = setTimeout(async () => {
        const coords = await geocodeAddress(value)
        setCoordinates(coords)
        onCoordinatesChange?.(coords)
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timeoutId)
    } else {
      setCoordinates(null)
      onCoordinatesChange?.(null)
    }
  }, [value, geocodeAddress, onCoordinatesChange])

  const handleGeocode = async () => {
    if (!value) return
    
    const coords = await geocodeAddress(value)
    setCoordinates(coords)
    onCoordinatesChange?.(coords)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="address" className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </Label>
      
      <div className="flex gap-2">
        <Input
          id="address"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGeocode}
          disabled={loading || !value}
          className="px-3"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {coordinates && (
        <div className="text-sm text-green-600 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
