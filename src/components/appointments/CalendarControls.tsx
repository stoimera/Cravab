'use client'

import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight,
  CalendarIcon,
  Grid3X3,
  CalendarDays
} from 'lucide-react'
import { View, Views } from 'react-big-calendar'

interface CalendarControlsProps {
  view: View
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onViewChange: (view: View) => void
}

export function CalendarControls({ view, onNavigate, onViewChange }: CalendarControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('prev')}
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="px-3"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('next')}
          className="p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant={view === Views.DAY ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(Views.DAY)}
          className="px-3 py-1 h-8"
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          Day
        </Button>
        <Button
          variant={view === Views.WEEK ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(Views.WEEK)}
          className="px-3 py-1 h-8"
        >
          <Grid3X3 className="h-4 w-4 mr-1" />
          Week
        </Button>
        <Button
          variant={view === Views.MONTH ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(Views.MONTH)}
          className="px-3 py-1 h-8"
        >
          <CalendarDays className="h-4 w-4 mr-1" />
          Month
        </Button>
      </div>
    </div>
  )
}
