'use client'

import { useState, useMemo } from 'react'
import { Database } from '@/types/database-comprehensive'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Client = Database['public']['Tables']['clients']['Row']

type AppointmentWithClient = Appointment & {
  clients: Client | null
}

import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Grid3X3,
  CalendarDays
} from 'lucide-react'

// Setup the localizer with date-fns
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Calendar event type for react-big-calendar
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: AppointmentWithClient
}

interface AppointmentsCalendarProps {
  appointments: AppointmentWithClient[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
  showControls?: boolean
  onNavigate?: (newDate: Date) => void
  onViewChange?: (newView: View) => void
}

export function AppointmentsCalendar({ 
  appointments, 
  onSelectEvent, 
  onSelectSlot,
  showControls = true,
  onNavigate,
  onViewChange
}: AppointmentsCalendarProps) {
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())

  // Transform appointments for react-big-calendar
  const events = useMemo(() => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start: new Date(appointment.starts_at),
      end: new Date(appointment.ends_at),
      resource: appointment
    }))
  }, [appointments])

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
    onNavigate?.(newDate)
  }

  const handleViewChange = (newView: View) => {
    setView(newView)
    onViewChange?.(newView)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectEvent?.(event)
  }

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    onSelectSlot?.(slotInfo)
  }

  const getEventStyle = (event: CalendarEvent) => {
    const status = event.resource.status
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      color: 'white',
      padding: '2px 4px',
      fontSize: '12px',
      fontWeight: '500'
    }

    let backgroundColor = '#3b82f6'
    switch (status) {
      case 'scheduled':
        backgroundColor = '#3b82f6'
        break
      case 'confirmed':
        backgroundColor = '#10b981'
        break
      case 'in_progress':
        backgroundColor = '#f59e0b'
        break
      case 'completed':
        backgroundColor = '#6b7280'
        break
      case 'cancelled':
        backgroundColor = '#ef4444'
        break
      case 'no_show':
        backgroundColor = '#dc2626'
        break
      default:
        backgroundColor = '#3b82f6'
    }

    return {
      style: {
        ...baseStyle,
        backgroundColor
      }
    }
  }

  return (
    <div className="w-full">
      {showControls && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate(new Date())}
              className="flex items-center space-x-1"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Today</span>
            </Button>
            
            <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
                onClick={() => handleNavigate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>
              
              <div className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {format(date, 'MMMM yyyy')}
              </div>
              
            <Button
              variant="outline"
              size="sm"
                onClick={() => handleNavigate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant={view === Views.MONTH ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange(Views.MONTH)}
              className="flex items-center space-x-1"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Month</span>
            </Button>
            
            <Button
              variant={view === Views.WEEK ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange(Views.WEEK)}
              className="flex items-center space-x-1"
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Week</span>
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              date={date}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={getEventStyle}
              selectable
              showMultiDayTimes
              step={15}
              timeslots={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-black rounded-lg shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Scheduled</span>
            </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded-lg shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Completed</span>
            </div>
        <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-lg shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Cancelled</span>
        </div>
      </div>
    </div>
  )
}