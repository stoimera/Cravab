'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Clock, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CompanyData {
  id: string
  name: string
  timezone: string
  service_area: string
  service_radius: number
  base_address: string
  base_latitude?: number
  base_longitude?: number
  service_radius_miles: number
  business_type?: string | null
  business_hours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

interface CompanySettingsProps {
  tenantId: string
  initialData?: CompanyData
}

export function CompanySettings({ tenantId, initialData }: CompanySettingsProps) {
  const [data, setData] = useState<CompanyData>(initialData || {
    id: tenantId,
    name: '',
    timezone: 'America/New_York',
    service_area: '',
    service_radius: 25,
    base_address: '',
    base_latitude: undefined,
    base_longitude: undefined,
    service_radius_miles: 25,
    business_type: null,
    business_hours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true }
    }
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load business_type on mount
  useEffect(() => {
    const loadBusinessType = async () => {
      try {
        const response = await fetch('/api/company/settings')
        if (response.ok) {
          const result = await response.json()
          if (result.company) {
            const tenant = result.company as any
            if (tenant.business_type) {
              setData(prev => ({ ...prev, business_type: tenant.business_type }))
            }
          }
        }
      } catch (error) {
        logger.error('Error loading business_type:', error)
      }
    }
    loadBusinessType()
  }, [])

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu'
  ]

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Update tenant table with business_type
      if (data.business_type) {
        const tenantResponse = await fetch('/api/company/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.id,
            name: data.name,
            business_type: data.business_type
          })
        })
        if (!tenantResponse.ok) {
          logger.error('Failed to update business_type')
        }
      }
      
      // Prepare data for company_settings table
      const companySettingsData = {
        tenant_id: data.id,
        base_address: data.base_address,
        base_latitude: data.base_latitude,
        base_longitude: data.base_longitude,
        service_radius_miles: data.service_radius_miles,
        timezone: data.timezone,
        industry: data.business_type || null,
        service_areas: []
      }
      
      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companySettingsData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      toast('Company settings have been updated successfully.', {
        description: 'Settings saved'
      })
    } catch (error) {
      logger.error('Error saving settings:', error)
      toast('Failed to save settings. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }
  const updateBusinessHours = (day: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-foreground font-inter">Company Name</Label>
              <Input
                id="company-name"
                value={data.name}
                onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business-type" className="text-foreground font-inter">Business Type</Label>
              <Select 
                value={data.business_type || ''} 
                onValueChange={(value) => setData(prev => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="carpentry">Carpentry</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="appliance">Appliance</SelectItem>
                  <SelectItem value="locksmith">Locksmith</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                  <SelectItem value="car detailing">Car Detailing</SelectItem>
                  <SelectItem value="car dealership">Car Dealership</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for industry-specific terminology in AI assistant
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-foreground font-inter">Timezone</Label>
              <Select value={data.timezone} onValueChange={(value) => setData(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-address" className="text-foreground font-inter">Base Address</Label>
            <Input
              id="base-address"
              value={data.base_address}
              onChange={(e) => setData(prev => ({ ...prev, base_address: e.target.value }))}
              placeholder="123 Main St, City, State 12345"
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-area" className="text-foreground font-inter">Service Area Description</Label>
              <Textarea
                id="service-area"
                value={data.service_area}
                onChange={(e) => setData(prev => ({ ...prev, service_area: e.target.value }))}
                placeholder="Describe your service area (e.g., Greater Boston Area, All of Massachusetts)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-radius" className="text-foreground font-inter">Service Radius (miles)</Label>
              <Input
                id="service-radius"
                type="number"
                value={data.service_radius_miles}
                onChange={(e) => setData(prev => ({ ...prev, service_radius_miles: parseInt(e.target.value) || 25 }))}
                min="1"
                max="100"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-latitude" className="text-foreground font-inter">Base Latitude</Label>
              <Input
                id="base-latitude"
                type="number"
                step="any"
                value={data.base_latitude || ''}
                onChange={(e) => setData(prev => ({ ...prev, base_latitude: parseFloat(e.target.value) || undefined }))}
                placeholder="41.8781"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-longitude" className="text-foreground font-inter">Base Longitude</Label>
              <Input
                id="base-longitude"
                type="number"
                step="any"
                value={data.base_longitude || ''}
                onChange={(e) => setData(prev => ({ ...prev, base_longitude: parseFloat(e.target.value) || undefined }))}
                placeholder="-87.6298"
              />
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Base coordinates are used for service area calculations. They will be automatically set when you geocode your base address.</p>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-3 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-3">Day</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-6">Hours</div>
          </div>
          
          {days.map(day => {
            const dayData = data.business_hours[day.key as keyof typeof data.business_hours]
            return (
              <div key={day.key} className="grid grid-cols-12 gap-4 items-center p-3 bg-muted/50 rounded-lg">
                {/* Day Name Column */}
                <div className="col-span-3">
                  <Label className="text-foreground font-inter font-medium">{day.label}</Label>
                </div>
                
                {/* Toggle Column */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!dayData.closed}
                      onCheckedChange={(checked) => updateBusinessHours(day.key, 'closed', !checked)}
                    />
                    <span className="text-muted-foreground font-inter text-sm">
                      {dayData.closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                </div>
                
                {/* Hours Column */}
                <div className="col-span-6">
                  {!dayData.closed ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayData.open}
                        onChange={(e) => updateBusinessHours(day.key, 'open', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        value={dayData.close}
                        onChange={(e) => updateBusinessHours(day.key, 'close', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Closed</span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
