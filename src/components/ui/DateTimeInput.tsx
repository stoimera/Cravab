"use client"

import * as React from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimeInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

export function DateTimeInput({ 
  label, 
  value, 
  onChange, 
  required = false,
  className = ""
}: DateTimeInputProps) {
  const [showCalendar, setShowCalendar] = React.useState(false)
  
  // Parse the datetime-local value
  const dateValue = value ? new Date(value) : undefined
  const timeValue = value ? value.split('T')[1] || '' : ''
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const currentTime = timeValue || '12:00'
      const newValue = `${format(date, 'yyyy-MM-dd')}T${currentTime}`
      onChange(newValue)
      setShowCalendar(false)
    }
  }
  
  const handleTimeChange = (time: string) => {
    if (dateValue) {
      const newValue = `${format(dateValue, 'yyyy-MM-dd')}T${time}`
      onChange(newValue)
    } else {
      // If no date is selected, use today's date
      const today = new Date()
      const newValue = `${format(today, 'yyyy-MM-dd')}T${time}`
      onChange(newValue)
    }
  }

  // Set default time to current time if no value
  React.useEffect(() => {
    if (!value) {
      const now = new Date()
      const defaultTime = format(now, 'HH:mm')
      const defaultValue = `${format(now, 'yyyy-MM-dd')}T${defaultTime}`
      onChange(defaultValue)
    }
  }, [value, onChange])

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label} {required && '*'}
      </Label>
      <div className="grid grid-cols-1 gap-2">
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal border-gray-300"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, 'MMM dd, yyyy') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border border-gray-200" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
               onSelect={(date) => {
                 if (date instanceof Date) {
                   handleDateSelect(date)
                 }
               }}
              disabled={(date) => date < new Date()}
              initialFocus
              className="border-gray-200"
            />
          </PopoverContent>
        </Popover>
        
        <div className="relative">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="pr-8 border-gray-300"
            required={required}
          />
          <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
