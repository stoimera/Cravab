'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface FilterState {
  dateRange: { from: Date | undefined; to: Date | undefined }
  disposition: string
  line: string
  intent: string
  csat: string
}

interface CallsFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
}

export function CallsFilters({ onFiltersChange, initialFilters }: CallsFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    disposition: 'all',
    line: 'all',
    intent: 'all',
    csat: 'all',
    ...initialFilters
  })

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      disposition: 'all',
      line: 'all',
      intent: 'all',
      csat: 'all'
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'dateRange') {
      return Object.values(value).some(v => v)
    }
    return value && value !== 'all'
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground font-inter">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {isOpen ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-card rounded-xl border border-border">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-inter">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-gray-200" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from}
                  selected={filters.dateRange}
                   onSelect={(range) => {
                     if (range && typeof range === 'object' && ('from' in range || 'to' in range)) {
                       updateFilter('dateRange', range as { from: Date | undefined; to: Date | undefined })
                     } else {
                       updateFilter('dateRange', { from: undefined, to: undefined })
                     }
                   }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Disposition */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-inter">Disposition</label>
            <Select value={filters.disposition} onValueChange={(value) => updateFilter('disposition', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All dispositions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dispositions</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-inter">Line</label>
            <Select value={filters.line} onValueChange={(value) => updateFilter('line', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All lines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All lines</SelectItem>
                <SelectItem value="treated">Treated</SelectItem>
                <SelectItem value="holdout">Holdout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Intent */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-inter">Intent</label>
            <Select value={filters.intent} onValueChange={(value) => updateFilter('intent', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All intents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All intents</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inquiry">Inquiry</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CSAT */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground font-inter">CSAT</label>
            <Select value={filters.csat} onValueChange={(value) => updateFilter('csat', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="2">2+ stars</SelectItem>
                <SelectItem value="1">1+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
