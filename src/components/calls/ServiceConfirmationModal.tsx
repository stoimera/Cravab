'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useCreateClient, useCreateAppointment, useUpdateCallFollowUp } from '@/hooks/useQueries'
import { CheckSquare, Phone, MessageSquare, Calendar, DollarSign } from 'lucide-react'

interface ServiceConfirmationModalProps {
  call: {
    id: string
    from_number: string | null
    clients?: {
      first_name: string
      last_name: string
      phone: string
      email: string | null
    } | null
    ai_summary: string | null
  }
  tenantId: string
  isOpen: boolean
  onClose: () => void
  onConfirmed: () => void
}

export function ServiceConfirmationModal({ call, tenantId, isOpen, onClose, onConfirmed }: ServiceConfirmationModalProps) {
  const [loading, setLoading] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [requiresQuote, setRequiresQuote] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)
  
  const supabase = createClient()
  
  // React Query hooks
  const createClientMutation = useCreateClient(tenantId)
  const createAppointmentMutation = useCreateAppointment(tenantId)
  const updateCallMutation = useUpdateCallFollowUp(tenantId)

  const handleConfirmService = async () => {
    if (!serviceType || !serviceDescription) {
      toast.error('Please fill in service type and description')
      return
    }

    setLoading(true)
    try {
      // Get or create client
      let clientId = null
      if (call.clients) {
        // First try to find existing client by phone
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', call.from_number || '')
          .eq('tenant_id', tenantId)
          .single()

        if (existingClient) {
          clientId = existingClient.id
        } else {
          // Create new client using React Query hook
          const newClient = await createClientMutation.mutateAsync({
            first_name: call.clients.first_name,
            last_name: call.clients.last_name,
            phone: call.from_number || '',
            email: call.clients.email || null,
            address: customerAddress || null,
            status: 'active'
          })
          clientId = newClient.client.id
        }
      }

      // Create service request/appointment using React Query hook
      const appointmentData = {
        title: `${serviceType} - ${call.clients ? `${call.clients.first_name} ${call.clients.last_name}` : 'Service Request'}`,
        description: `Service Request from call:\n${serviceDescription}\n\nSpecial Instructions: ${specialInstructions}`,
        client_id: clientId || 'default-client',
        status: requiresQuote ? 'scheduled' as const : 'confirmed' as const,
        priority: isEmergency ? 'emergency' as const : 'normal' as const,
        address: customerAddress || null,
        notes: `Original call summary: ${call.ai_summary || 'No summary available'}\nService Type: ${serviceType}\nEstimated Duration: ${estimatedDuration}\nEstimated Cost: ${estimatedCost}\nRequires Quote: ${requiresQuote ? 'Yes' : 'No'}`,
        created_by: 'service_confirmation',
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        duration_minutes: 60
      }

      // If preferred date/time is provided, set appointment time
      if (preferredDate && preferredTime) {
        const appointmentDateTime = new Date(`${preferredDate}T${preferredTime}`)
        const duration = estimatedDuration ? parseInt(estimatedDuration) : 60
        
        appointmentData.starts_at = appointmentDateTime.toISOString()
        appointmentData.ends_at = new Date(appointmentDateTime.getTime() + duration * 60000).toISOString()
        appointmentData.duration_minutes = duration
      }

      // Create appointment using React Query hook
      await createAppointmentMutation.mutateAsync(appointmentData)

      // Update call to mark as service confirmed using React Query hook
      await updateCallMutation.mutateAsync({
        callId: call.id,
        followUpData: {
          follow_up_required: false,
          follow_up_notes: `Service confirmed: ${serviceType} - ${requiresQuote ? 'Quote required' : 'Ready to schedule'}`
        }
      })

      toast.success('Service request confirmed successfully!')
      onConfirmed()
    } catch (error) {
      logger.error('Error confirming service:', error)
      toast.error('Failed to confirm service request')
    } finally {
      setLoading(false)
    }
  }

  const serviceTypes = [
    'Repair',
    'Installation',
    'HVAC Repair',
    'HVAC Installation',
    'Electrical Repair',
    'Electrical Installation',
    'General Maintenance',
    'Emergency Service',
    'Inspection',
    'Other'
  ]

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Confirm Service Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Caller Info */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Customer:</span>
              </div>
              <span className="text-sm sm:text-base">
                {call.clients ? 
                  `${call.clients.first_name} ${call.clients.last_name}` : 
                  'Unknown'
                }
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
              </div>
              <span className="font-mono text-sm sm:text-base">{call.from_number || 'Unknown number'}</span>
            </div>
          </div>

          {/* Call Summary */}
          {call.ai_summary && (
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Call Summary:</span>
              <p className="text-sm text-blue-800 mt-1 break-words">{call.ai_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type *</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
              />
            </div>

            {/* Estimated Cost */}
            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                placeholder="150"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>

            {/* Customer Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Customer Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Service Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Service Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the service needed in detail..."
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Any special requirements or instructions..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preferred Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-date">Preferred Date</Label>
              <Input
                id="preferred-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred-time">Preferred Time</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires-quote"
                checked={requiresQuote}
                onCheckedChange={(checked) => setRequiresQuote(checked as boolean)}
              />
              <Label htmlFor="requires-quote" className="text-sm">
                This service requires a quote before scheduling
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-emergency"
                checked={isEmergency}
                onCheckedChange={(checked) => setIsEmergency(checked as boolean)}
              />
              <Label htmlFor="is-emergency" className="text-sm">
                This is an emergency service request
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleConfirmService}
              disabled={loading || !serviceType || !serviceDescription}
              className="w-full sm:flex-1"
            >
              {loading ? 'Confirming...' : 'Confirm Service Request'}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
