"use client"

import * as React from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Grid3X3, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyCalendarView } from "./MonthlyCalendarView"
import { AddAppointmentModal } from "./AddAppointmentModal"

// Types
interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  date: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  clientName?: string
  serviceName?: string
}

interface EnhancedCalendarProps {
  appointments?: Appointment[]
  onAppointmentCreate?: (appointment: Omit<Appointment, 'id'>) => void
  onAppointmentUpdate?: (id: string, appointment: Partial<Appointment>) => void
  onAppointmentDelete?: (id: string) => void
  onAppointmentClick?: (appointment: Appointment) => void
  selectedDate?: Date
  onDateChange?: (date: Date) => void
  tenantId?: string
}

type ViewMode = 'month' | 'week' | 'day'

const EnhancedCalendar = React.memo(function EnhancedCalendar({ 
  appointments = [], 
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
  onAppointmentClick,
  selectedDate: externalSelectedDate,
  onDateChange,
  tenantId
}: EnhancedCalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = React.useState<Date>(new Date())
  const selectedDate = externalSelectedDate || internalSelectedDate
  const setSelectedDate = onDateChange || setInternalSelectedDate
  const [viewMode, setViewMode] = React.useState<ViewMode>('day')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<{startTime: string, endTime: string} | null>(null)
  
  // Form state for creating/editing appointments
  const [formData, setFormData] = React.useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    date: selectedDate.toISOString().split('T')[0],
    status: 'scheduled' as Appointment['status'],
    clientName: '',
    serviceName: ''
  })

  // Get appointments for selected date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.date), date)
    )
  }

  // Get appointments for week
  const getAppointmentsForWeek = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 })
    const end = endOfWeek(date, { weekStartsOn: 0 })
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate >= start && aptDate <= end
    })
  }

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setSelectedDate(newDate)
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setSelectedDate(newDate)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingAppointment) {
      onAppointmentUpdate?.(editingAppointment.id, formData)
      setEditingAppointment(null)
    } else {
      onAppointmentCreate?.(formData)
    }
    
    setIsCreateDialogOpen(false)
    setFormData({
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      date: selectedDate.toISOString().split('T')[0],
      status: 'scheduled',
      clientName: '',
      serviceName: ''
    })
  }

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    if (onAppointmentClick) {
      // Use external appointment click handler (opens detail modal)
      onAppointmentClick(appointment)
    } else {
      // Fallback to internal edit dialog
      setEditingAppointment(appointment)
      setFormData({
        title: appointment.title,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        date: appointment.date,
        status: appointment.status,
        clientName: appointment.clientName || '',
        serviceName: appointment.serviceName || ''
      })
      setIsCreateDialogOpen(true)
    }
  }

  // Get status color
  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500'
      case 'confirmed': return 'bg-gray-500'
      case 'completed': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'no_show': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  // Generate time slots from 5 AM to 11 PM
  const timeSlots = (() => {
    const slots = []
    // First part: 5 AM to 11 PM (5-23)
    for (let hour = 5; hour <= 23; hour++) {
      slots.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        displayTime: hour <= 12 ? `${hour === 12 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}` : `${hour - 12}:00 PM`
      })
    }
    // Second part: 12 AM to 4 AM (0-4) - next day
    for (let hour = 0; hour <= 4; hour++) {
      slots.push({
        hour: hour + 24, // Use hour + 24 to maintain unique hour values
        time: `${hour.toString().padStart(2, '0')}:00`,
        displayTime: hour === 0 ? '12:00 AM' : `${hour}:00 AM`
      })
    }
    return slots
  })()

  // Get appointment for specific time slot
  const getAppointmentForTimeSlot = (date: Date, timeSlot: { hour: number }) => {
    return appointments.find(apt => {
      const aptDate = new Date(apt.date)
      const aptHour = new Date(`${apt.date}T${apt.startTime}`).getHours()
      return isSameDay(aptDate, date) && aptHour === timeSlot.hour
    })
  }

  // Week view component
  const WeekView = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 })
    const allWeekDays = eachDayOfInterval({ start, end })
    // Filter out Sunday (index 0) to only show Monday-Saturday
    const weekDays = allWeekDays.filter((_, index) => index !== 0)

    return (
      <div className="space-y-6">
        {/* Week Header */}
        <div className="flex items-center justify-center px-2 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 w-full max-w-4xl">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')} className="hover:bg-primary/10 !border-gray-200 h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 px-2 sm:px-4 truncate flex-1 text-center">
              {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')} className="hover:bg-primary/10 !border-gray-200 h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week Grid with Time Slots */}
        <div className="flex justify-center px-2 sm:px-0">
          <div className="w-full max-w-7xl border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
            {/* Header Row */}
            <div className="flex bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              {/* Time Column Header */}
              <div className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 bg-gray-100/50 w-12 sm:w-16 flex-shrink-0 text-center">Time</div>
              {/* Day Headers */}
              <div className="flex flex-1">
                {weekDays.map((day, index) => (
                  <div key={day.toISOString()} className={`flex-1 p-1 sm:p-2 text-center ${index < weekDays.length - 1 ? 'border-r border-gray-200' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''}`}>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-xs sm:text-sm font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots - Mobile Optimized */}
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.hour} className="flex border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  {/* Time Column */}
                  <div className="p-1 sm:p-2 text-xs sm:text-sm text-gray-600 border-r border-gray-200 bg-gray-50/50 font-medium min-w-0 text-center w-12 sm:w-16 flex-shrink-0">
                    <div className="hidden sm:block">{timeSlot.displayTime}</div>
                    <div className="sm:hidden">{timeSlot.time}</div>
                  </div>
                  
                  {/* Day Columns */}
                  <div className="flex flex-1">
                    {weekDays.map((day, index) => {
                      const appointment = getAppointmentForTimeSlot(day, timeSlot)
                      const isSelected = isSameDay(day, selectedDate)
                      
                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot.hour}`}
                          className={`flex-1 p-1 sm:p-2 cursor-pointer hover:bg-primary/5 transition-all duration-200 min-h-[40px] sm:min-h-[50px] bg-white ${index < weekDays.length - 1 ? 'border-r border-gray-200' : ''} ${
                            isSelected ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => {
                            setSelectedDate(day)
                            if (!appointment) {
                              // Create new appointment for this time slot
                              setFormData(prev => ({
                                ...prev,
                                date: day.toISOString().split('T')[0],
                                startTime: timeSlot.time,
                                endTime: `${(timeSlot.hour + 1).toString().padStart(2, '0')}:00`
                              }))
                              setIsCreateDialogOpen(true)
                            }
                          }}
                        >
                          {appointment && (
                            <div
                              className={`text-xs p-1 rounded-lg text-white shadow-sm hover:shadow-md transition-all duration-200 ${getStatusColor(appointment.status)} cursor-pointer overflow-hidden`}
                              onClick={(e) => {
                                e?.stopPropagation()
                                handleEditAppointment(appointment)
                              }}
                            >
                              <div className="hidden sm:block font-medium truncate">{appointment.title}</div>
                              <div className="sm:hidden font-medium truncate">{appointment.title.slice(0, 1)}</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Day view component
  const DayView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate)
    // const isToday = isSameDay(selectedDate, new Date())

    return (
      <div className="space-y-6">
        {/* Day Header */}
        <div className="flex items-center justify-center px-2 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 w-full max-w-4xl">
            <Button variant="outline" size="sm" onClick={() => navigateDay('prev')} className="hover:bg-primary/10 !border-gray-200 h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm sm:text-xl font-bold text-gray-900 text-center truncate flex-1 px-2">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateDay('next')} className="hover:bg-primary/10 !border-gray-200 h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day Time Slots */}
        <div className="flex justify-center px-2 sm:px-0">
          <div className="w-full max-w-4xl border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
            {/* Header */}
            <div className="grid grid-cols-2 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200" style={{ gridTemplateColumns: '80px 1fr' }}>
              <div className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 bg-gray-100/50">Time</div>
              <div className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-700">Appointments</div>
            </div>

            {/* Time Slots */}
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {timeSlots.map((timeSlot) => {
                const appointment = getAppointmentForTimeSlot(selectedDate, timeSlot)
                
                return (
                  <div key={timeSlot.hour} className="grid grid-cols-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors" style={{ gridTemplateColumns: '80px 1fr' }}>
                    {/* Time Column */}
                    <div className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 border-r border-gray-200 bg-gray-50/50 font-medium text-left whitespace-nowrap">
                      {timeSlot.displayTime}
                    </div>
                    
                    {/* Appointment Column */}
                    <div
                      className="p-2 sm:p-4 cursor-pointer hover:bg-primary/5 transition-all duration-200 min-h-[50px] sm:min-h-[70px] flex-1"
                      onClick={() => {
                        if (!appointment) {
                          // Set the selected time slot and open the AddAppointmentModal
                          setSelectedTimeSlot({
                            startTime: timeSlot.time,
                            endTime: `${(timeSlot.hour + 1).toString().padStart(2, '0')}:00`
                          })
                          setIsAddModalOpen(true)
                        }
                      }}
                    >
                      {appointment ? (
                        <Card 
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md"
                          onClick={(e) => {
                            e?.stopPropagation()
                            handleEditAppointment(appointment)
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base text-gray-900">{appointment.title}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">
                                    {appointment.startTime} - {appointment.endTime}
                                  </span>
                                </div>
                                {appointment.clientName && (
                                  <p className="text-sm text-gray-500 mt-2">
                                    {appointment.clientName}
                                  </p>
                                )}
                              </div>
                              <Badge className={`text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-sm text-gray-400 italic flex items-left justify-left h-full">
                          Click to add appointment
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 p-4 flex flex-col">
      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-fit grid-cols-3 bg-muted/30 p-1 rounded-lg shadow-sm h-12">
            <TabsTrigger 
              value="day" 
              className="flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50 h-10"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Day</span>
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              className="flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50 h-10"
            >
              <Grid3X3 className="h-4 w-4" />
              <span>Week</span>
            </TabsTrigger>
            <TabsTrigger 
              value="month" 
              className="flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50 h-10"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Month</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Day View */}
        <TabsContent value="day">
          {DayView()}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          {WeekView()}
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month" className="w-full">
          <div className="w-full mb-8">
            <MonthlyCalendarView
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onAddAppointment={() => {
                // Open the AddAppointmentModal when clicking the add button
                setIsAddModalOpen(true)
              }}
              onEditAppointment={onAppointmentClick ? (appointment) => {
                // Convert AppointmentWithClient to Appointment format
                const convertedAppointment: Appointment = {
                  id: appointment.id,
                  title: appointment.title || 'Untitled Appointment',
                  startTime: appointment.starts_at ? new Date(appointment.starts_at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }) : '09:00',
                  endTime: appointment.ends_at ? new Date(appointment.ends_at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }) : '10:00',
                  date: appointment.starts_at ? new Date(appointment.starts_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  status: appointment.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
                  clientName: appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : undefined,
                  serviceName: appointment.service_name
                }
                onAppointmentClick(convertedAppointment)
              } : undefined}
              appointments={appointments.map(apt => ({
                id: apt.id,
                tenant_id: tenantId || '',
                client_id: '',
                service_id: null,
                title: apt.title,
                description: null,
                starts_at: new Date(`${apt.date}T${apt.startTime}`).toISOString(),
                ends_at: new Date(`${apt.date}T${apt.endTime}`).toISOString(),
                duration_minutes: 60,
                status: apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress' | 'no_show',
                notes: null,
                priority: 'normal' as const,
                address: null,
                city: null,
                state: null,
                zip_code: null,
                coordinates: null,
                eta_minutes: null,
                created_by: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                clients: apt.clientName ? {
                  id: '',
                  tenant_id: tenantId || '',
                  first_name: apt.clientName.split(' ')[0] || '',
                  last_name: apt.clientName.split(' ').slice(1).join(' ') || '',
                  phone: '',
                  email: null,
                  address: null,
                  city: null,
                  state: null,
                  zip_code: null,
                  country: null,
                  status: 'active' as const,
                  preferred_contact_method: null,
                  preferred_appointment_time: null,
                  notes: null,
                  tags: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } : null,
                services: apt.serviceName ? {
                  id: '',
                  tenant_id: tenantId || '',
                  name: apt.serviceName,
                  description: null,
                  price: null,
                  duration_minutes: 60,
                  category: null,
                  base_price: null,
                  hourly_rate: null,
                  minimum_charge: null,
                  emergency_surcharge: null,
                  estimated_duration_minutes: null,
                  is_emergency_service: null,
                  requires_equipment: null,
                  equipment_list: null,
                  required_permits: null,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } : null,
                users: {
                  id: '',
                  tenant_id: tenantId || '',
                  email: '',
                  role: 'worker' as const,
                  first_name: null,
                  last_name: null,
                  phone: null,
                  title: null,
                  permissions: {},
                  is_active: true,
                  status: 'active' as const,
                  last_login: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }))}
              className="w-full"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* AddAppointmentModal */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedTimeSlot(null)
        }}
        onAppointmentAdded={() => {
          // The parent component will handle the refresh via refetchAppointments()
          // The cache invalidation in useCreateAppointment will automatically update the UI
          setIsAddModalOpen(false)
          setSelectedTimeSlot(null)
        }}
        tenantId={tenantId || ''}
        selectedDate={selectedTimeSlot ? new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTimeSlot.startTime}`) : selectedDate}
      />
    </div>
  )
})

export default EnhancedCalendar
