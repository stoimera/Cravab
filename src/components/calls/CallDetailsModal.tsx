'use client'

import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  MessageSquare,
  X,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CallDetailsModalProps {
  call: any
  isOpen: boolean
  onClose: () => void
  onEdit?: (call: any) => void
  onDelete?: (call: any) => void
  userRole?: string
}

export function CallDetailsModal({
  call,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  userRole
}: CallDetailsModalProps) {
  if (!call) return null

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDuration = () => {
    // Use the correct duration field from the database schema
    const duration = call.duration_seconds
    
    if (duration && duration > 0) {
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    // If no duration available, try to calculate from start/end times
    if (call.started_at && call.ended_at) {
      const startTime = new Date(call.started_at).getTime()
      const endTime = new Date(call.ended_at).getTime()
      const durationMs = endTime - startTime
      
      if (durationMs > 0) {
        const durationSeconds = Math.floor(durationMs / 1000)
        const minutes = Math.floor(durationSeconds / 60)
        const seconds = durationSeconds % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    }
    
    return 'N/A'
  }

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A'
    // Simple phone formatting - you can enhance this
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6" showCloseButton={false}>
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Call Details
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn("text-xs", getStatusColor(call.status))}>
                  {call.status || 'Unknown'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {call.created_at ? formatDate(call.created_at) : 'N/A'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Call Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Call Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Phone Number</p>
                <p className="text-sm text-gray-600">{formatPhoneNumber(call.from_number || call.phone_number)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Duration</p>
                <p className="text-sm text-gray-600">{getDuration()}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">Date & Time</p>
                <p className="text-sm text-gray-600">
                  {call.created_at ? `${formatDate(call.created_at)} at ${formatTime(call.created_at)}` : 'N/A'}
                </p>
              </div>

              {call.client_name && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Client</p>
                  <p className="text-sm text-gray-600">{call.client_name}</p>
                </div>
              )}

              {call.location && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{call.location}</p>
                </div>
              )}
            </div>
          </div>

          {/* Call Transcript & AI Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Transcript & Notes</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Transcript</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {call.transcript || '[No transcript available]'}
              </p>
              {!call.transcript && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ This call may not have been processed by VAPI webhook yet, or transcript extraction failed.
                </p>
              )}
            </div>

            {call.ai_summary ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">AI Summary</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.ai_summary}</p>
              </div>
            ) : (
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">AI Summary</h4>
                <p className="text-sm text-orange-600">
                  [No AI summary available]
                  <br />
                  <span className="text-xs">This call may not have been processed by VAPI webhook yet, or AI summary extraction failed.</span>
                </p>
              </div>
            )}
          </div>

          {/* Follow-up Information */}
          {call.follow_up_required && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Follow-up Required</h3>
              <div className={`rounded-lg p-4 ${
                call.follow_up_urgency === 'emergency' ? 'bg-red-50 border border-red-200' :
                call.follow_up_urgency === 'urgent' ? 'bg-orange-50 border border-orange-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className={`h-4 w-4 ${
                    call.follow_up_urgency === 'emergency' ? 'text-red-600' :
                    call.follow_up_urgency === 'urgent' ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    call.follow_up_urgency === 'emergency' ? 'text-red-900' :
                    call.follow_up_urgency === 'urgent' ? 'text-orange-900' :
                    'text-yellow-900'
                  }`}>
                    {call.follow_up_urgency === 'emergency' ? 'EMERGENCY - Immediate Action Required' :
                     call.follow_up_urgency === 'urgent' ? 'URGENT - Action Required' :
                     'Action Required'}
                  </span>
                </div>
                
                {call.follow_up_reason && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className={`text-sm ${
                      call.follow_up_urgency === 'emergency' ? 'text-red-800' :
                      call.follow_up_urgency === 'urgent' ? 'text-orange-800' :
                      'text-yellow-800'
                    }`}>{call.follow_up_reason}</p>
                  </div>
                )}
                
                {call.follow_up_notes && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Details:</p>
                    <p className={`text-sm ${
                      call.follow_up_urgency === 'emergency' ? 'text-red-800' :
                      call.follow_up_urgency === 'urgent' ? 'text-orange-800' :
                      'text-yellow-800'
                    }`}>{call.follow_up_notes}</p>
                  </div>
                )}
                
                {call.follow_up_callback_timeframe && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Callback Timeframe:</p>
                    <p className={`text-sm font-semibold ${
                      call.follow_up_urgency === 'emergency' ? 'text-red-800' :
                      call.follow_up_urgency === 'urgent' ? 'text-orange-800' :
                      'text-yellow-800'
                    }`}>{call.follow_up_callback_timeframe}</p>
                  </div>
                )}
                
                <div className={`text-xs ${
                  call.follow_up_urgency === 'emergency' ? 'text-red-600' :
                  call.follow_up_urgency === 'urgent' ? 'text-orange-600' :
                  'text-yellow-600'
                }`}>
                  {call.follow_up_urgency === 'emergency' ? 
                    '⚠️ EMERGENCY: Call client back immediately to assess situation and provide emergency service options.' :
                   call.follow_up_urgency === 'urgent' ? 
                    '⚡ URGENT: Call client back soon to provide accurate information and pricing.' :
                    '📞 Call client back to provide additional information or discuss alternatives.'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Completed */}
          {!call.follow_up_required && call.follow_up_completed_at && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Follow-up Completed</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Follow-up Completed</span>
                </div>
                <p className="text-sm text-green-800">
                  Completed on {new Date(call.follow_up_completed_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}


          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Technical Details</h3>
            
            <div className="grid grid-cols-1 gap-4 text-sm">
              {call.call_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Call ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{call.call_id}</span>
                </div>
              )}
              
              {call.vapi_call_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">VAPI Call ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{call.vapi_call_id}</span>
                </div>
              )}

              {call.recording_url && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Recording:</span>
                  <a 
                    href={call.recording_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Listen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          
          {onEdit && (
            <Button
              variant="default"
              onClick={() => onEdit(call)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}

          {onDelete && userRole === 'admin' && (
            <Button
              variant="destructive"
              onClick={() => onDelete(call)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}