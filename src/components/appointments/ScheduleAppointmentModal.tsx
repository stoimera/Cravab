'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useClients, useServices, useCreateAppointment } from '@/hooks/useQueries'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Calendar as CalendarIcon, Clock, User, Phone, MapPin, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Service, Client } from '@/types/database-comprehensive'

interface ScheduleAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAppointmentScheduled: () => void
  tenantId: string
  initialClientId?: string
  initialDate?: Date
}

export function ScheduleAppointmentModal({
  isOpen,
  onClose,
  onAppointmentScheduled,
  tenantId,
  initialClientId,
  initialDate
}: ScheduleAppointmentModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate)
  const [showCalendar, setShowCalendar] = useState(false)
  
  // React Query hooks
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients(tenantId)
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices(tenantId)
  const createAppointmentMutation = useCreateAppointment(tenantId)
  
  const [formData, setFormData] = useState({
    client_id: initialClientId || '',
    service_id: '',
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    duration_minutes: 60,
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    assigned_to: [] as string[]
  })

  // Data is now fetched automatically by React Query hooks

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      setFormData(prev => ({
        ...prev,
        starts_at: `${dateStr}T09:00`,
        ends_at: `${dateStr}T10:00`
      }))
    }
  }, [selectedDate])

  // Filter active clients and services
  const activeClients = (clients as Client[]).filter(client => client.status === 'active')
  const activeServices = (services as Service[]).filter(service => service.is_active)

  const handleServiceChange = (serviceId: string) => {
    const service = activeServices.find(s => s.id === serviceId)
    if (service && selectedDate) {
      const startTime = new Date(formData.starts_at)
      const endTime = new Date(startTime.getTime() + (service.estimated_duration_minutes || 60) * 60000)
      
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        ends_at: endTime.toISOString().slice(0, 16)
      }))
    } else {
      setFormData(prev => ({ ...prev, service_id: serviceId }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_id || !formData.service_id || !formData.starts_at || !formData.ends_at) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Create appointment using React Query hook
      await createAppointmentMutation.mutateAsync({
        client_id: formData.client_id,
        service_id: formData.service_id,
        title: formData.title || 'Appointment',
        description: formData.description || null,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        duration_minutes: formData.duration_minutes || 60,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        notes: formData.notes || null,
        status: 'scheduled',
        created_by: user?.id || ''
      })

      toast.success('Appointment scheduled successfully!')
      onAppointmentScheduled()
      onClose()
    } catch (error: any) {
      // Error scheduling appointment
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule appointment';
      if (errorMessage.includes('conflict') || errorMessage.includes('already booked')) {
        toast.error('This time slot is already booked. Please choose a different time.');
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your appointment details and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to schedule appointments. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to schedule appointment. Please check your connection and try again.');
      } else {
        toast.error('Failed to schedule appointment. Please try again.');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      client_id: '',
      service_id: '',
      title: '',
      description: '',
      starts_at: '',
      ends_at: '',
      duration_minutes: 60,
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: '',
      assigned_to: []
    })
    setSelectedDate(undefined)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-transition sm:max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold">Schedule Appointment</CardTitle>
            <CardDescription>
              Create a new appointment for a client
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger className="form-transition">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading clients...</span>
                      </div>
                    </SelectItem>
                  ) : (
                    activeClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{client.first_name} {client.last_name}</span>
                          {client.phone && (
                            <span className="text-sm text-gray-500">({client.phone})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service_id">Service *</Label>
              <Select
                value={formData.service_id}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger className="form-transition">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {servicesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading services...</span>
                      </div>
                    </SelectItem>
                  ) : (
                    activeServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{service.name}</span>
                          {service.estimated_duration_minutes && (
                            <span className="text-sm text-gray-500">
                              ({service.estimated_duration_minutes} min)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Title and Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter appointment title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="form-transition"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter appointment description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-transition"
                  rows={3}
                />
              </div>
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal form-transition"
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
                          setSelectedDate(date)
                          setShowCalendar(false)
                        }
                      }}
                      disabled={(date: Date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="starts_at">Start Time *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                  className="form-transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">End Time *</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                className="form-transition"
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St"
                  className="form-transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Boston"
                    className="form-transition"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="MA"
                    className="form-transition"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="02101"
                    className="form-transition"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or special instructions..."
                className="form-transition"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="btn-transition"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="btn-transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Appointment'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
