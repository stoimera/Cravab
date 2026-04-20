'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TravelCalculator } from '@/components/ui/TravelCalculator'
import { AddressInput } from '@/components/ui/AddressInput'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { z } from 'zod'
import { Calendar, MapPin, Clock, User } from 'lucide-react'

const createAppointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  starts_at: z.string().min(1, 'Start time is required'),
  ends_at: z.string().min(1, 'End time is required'),
  address: z.string().min(1, 'Address is required'),
  client_id: z.string().min(1, 'Client is required'),
  service_id: z.string().optional(),
  priority: z.enum(['normal', 'high', 'emergency']),
  estimated_cost: z.number().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  labor_hours: z.number().min(0).optional(),
})

type CreateAppointmentData = z.infer<typeof createAppointmentSchema>

interface CreateAppointmentFormProps {
  onClose: () => void
  onCreate: (appointment: CreateAppointmentData & { 
    travel_time_minutes?: number | null
    travel_distance_miles?: number | null
    coordinates?: string | null
  }) => void
  clients: Array<{ id: string; first_name: string; last_name: string }>
  services: Array<{ id: string; name: string; base_price: number }>
}

export function CreateAppointmentForm({ 
  onClose, 
  onCreate, 
  clients, 
  services 
}: CreateAppointmentFormProps) {
  const { calculateTravelInfo, loading } = useGoogleMaps()
  const [travelInfo, setTravelInfo] = useState<any>(null)
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [companyAddress, setCompanyAddress] = useState('') // This would come from company settings

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateAppointmentData>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      priority: 'normal',
    },
  })

  const watchedAddress = watch('address')

  const handleTravelInfoChange = (info: any) => {
    setTravelInfo(info)
  }

  const handleAddressCoordinatesChange = (coordinates: { lat: number; lng: number } | null) => {
    setAddressCoordinates(coordinates)
  }

  const onSubmit = async (data: CreateAppointmentData) => {
    // Calculate travel time from company address to appointment address
    let travelTimeMinutes: number | null = null
    let travelDistanceMiles: number | null = null
    let coordinates: string | null = null

    if (companyAddress && data.address) {
      try {
        const travelData = await calculateTravelInfo(companyAddress, data.address)
        if (travelData) {
          travelTimeMinutes = travelData.duration.minutes
          travelDistanceMiles = travelData.distance.miles
        }
      } catch (error) {
        logger.error('Error calculating travel time:', error)
      }
    }

    // Format coordinates as PostGIS POINT
    if (addressCoordinates) {
      coordinates = `POINT(${addressCoordinates.lng} ${addressCoordinates.lat})`
    }

    onCreate({
      ...data,
      travel_time_minutes: travelTimeMinutes,
      travel_distance_miles: travelDistanceMiles,
      coordinates,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Appointment
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Drain Cleaning"
                  className="mobile-input"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mobile-input"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Additional details about the appointment..."
                className="mobile-input min-h-[80px]"
              />
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <select
                {...register('client_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mobile-input"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service_id">Service (Optional)</Label>
              <select
                {...register('service_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mobile-input"
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.base_price}
                  </option>
                ))}
              </select>
            </div>

            {/* Address with Google Maps Integration */}
            <AddressInput
              label="Service Address *"
              placeholder="Enter the service address..."
              value={watchedAddress || ''}
              onChange={(value) => setValue('address', value)}
              onCoordinatesChange={handleAddressCoordinatesChange}
            />

            {/* Travel Calculator */}
            {companyAddress && watchedAddress && (
              <TravelCalculator
                onTravelInfoChange={handleTravelInfoChange}
                className="border-t pt-4"
              />
            )}

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Start Time *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  {...register('starts_at')}
                  className="mobile-input"
                />
                {errors.starts_at && (
                  <p className="text-sm text-red-600">{errors.starts_at.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends_at">End Time *</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  {...register('ends_at')}
                  className="mobile-input"
                />
                {errors.ends_at && (
                  <p className="text-sm text-red-600">{errors.ends_at.message}</p>
                )}
              </div>
            </div>

            {/* Travel Information Display */}
            {travelInfo && (
              <div className="p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Travel Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Travel Time: {travelInfo.duration.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>Distance: {travelInfo.distance.text}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Pricing Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost">Estimated Cost</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('estimated_cost', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="mobile-input"
                  />
                  {errors.estimated_cost && (
                    <p className="text-sm text-red-600">{errors.estimated_cost.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_cost">Actual Cost</Label>
                  <Input
                    id="actual_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('actual_cost', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="mobile-input"
                  />
                  {errors.actual_cost && (
                    <p className="text-sm text-red-600">{errors.actual_cost.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labor_hours">Labor Hours</Label>
                  <Input
                    id="labor_hours"
                    type="number"
                    step="0.25"
                    min="0"
                    {...register('labor_hours', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="mobile-input"
                  />
                  {errors.labor_hours && (
                    <p className="text-sm text-red-600">{errors.labor_hours.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 mobile-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 mobile-button"
              >
                {loading ? 'Creating...' : 'Create Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
