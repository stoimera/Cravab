'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

import { updateAppointmentSchema, UpdateAppointment } from '@/lib/schemas'

// Define the appointment type for this component
type AppointmentListItem = {
  id: string
  tenant_id: string
  client_id: string
  service_id: string | null
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  priority: 'normal' | 'high' | 'emergency'
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  coordinates: Record<string, unknown> | null
  eta_minutes: number | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  clients: {
    first_name: string
    last_name: string
    phone: string
    email: string | null
    address: string | null
  } | null
  services: {
    id: string
    name: string
    description: string | null
    category: string | null
    base_price: number | null
    hourly_rate: number | null
    estimated_duration_minutes: number | null
    is_emergency_service: boolean | null
    requires_equipment: boolean | null
  } | null
  users: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    role: string
  } | null
}

interface EditAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentListItem | null
  onAppointmentUpdated: (appointment: AppointmentListItem) => void
  tenantId: string
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
  tenantId
}: EditAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<UpdateAppointment>({
    resolver: zodResolver(updateAppointmentSchema),
    defaultValues: {
      title: '',
      description: '',
      starts_at: '',
      ends_at: '',
      duration_minutes: 60,
      status: 'scheduled',
      priority: 'normal',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    }
  })

  // Watch form values
  const watchedStartsAt = watch('starts_at')
  const watchedDuration = watch('duration_minutes')

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.starts_at)
      const endDate = new Date(appointment.ends_at)
      
      setSelectedDate(startDate)
      
      reset({
        title: appointment.title,
        description: appointment.description || '',
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        priority: appointment.priority,
        address: appointment.address || '',
        city: appointment.city || '',
        state: appointment.state || '',
        zip_code: appointment.zip_code || '',
        notes: appointment.notes || ''
      })
    }
  }, [appointment, reset])

  // Auto-calculate end time when start time or duration changes
  useEffect(() => {
    if (watchedStartsAt && watchedDuration) {
      const startDate = new Date(watchedStartsAt)
      const endDate = new Date(startDate.getTime() + watchedDuration * 60 * 1000)
      setValue('ends_at', endDate.toISOString())
    }
  }, [watchedStartsAt, watchedDuration, setValue])

  const handleDateSelect = (date: Date | undefined) => {
    if (date && watchedStartsAt) {
      const startTime = new Date(watchedStartsAt)
      const newStartDate = new Date(date)
      newStartDate.setHours(startTime.getHours())
      newStartDate.setMinutes(startTime.getMinutes())
      
      setValue('starts_at', newStartDate.toISOString())
      setSelectedDate(date)
      setShowCalendar(false)
    }
  }

  const handleTimeChange = (time: string, field: 'starts_at' | 'ends_at') => {
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      const currentDate = field === 'starts_at' ? selectedDate : (watchedStartsAt ? new Date(watchedStartsAt) : selectedDate)
      
      if (currentDate) {
        const newDateTime = new Date(currentDate)
        newDateTime.setHours(hours, minutes, 0, 0)
        
        setValue(field, newDateTime.toISOString())
        
        // If changing start time, recalculate end time
        if (field === 'starts_at') {
          const endDateTime = new Date(newDateTime.getTime() + (watchedDuration || 60) * 60 * 1000)
          setValue('ends_at', endDateTime.toISOString())
        }
      }
    }
  }

  const handleDurationChange = (duration: number) => {
    setValue('duration_minutes', duration)
    if (watchedStartsAt) {
      const startDate = new Date(watchedStartsAt)
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000)
      setValue('ends_at', endDate.toISOString())
    }
  }

  const getTimeFromDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const onSubmit = async (data: UpdateAppointment) => {
    if (!appointment) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          updatedData: data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update appointment')
      }

      const result = await response.json()
      
      // Update the appointment in the parent component
      const updatedAppointment = {
        ...appointment,
        ...data,
        updated_at: new Date().toISOString()
      }
      
      onAppointmentUpdated(updatedAppointment)
      toast.success('Appointment updated successfully')
      onClose()
    } catch (error) {
      // Error updating appointment
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment';
      if (errorMessage.includes('conflict') || errorMessage.includes('already booked')) {
        toast.error('This time slot is already booked. Please choose a different time.');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your appointment details and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to update appointments. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to update appointment. Please check your connection and try again.');
      } else {
        toast.error('Failed to update appointment. Please try again.');
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointment.id,
          status: 'cancelled'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel appointment')
      }

      const updatedAppointment = {
        ...appointment,
        status: 'cancelled' as const,
        updated_at: new Date().toISOString()
      }
      
      onAppointmentUpdated(updatedAppointment)
      toast.success('Appointment cancelled successfully')
      onClose()
    } catch (error) {
      // Error cancelling appointment
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel appointment';
      if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to cancel appointments. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to cancel appointment. Please check your connection and try again.');
      } else {
        toast.error('Failed to cancel appointment. Please try again.');
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!appointment) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointment.id,
          status: 'completed'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark appointment as complete')
      }

      const updatedAppointment = {
        ...appointment,
        status: 'completed' as const,
        updated_at: new Date().toISOString()
      }
      
      onAppointmentUpdated(updatedAppointment)
      toast.success('Appointment marked as complete')
      onClose()
    } catch (error) {
      // Error marking appointment as complete
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark appointment as complete';
      if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to complete appointments. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to complete appointment. Please check your connection and try again.');
      } else {
        toast.error('Failed to complete appointment. Please try again.');
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white mx-auto my-4 sm:my-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Edit Appointment
          </DialogTitle>
          <DialogDescription>
            Update the appointment details below. All fields are optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Info Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
            <div className="text-sm text-gray-600">
              <p><strong>Name:</strong> {appointment.clients?.first_name} {appointment.clients?.last_name}</p>
              <p><strong>Phone:</strong> {appointment.clients?.phone}</p>
              {appointment.clients?.email && (
                <p><strong>Email:</strong> {appointment.clients.email}</p>
              )}
            </div>
          </div>

          {/* Service Info Display */}
          {appointment.services && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Service Information</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Service:</strong> {appointment.services.name}</p>
                {appointment.services.description && (
                  <p><strong>Description:</strong> {appointment.services.description}</p>
                )}
                {appointment.services.category && (
                  <p><strong>Category:</strong> {appointment.services.category}</p>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Appointment title"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Appointment description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date instanceof Date) {
                        handleDateSelect(date)
                      }
                    }}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                    className="border-gray-200"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="starts_at">Start Time *</Label>
              <Input
                id="starts_at"
                type="time"
                value={watchedStartsAt ? getTimeFromDateTime(watchedStartsAt) : ''}
                onChange={(e) => handleTimeChange(e.target.value, 'starts_at')}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="15"
              max="480"
              step="15"
              value={watchedDuration || 60}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
            />
            {errors.duration_minutes && (
              <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
            )}
          </div>

          {/* End Time Display */}
          <div className="space-y-2">
            <Label>End Time</Label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {watchedStartsAt && watchedDuration ? 
                  format(new Date(new Date(watchedStartsAt).getTime() + watchedDuration * 60 * 1000), 'PPP p') : 
                  'Select start time and duration'
                }
              </span>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={watch('priority')} onValueChange={(value) => setValue('priority', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="123 Main St"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  {...register('zip_code')}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading || appointment.status === 'cancelled'}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleMarkComplete}
                disabled={isLoading || appointment.status === 'completed'}
                className="flex-1"
              >
                ✓ Mark Complete
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
