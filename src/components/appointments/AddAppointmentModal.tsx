'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateTimeInput } from '@/components/ui/DateTimeInput'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CreateAppointment } from '@/lib/schemas'
import { Service, Client } from '@/types/database-comprehensive'
import { useCreateAppointment, useServices, useClients } from '@/hooks/useQueries'

interface AddAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAppointmentAdded: () => void
  tenantId: string
  selectedDate?: Date
}

export function AddAppointmentModal({ 
  isOpen, 
  onClose, 
  onAppointmentAdded, 
  tenantId,
  selectedDate 
}: AddAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    service_id: '',
    starts_at: '',
    ends_at: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    priority: 'normal' as 'normal' | 'high' | 'emergency',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  })

  const supabase = createClient()
  const createAppointment = useCreateAppointment(tenantId)
  
  // Use React Query hooks for data fetching
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients(tenantId)
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices(tenantId)

  // Filter active clients
  const activeClients = (clients as Client[]).filter(client => client.status === 'active')


  useEffect(() => {
    if (isOpen) {
      // Set default date/time if selectedDate is provided
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0]
        const timeStr = selectedDate.toTimeString().slice(0, 5) // Extract HH:MM from the date
        const endTime = new Date(selectedDate.getTime() + 60 * 60 * 1000) // Add 1 hour
        const endTimeStr = endTime.toTimeString().slice(0, 5)
        setFormData(prev => ({
          ...prev,
          starts_at: `${dateStr}T${timeStr}`,
          ends_at: `${dateStr}T${endTimeStr}`
        }))
      }
    }
  }, [isOpen, selectedDate])

  // Filter active services and handle errors
  const activeServices = (services as Service[]).filter(service => service.is_active)
  
  useEffect(() => {
    if (clientsError) {
      logger.error('Error loading clients:', clientsError)
      toast.error('Failed to load clients')
    }
    if (servicesError) {
      logger.error('Error loading services:', servicesError)
      toast.error('Failed to load services')
    }
  }, [clientsError, servicesError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.starts_at || !formData.ends_at) {
      toast.error('Please fill in all required fields')
      return
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || !user.id) {
      toast.error('Please log in to create appointments')
      return
    }

    // Validate required fields
    if (!formData.client_id || formData.client_id === 'none') {
      toast.error('Please select a client')
      return
    }

    setLoading(true)
    try {

      const appointmentData: CreateAppointment = {
        client_id: formData.client_id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        service_id: formData.service_id && formData.service_id !== 'none' ? formData.service_id : null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        duration_minutes: formData.starts_at && formData.ends_at ? 
          Math.round((new Date(formData.ends_at).getTime() - new Date(formData.starts_at).getTime()) / (1000 * 60)) : 60,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        coordinates: null,
        eta_minutes: null,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes.trim() || null,
        created_by: user.id
      }


      await createAppointment.mutateAsync(appointmentData)
      toast.success('Appointment created successfully!')
      onAppointmentAdded()
      handleClose()
    } catch (error) {
      logger.error('Error creating appointment:', error)
      toast.error('Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      client_id: '',
      service_id: '',
      starts_at: '',
      ends_at: '',
      status: 'scheduled',
      priority: 'normal',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment for a client. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Pipe Repair, Water Heater Installation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the work to be performed..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="none">No client selected</SelectItem>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Loading clients...</span>
                      </div>
                    </SelectItem>
                  ) : (
                    activeClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.first_name} {client.last_name}</span>
                          <span className="text-xs text-gray-500">({client.phone})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_id">Service</Label>
              <Select
                value={formData.service_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="none">No service selected</SelectItem>
                  {servicesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Loading services...</span>
                      </div>
                    </SelectItem>
                  ) : (
                    activeServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-xs text-gray-500">${service.base_price}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateTimeInput
              label="Start Time"
              value={formData.starts_at}
              onChange={(value) => setFormData(prev => ({ ...prev, starts_at: value }))}
              required
            />

            <DateTimeInput
              label="End Time"
              value={formData.ends_at}
              onChange={(value) => setFormData(prev => ({ ...prev, ends_at: value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'normal' | 'high' | 'emergency') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Anytown"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="NY"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="12345"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Estimated Cost ($)</Label>
            <Input
              id="notes"
              type="number"
              step="0.01"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the appointment..."
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-black border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
            >
              {loading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
