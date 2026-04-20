"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ 
  selectedDate, 
  onDateSelect, 
  placeholder = "Select date",
  className = ""
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-48 justify-between font-normal !border-gray-200 ${className}`}
        >
          {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0 z-50 bg-white border border-gray-200" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date instanceof Date) {
              onDateSelect(date)
              setOpen(false)
            }
          }}
          captionLayout="dropdown"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
