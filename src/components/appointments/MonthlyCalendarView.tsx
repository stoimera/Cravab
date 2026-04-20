'use client'

import React, { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database-comprehensive'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Client = Database['public']['Tables']['clients']['Row']
import { DayAppointmentsModal } from './DayAppointmentsModal'

type AppointmentWithClient = Appointment & {
  clients?: Client | null
  service_name?: string
}

interface MonthlyCalendarViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onAddAppointment: () => void
  onEditAppointment?: (appointment: AppointmentWithClient) => void
  appointments: AppointmentWithClient[]
  className?: string
}

export function MonthlyCalendarView({
  selectedDate,
  onDateSelect,
  onAddAppointment,
  onEditAppointment,
  appointments,
  className = ''
}: MonthlyCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)
  const [isDayModalOpen, setIsDayModalOpen] = useState(false)
  const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null)

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.starts_at), date)
    )
  }

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  // Handle day click - open modal with appointments for that day
  const handleDayClick = (date: Date) => {
    setSelectedDayForModal(date)
    setIsDayModalOpen(true)
    // Also call the original onDateSelect for any other functionality
    onDateSelect(date)
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsDayModalOpen(false)
    setSelectedDayForModal(null)
  }

  // Get status color for appointment count badge
  const getStatusColor = (appointments: AppointmentWithClient[]) => {
    if (appointments.length === 0) return 'bg-gray-100 text-gray-600'
    
    const hasEmergency = appointments.some(apt => apt.priority === 'emergency')
    const hasHigh = appointments.some(apt => apt.priority === 'high')
    const hasInProgress = appointments.some(apt => apt.status === 'in_progress')
    
    if (hasEmergency) return 'bg-red-500 text-white'
    if (hasHigh) return 'bg-orange-500 text-white'
    if (hasInProgress) return 'bg-black text-white'
    return 'bg-green-500 text-white'
  }

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
    <Card className={`shadow-lg border-0 bg-white overflow-hidden w-full ${className}`}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-200"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <CardContent className="p-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50/50 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)
            const isSelected = isSameDay(day, selectedDate)
            const appointmentCount = dayAppointments.length

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`
                  relative p-3 h-24 border-r border-b border-gray-200 last:border-r-0 transition-all duration-200
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-inset
                  ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/30' : 'text-gray-900'}
                  ${isTodayDate ? 'bg-gray-50 text-black font-semibold' : ''}
                  ${isSelected ? 'bg-gray-100 text-black font-semibold ring-2 ring-gray-300 ring-inset' : ''}
                  ${isCurrentMonth ? 'hover:bg-gray-50' : 'hover:bg-gray-100/50'}
                `}
              >
                {/* Date number */}
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>

                {/* Appointment count badge */}
                {appointmentCount > 0 && (
                  <div className="absolute top-1 right-1">
                    <Badge 
                      className={`text-xs px-1.5 py-0.5 h-5 min-w-[20px] flex items-center justify-center font-medium ${getStatusColor(dayAppointments)}`}
                    >
                      {appointmentCount}
                    </Badge>
                  </div>
                )}

                {/* Appointment indicators for days with many appointments */}
                {appointmentCount > 0 && appointmentCount <= 3 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayAppointments.slice(0, 3).map((appointment, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          appointment.priority === 'emergency' ? 'bg-red-500' :
                          appointment.priority === 'high' ? 'bg-orange-500' :
                          appointment.status === 'in_progress' ? 'bg-black' :
                          'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* More appointments indicator */}
                {appointmentCount > 3 && (
                  <div className="flex items-center justify-center mt-1">
                    <div className="text-xs text-gray-500 font-medium">
                      +{appointmentCount - 3} more
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>

      {/* Footer with selected date and add button */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="text-lg font-semibold text-gray-900">
          {format(selectedDate, 'MMMM d, yyyy')}
        </div>
        <Button
          onClick={onAddAppointment}
          className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add Appointment
        </Button>
      </div>
    </Card>

    {/* Day Appointments Modal */}
    {selectedDayForModal && (
      <DayAppointmentsModal
        isOpen={isDayModalOpen}
        onClose={handleModalClose}
        selectedDate={selectedDayForModal}
        appointments={appointments}
        onAddAppointment={onAddAppointment}
        onEditAppointment={onEditAppointment}
      />
    )}
  </>
  )
}
