'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useCreateClient, useCreateAppointment, useUpdateCallFollowUp } from '@/hooks/useQueries'
import { CalendarIcon, Clock, Phone, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface CallbackSchedulerProps {
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
    follow_up_notes: string | null
  }
  tenantId: string
  isOpen: boolean
  onClose: () => void
  onScheduled: () => void
}

export function CallbackScheduler({ call, tenantId, isOpen, onClose, onScheduled }: CallbackSchedulerProps) {
  const [loading, setLoading] = useState(false)
  const [callbackDate, setCallbackDate] = useState<Date | undefined>(new Date())
  const [callbackTime, setCallbackTime] = useState('')
  const [callbackReason, setCallbackReason] = useState('')
  const [callbackNotes, setCallbackNotes] = useState('')
  const [priority, setPriority] = useState('normal')
  
  const supabase = createClient()
  
  // React Query hooks
  const createClientMutation = useCreateClient(tenantId)
  const createAppointmentMutation = useCreateAppointment(tenantId)
  const updateCallMutation = useUpdateCallFollowUp(tenantId)

  const handleSchedule = async () => {
    if (!callbackDate || !callbackTime || !callbackReason) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Create callback appointment
      const callbackDateTime = new Date(callbackDate)
      const [hours, minutes] = callbackTime.split(':').map(Number)
      callbackDateTime.setHours(hours, minutes, 0, 0)

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
            status: 'active'
          })
          clientId = newClient.client.id
        }
      }

      // Create callback appointment using React Query hook
      await createAppointmentMutation.mutateAsync({
        title: `Callback: ${callbackReason}`,
        description: `Follow-up call scheduled from previous call. Notes: ${callbackNotes}`,
        starts_at: callbackDateTime.toISOString(),
        ends_at: new Date(callbackDateTime.getTime() + 30 * 60000).toISOString(), // 30 min duration
        duration_minutes: 30,
        status: 'scheduled',
        priority: priority as 'normal' | 'high' | 'emergency',
        client_id: clientId,
        created_by: 'callback_scheduler',
        notes: `Original call: ${call.ai_summary || 'No summary available'}\nFollow-up reason: ${callbackReason}\nNotes: ${callbackNotes}`
      })

      // Update call to mark follow-up as scheduled using React Query hook
      await updateCallMutation.mutateAsync({
        callId: call.id,
        followUpData: {
          follow_up_required: false,
          follow_up_notes: `Callback scheduled for ${format(callbackDateTime, 'PPP p')} - ${callbackReason}`
        }
      })

      toast.success('Callback scheduled successfully!')
      onScheduled()
    } catch (error) {
      logger.error('Error scheduling callback:', error)
      toast.error('Failed to schedule callback')
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Schedule Callback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Caller Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Caller:</span>
              <span>
                {call.clients ? 
                  `${call.clients.first_name} ${call.clients.last_name}` : 
                  'Unknown'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Phone:</span>
              <span className="font-mono">{call.from_number || 'Unknown number'}</span>
            </div>
          </div>

          {/* Call Summary */}
          {call.ai_summary && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Original Call Summary:</span>
              <p className="text-sm text-blue-800 mt-1">{call.ai_summary}</p>
            </div>
          )}

          {/* Follow-up Notes */}
          {call.follow_up_notes && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-orange-900">Follow-up Notes:</span>
              <p className="text-sm text-orange-800 mt-1">{call.follow_up_notes}</p>
            </div>
          )}

          {/* Callback Date */}
          <div className="space-y-2">
            <Label htmlFor="callback-date">Callback Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {callbackDate ? format(callbackDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-gray-200" align="start">
                <Calendar
                  mode="single"
                  selected={callbackDate}
                  onSelect={(date) => {
                    if (date instanceof Date) {
                      setCallbackDate(date)
                    }
                  }}
                   disabled={(date: Date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Callback Time */}
          <div className="space-y-2">
            <Label htmlFor="callback-time">Callback Time *</Label>
            <Select value={callbackTime} onValueChange={setCallbackTime}>
              <SelectTrigger>
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

          {/* Callback Reason */}
          <div className="space-y-2">
            <Label htmlFor="callback-reason">Reason for Callback *</Label>
            <Select value={callbackReason} onValueChange={setCallbackReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow-up">Follow-up on service request</SelectItem>
                <SelectItem value="pricing">Discuss pricing/quote</SelectItem>
                <SelectItem value="scheduling">Reschedule appointment</SelectItem>
                <SelectItem value="questions">Answer questions</SelectItem>
                <SelectItem value="confirmation">Confirm appointment details</SelectItem>
                <SelectItem value="emergency">Emergency follow-up</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
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

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="callback-notes">Additional Notes</Label>
            <Textarea
              id="callback-notes"
              placeholder="Any additional information for the callback..."
              value={callbackNotes}
              onChange={(e) => setCallbackNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSchedule}
              disabled={loading || !callbackDate || !callbackTime || !callbackReason}
              className="flex-1"
            >
              {loading ? 'Scheduling...' : 'Schedule Callback'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
