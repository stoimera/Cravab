'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, DollarSign, Phone, MapPin, Plus, ChevronRight, User } from 'lucide-react'
import { format, addDays, isToday, isTomorrow, startOfDay, endOfDay } from 'date-fns'
import { 
  getDateInTenantTimezone, 
  getTimeInTenantTimezone12Hour 
} from '@/lib/timezone-utils'
import { useTenantTimezone } from '@/hooks/useTenantTimezone'
import { useAppointments, useUpdateAppointmentStatus } from '@/hooks/useQueries'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal'
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal'

interface AppointmentWithClient {
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
  coordinates: any
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

interface AppointmentsListViewProps {
  tenantId: string
}

export function AppointmentsListView({ tenantId }: AppointmentsListViewProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithClient | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const { timezone: tenantTimezone } = useTenantTimezone(tenantId)
  const supabase = createClient()

  // Use React Query hook for data fetching like the appointments page
  const { 
    data: appointments = [], 
    isLoading: loading, 
    error: appointmentsError,
    refetch: refetchAppointments
  } = useAppointments(tenantId)

  // Hook for updating appointment status
  const updateAppointmentStatus = useUpdateAppointmentStatus(tenantId)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Filter appointments based on selected period
  const getFilteredAppointments = () => {
    if (!appointments || !Array.isArray(appointments)) return []
    
    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = startOfDay(addDays(now, 1))
    const weekEnd = endOfDay(addDays(now, 7))
    const monthEnd = endOfDay(addDays(now, 30))

    return appointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.starts_at)
      
      switch (selectedPeriod) {
        case 'today':
          return appointmentDate >= today && appointmentDate < tomorrow
        case 'week':
          return appointmentDate >= today && appointmentDate <= weekEnd
        case 'month':
          return appointmentDate >= today && appointmentDate <= monthEnd
        default:
          return true
      }
    })
  }

  const getTodaysAppointments = () => {
    if (!appointments || !Array.isArray(appointments)) return []
    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = startOfDay(addDays(now, 1))
    
    return appointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.starts_at)
      return appointmentDate >= today && appointmentDate < tomorrow
    })
  }

  const getTomorrowsAppointments = () => {
    if (!appointments || !Array.isArray(appointments)) return []
    const now = new Date()
    const tomorrow = startOfDay(addDays(now, 1))
    const dayAfterTomorrow = startOfDay(addDays(now, 2))
    
    return appointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.starts_at)
      return appointmentDate >= tomorrow && appointmentDate < dayAfterTomorrow
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'confirmed': return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'completed': return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-300'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'no_show': return 'bg-orange-100 text-orange-800 border border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  const formatTime = (time: string) => {
    return getTimeInTenantTimezone12Hour(time, tenantTimezone)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getCurrentDateLabel = () => {
    const now = new Date()
    return format(now, 'EEEE, MMMM d')
  }

  const handleAppointmentClick = (appointment: AppointmentWithClient) => {
    setSelectedAppointment(appointment)
    setIsDetailModalOpen(true)
  }


  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded w-32 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
        
        {/* Period selector skeleton */}
        <div className="flex justify-center">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <div className="h-8 w-16 bg-white rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded mx-1"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Appointments skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const filteredAppointments = getFilteredAppointments()
  const todaysAppointments = getTodaysAppointments()
  const tomorrowsAppointments = getTomorrowsAppointments()

  return (
    <div className="space-y-6">
      {/* Header with current date */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Today</h1>
        <p className="text-gray-600">{getCurrentDateLabel()}</p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Appointments based on selected period */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedPeriod === 'today' && "Today's Appointments"}
            {selectedPeriod === 'week' && "This Week's Appointments"}
            {selectedPeriod === 'month' && "This Month's Appointments"}
          </h2>
          <Button 
            size="sm" 
            className="bg-white hover:bg-gray-50 text-black border border-gray-300 whitespace-nowrap"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New Appointment</span>
            <span className="xs:hidden">New</span>
          </Button>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {selectedPeriod === 'today' && "No appointments scheduled for today"}
              {selectedPeriod === 'week' && "No appointments scheduled this week"}
              {selectedPeriod === 'month' && "No appointments scheduled this month"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment: any) => (
              <div
                key={appointment.id}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleAppointmentClick(appointment as AppointmentWithClient)}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                    {appointment.title || appointment.services?.name || 'Appointment'}
                  </h3>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{formatTime(appointment.starts_at)}</span>
                    </div>
                    {appointment.clients && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{appointment.clients.first_name} {appointment.clients.last_name}</span>
                      </div>
                    )}
                    {appointment.address && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{appointment.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </Badge>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State for No Appointments */}
      {appointments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
          <p className="text-gray-600 mb-4">Your appointments will appear here when scheduled</p>
          <Button 
            className="bg-white hover:bg-gray-50 text-black border border-gray-300"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>
      )}

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAppointmentAdded={refetchAppointments}
        tenantId={tenantId}
        selectedDate={new Date()}
      />

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedAppointment(null)
          }}
          onEdit={(appointment) => {
            // TODO: Implement edit functionality
            // Edit appointment functionality
          }}
          onStatusChange={async (appointmentId, newStatus) => {
            try {
              await updateAppointmentStatus.mutateAsync({
                appointmentId,
                newStatus
              })
              
              toast.success(`Appointment marked as ${newStatus}`)
              refetchAppointments()
            } catch (error) {
              logger.error('Error updating appointment status:', error)
              toast.error('Failed to update appointment status')
            }
          }}
        />
      )}
    </div>
  )
}
