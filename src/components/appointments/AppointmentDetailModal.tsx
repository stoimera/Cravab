'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'

// Define a specific type for this component's data structure
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

interface AppointmentDetailModalProps {
  appointment: AppointmentListItem | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (appointment: AppointmentListItem) => void
  onStatusChange?: (appointmentId: string, newStatus: 'cancelled' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show') => void
  onSave?: (appointmentId: string, updatedData: Partial<AppointmentListItem>) => void
}

export function AppointmentDetailModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onEdit,
  onStatusChange,
  onSave
}: AppointmentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    serviceName: '',
    appointmentDescription: '',
    serviceDescription: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  useEffect(() => {
    if (appointment) {
      setFormData({
        clientName: appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : '',
        clientPhone: appointment.clients?.phone || '',
        serviceName: appointment.title || '',
        appointmentDescription: appointment.description || '',
        serviceDescription: appointment.services?.description || '',
        address: appointment.address || '',
        city: appointment.city || '',
        state: appointment.state || '',
        zipCode: appointment.zip_code || ''
      })
    }
  }, [appointment])

  if (!appointment) return null

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'confirmed':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300'
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }


  const getDuration = () => {
    const start = new Date(appointment.starts_at)
    const end = new Date(appointment.ends_at)
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    return `${diffInMinutes} minutes`
  }

  const getFullAddress = () => {
    const parts = []
    
    // First try appointment address fields
    if (appointment.address) parts.push(appointment.address)
    if (appointment.city) parts.push(appointment.city)
    if (appointment.state) parts.push(appointment.state)
    if (appointment.zip_code) parts.push(appointment.zip_code)
    
    // If no appointment address, fall back to client address
    if (parts.length === 0 && appointment.clients?.address) {
      parts.push(appointment.clients.address)
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided'
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (onSave) {
      const updatedData = {
        // Appointment data
        title: formData.serviceName,
        description: formData.appointmentDescription,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        
        // Client data
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        
        // Service data
        serviceDescription: formData.serviceDescription
      }
      onSave(appointment.id, updatedData)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (appointment) {
      setFormData({
        clientName: appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : '',
        clientPhone: appointment.clients?.phone || '',
        serviceName: appointment.title || '',
        appointmentDescription: appointment.description || '',
        serviceDescription: appointment.services?.description || '',
        address: appointment.address || '',
        city: appointment.city || '',
        state: appointment.state || '',
        zipCode: appointment.zip_code || ''
      })
    }
    setIsEditing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Appointment Details</span>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Information */}
          {appointment.clients && (
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Client Information
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="Client name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Phone</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Name:</span> {appointment.clients.first_name} {appointment.clients.last_name}
                    </p>
                    {appointment.clients.phone && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Phone:</span> {appointment.clients.phone}
                      </p>
                    )}
                    {appointment.clients?.email && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Email:</span> {appointment.clients.email}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Service Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Service Details
            </h3>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service</Label>
                    <Input
                      id="serviceName"
                      value={formData.serviceName}
                      onChange={(e) => handleInputChange('serviceName', e.target.value)}
                      placeholder="Service name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDescription">Appointment Description</Label>
                    <Textarea
                      id="appointmentDescription"
                      value={formData.appointmentDescription}
                      onChange={(e) => handleInputChange('appointmentDescription', e.target.value)}
                      placeholder="Describe the appointment"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceDescription">Service Description</Label>
                    <Textarea
                      id="serviceDescription"
                      value={formData.serviceDescription}
                      onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
                      placeholder="Describe the service"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Service:</span> {appointment.title}
                      </p>
                      {appointment.services && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Service Type:</span> {appointment.services?.name || 'Service'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-700">Priority:</span>
                      <Badge variant="outline" className="text-gray-700 border-gray-300">
                        {appointment.priority}
                      </Badge>
                    </div>
                  </div>

                  {appointment.description && (
                    <div className="p-3 border border-gray-200 rounded">
                      <p className="text-sm font-medium mb-1 text-gray-700">Appointment Description:</p>
                      <p className="text-sm text-gray-600">{appointment.description}</p>
                    </div>
                  )}

                  {appointment.services && (
                    <div className="space-y-3">
                      {/* Service Description */}
                      {appointment.services?.description && (
                        <div className="p-3 border border-gray-200 rounded">
                          <p className="text-sm font-medium mb-1 text-gray-700">Service Description:</p>
                          <p className="text-sm text-gray-600">{appointment.services.description}</p>
                        </div>
                      )}

                  {/* Service Category & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Category:</span> {appointment.services?.category || 'General'}
                    </div>
                    {appointment.services?.is_emergency_service && (
                      <div>
                        <span className="font-medium text-red-600">Emergency Service</span>
                      </div>
                    )}
                  </div>

                  {/* Equipment Requirements */}
                  {appointment.services?.requires_equipment && (
                    <div className="p-3 border border-gray-200 rounded">
                      <p className="text-sm font-medium text-gray-800 mb-1">⚠️ Equipment Required</p>
                      <p className="text-sm text-gray-600">This service requires special equipment. Please ensure all necessary tools are available.</p>
                    </div>
                  )}

                  {/* Pricing Information */}
                  <div className="p-3 border border-gray-200 rounded">
                    <p className="text-sm font-medium mb-2 text-gray-700">Service Pricing:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Base Price:</span> ${appointment.services?.base_price?.toFixed(2) || '0.00'}
                      </div>
                      {appointment.services?.hourly_rate && (
                        <div>
                          <span className="font-medium text-gray-700">Hourly Rate:</span> ${appointment.services.hourly_rate.toFixed(2)}/hour
                        </div>
                      )}
                      {appointment.services?.estimated_duration_minutes && (
                        <div>
                          <span className="font-medium text-gray-700">Est. Duration:</span> {appointment.services.estimated_duration_minutes} minutes
                        </div>
                      )}
                    </div>
                  </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Location
            </h3>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Address:</p>
                  <p className="text-sm p-3 border border-gray-200 rounded">
                    {getFullAddress()}
                  </p>
                  {appointment.eta_minutes && (
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Travel Time:</span> {appointment.eta_minutes} minutes
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timing Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Schedule & Timing
            </h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Date:</span> {formatDate(appointment.starts_at)}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Time:</span> {formatTime(appointment.starts_at)} - {formatTime(appointment.ends_at)}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Duration:</span> {getDuration()}
              </p>
              {appointment.services?.estimated_duration_minutes && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Estimated Duration:</span> {appointment.services.estimated_duration_minutes} minutes
                </p>
              )}
            </div>
          </div>

          {/* Notes Information */}
          {appointment.notes && (
            <div className="pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Additional Notes
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {/* Temporarily commented out edit appointment button */}
                {/* <Button onClick={() => setIsEditing(true)} className="flex-1">
                  Edit Appointment
                </Button> */}
                {onStatusChange && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                  <Button 
                    variant="outline" 
                    onClick={() => onStatusChange(appointment.id, 'completed')}
                    className="flex-1"
                  >
                    Mark Complete
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
