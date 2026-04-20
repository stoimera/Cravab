'use client'

// import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Clock, 
  User, 
  DollarSign, 
  MapPin, 
  Phone, 
  Calendar,
  X,
  Plus,
  Eye,
  Trash2
} from 'lucide-react'
import { format, isToday, isSameDay } from 'date-fns'
import { Database } from '@/types/database-comprehensive'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Client = Database['public']['Tables']['clients']['Row']

type AppointmentWithClient = Appointment & {
  clients?: Client | null
  service_name?: string
}

interface DayAppointmentsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  appointments: AppointmentWithClient[]
  onEditAppointment?: (appointment: Appointment) => void
  onDeleteAppointment?: (appointmentId: string) => void
  onAddAppointment?: () => void
}

export function DayAppointmentsModal({
  isOpen,
  onClose,
  selectedDate,
  appointments,
  onEditAppointment,
  onDeleteAppointment,
  onAddAppointment
}: DayAppointmentsModalProps) {
  
  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.starts_at)
    return isSameDay(appointmentDate, selectedDate)
  })

  // Sort appointments by start time
  const sortedAppointments = dayAppointments.sort((a, b) => 
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-gray-500'
      case 'normal':
        return 'border-l-gray-300'
      case 'low':
        return 'border-l-gray-300'
      default:
        return 'border-l-gray-300'
    }
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const getTotalRevenue = () => {
    return sortedAppointments.reduce((total, appointment) => {
      return total + (appointment.notes ? 1 : 0)
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col mx-auto sm:max-w-2xl sm:w-full">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                {isToday(selectedDate) && (
                  <Badge className="ml-2 bg-gray-100 text-gray-800">Today</Badge>
                )}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        {sortedAppointments.length > 0 && (
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <Card className="border border-gray-200">
              <CardContent className="p-1.5">
                <div>
                  <p className="text-xs font-medium text-gray-700">Total Appointments</p>
                  <p className="text-sm font-bold text-gray-900">{sortedAppointments.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-1.5">
                <div>
                  <p className="text-xs font-medium text-gray-700">Total Duration</p>
                  <p className="text-sm font-bold text-gray-900">
                    {sortedAppointments.reduce((total, apt) => {
                      const start = new Date(apt.starts_at)
                      const end = new Date(apt.ends_at)
                      return total + (end.getTime() - start.getTime())
                    }, 0) / (1000 * 60 * 60) < 1 
                      ? `${Math.round(sortedAppointments.reduce((total, apt) => {
                          const start = new Date(apt.starts_at)
                          const end = new Date(apt.ends_at)
                          return total + (end.getTime() - start.getTime())
                        }, 0) / (1000 * 60))}m`
                      : `${Math.round(sortedAppointments.reduce((total, apt) => {
                          const start = new Date(apt.starts_at)
                          const end = new Date(apt.ends_at)
                          return total + (end.getTime() - start.getTime())
                        }, 0) / (1000 * 60 * 60))}h`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments List */}
        <div className="flex-1 overflow-y-auto">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
              <p className="text-gray-600">
                This day is free.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedAppointments.map((appointment) => (
                <Card 
                  key={appointment.id} 
                  className={`border-l-4 ${getPriorityColor(appointment.priority || 'normal')} hover:shadow-sm transition-shadow`}
                >
                  <CardContent className="p-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {appointment.title}
                          </h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                          {appointment.priority && appointment.priority !== 'normal' && (
                            <Badge variant="outline" className="text-xs">
                              {appointment.priority}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTime(appointment.starts_at)} - {formatTime(appointment.ends_at)}
                                <span className="ml-1 text-gray-500">
                                  ({formatDuration(appointment.starts_at, appointment.ends_at)})
                                </span>
                              </span>
                            </div>
                            
                            {appointment.clients && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <User className="h-3 w-3" />
                                <span>
                                  {appointment.clients.first_name} {appointment.clients.last_name}
                                </span>
                              </div>
                            )}

                            {(appointment.address || appointment.clients?.address) && (
                              <div className="text-xs text-gray-500 ml-4">
                                <span className="truncate">{appointment.address || appointment.clients?.address}</span>
                              </div>
                            )}

                            {appointment.clients?.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{appointment.clients.phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            {appointment.service_name && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Service:</span>
                                <span className="ml-1 text-gray-600">{appointment.service_name}</span>
                              </div>
                            )}

                            {appointment.notes && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <DollarSign className="h-3 w-3 text-gray-600" />
                                <span className="font-medium text-gray-700">Estimated Cost:</span>
                                <span className="text-gray-600 font-semibold">
                                  ${appointment.notes}
                                </span>
                              </div>
                            )}

                            {appointment.notes && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Notes:</span>
                                <p className="text-gray-600 mt-0.5">{appointment.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-0.5 ml-1">
                        {onEditAppointment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditAppointment(appointment)}
                            className="h-5 w-5 p-0 hover:bg-gray-100"
                          >
                            <Eye className="h-2.5 w-2.5" />
                          </Button>
                        )}
                        {onDeleteAppointment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteAppointment(appointment.id)}
                            className="h-5 w-5 p-0 hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
