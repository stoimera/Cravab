'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'
import { BusinessHours, DEFAULT_BUSINESS_HOURS, DAYS_OF_WEEK, DayKey } from '@/types/business-hours'

interface BusinessHoursSettingsProps {
  businessHours: BusinessHours | null
  onSave: (businessHours: BusinessHours) => void
  saving?: boolean
}

export function BusinessHoursSettings({ businessHours, onSave, saving = false }: BusinessHoursSettingsProps) {
  const [hours, setHours] = useState<BusinessHours>(businessHours || DEFAULT_BUSINESS_HOURS)
  const [isEditing, setIsEditing] = useState(false)
  const [originalHours, setOriginalHours] = useState<BusinessHours>(businessHours || DEFAULT_BUSINESS_HOURS)

  const handleDayToggle = (day: DayKey, closed: boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed
      }
    }))
  }

  const handleTimeChange = (day: DayKey, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    // Validate hours
    for (const day of DAYS_OF_WEEK) {
      const dayHours = hours[day.key]
      if (!dayHours.closed) {
        if (!dayHours.open || !dayHours.close) {
          toast.error(`Please set both open and close times for ${day.label}`)
          return
        }
        if (dayHours.open >= dayHours.close) {
          toast.error(`${day.label} close time must be after open time`)
          return
        }
      }
    }

    onSave(hours)
    setIsEditing(false)
    setOriginalHours(hours)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setHours(originalHours)
    setIsEditing(false)
  }

  const resetToDefault = () => {
    setHours(DEFAULT_BUSINESS_HOURS)
  }

  return (
    <Card className="card-transition">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Business Hours
        </CardTitle>
        <CardDescription className="text-sm">
          Set your operating hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayHours = hours[day.key]
          return (
            <div key={day.key} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
              {/* Header with day name and toggle */}
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-900">{day.label}</Label>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!dayHours.closed}
                      onCheckedChange={(checked) => handleDayToggle(day.key, !checked)}
                    />
                    <Label className="text-xs font-medium text-gray-600">
                      {dayHours.closed ? 'Closed' : 'Open'}
                    </Label>
                  </div>
                )}
                {!isEditing && (
                  <Label className="text-xs font-medium text-gray-600">
                    {dayHours.closed ? 'Closed' : 'Open'}
                  </Label>
                )}
              </div>

              {/* Time inputs - always show but disable when closed */}
              <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${dayHours.closed ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 font-medium min-w-[35px]">Open</Label>
                  <Input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                    disabled={dayHours.closed || !isEditing}
                    className="h-9 w-28 text-sm border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <span className="text-gray-400 text-sm font-medium hidden sm:inline">-</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 font-medium min-w-[35px]">Close</Label>
                  <Input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                    disabled={dayHours.closed || !isEditing}
                    className="h-9 w-28 text-sm border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {isEditing && (
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-transition w-full sm:w-auto border border-gray-300"
              size="lg"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Business Hours'
              )}
            </Button>
          )}
          
          {isEditing && (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={saving}
              className="w-full sm:w-auto border border-gray-300"
              size="lg"
            >
              Cancel
            </Button>
          )}
          
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={handleEdit}
              disabled={saving}
              className="w-full sm:w-auto border border-gray-300"
              size="lg"
            >
              Edit Business Hours
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
