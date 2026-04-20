'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Building2, Clock, MapPin, Phone } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { geocodeAddress } from '@/lib/geocoding/google-maps'
import { useUpdateCompanySettings } from '@/hooks/useQueries'
import { useAppContext } from '@/contexts/AppContext'

interface CompanySettings {
  id: string
  name: string
  description?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  timezone: string
  business_hours: any
  base_address?: string
  base_latitude?: number
  base_longitude?: number
  service_radius_miles: number
  emergency_service: boolean
  ai_phone_number?: string
  ai_voice_settings: any
}

export default function CompanySettingsForm() {
  const { tenantId } = useAppContext()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  
  // Mutation hook for instant updates
  const updateCompanySettingsMutation = useUpdateCompanySettings(tenantId || '')
  
  const [formData, setFormData] = useState<Partial<CompanySettings>>({
    name: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    timezone: 'America/New_York',
    base_address: '',
    base_latitude: undefined,
    base_longitude: undefined,
    service_radius_miles: 25,
    emergency_service: true,
    ai_phone_number: '',
    business_hours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '09:00', close: '15:00' },
      sunday: { closed: true }
    },
    ai_voice_settings: {
      voice: 'professional',
      speed: 1.0
    }
  })

  // Load current settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/company/settings')
      if (response.ok) {
        const data = await response.json()
        const company = data.company as any
        
        // Also fetch company_settings for industry
        const settingsResponse = await fetch('/api/company-settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          if (settingsData.company_settings) {
            company.industry = settingsData.company_settings.industry || company.business_type
          }
        }
        
        setSettings(company)
        setFormData(company)
      }
    } catch (error) {
      logger.error('Error loading company settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const formDataAny = formData as any
      
      // Update business_type in tenants table if provided
      if (formDataAny.business_type) {
        const tenantResponse = await fetch('/api/company/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: formData.id,
            name: formData.name,
            business_type: formDataAny.business_type
          })
        })
        if (!tenantResponse.ok) {
          logger.error('Failed to update business_type')
        }
      }

      // Update company_settings with industry
      const settingsData: any = {
        ...formData,
        industry: formDataAny.business_type || formDataAny.industry || null
      }
      
      await updateCompanySettingsMutation.mutateAsync(settingsData)
      
      setSuccess('Company settings updated successfully!')
      setSettings(formData as CompanySettings)
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGeocodeAddress = async () => {
    if (!formData.base_address?.trim()) {
      setError('Please enter a base address to geocode')
      return
    }

    setGeocoding(true)
    setError(null)
    
    try {
      const result = await geocodeAddress(formData.base_address)
      
      setFormData(prev => ({
        ...prev,
        base_latitude: result.latitude,
        base_longitude: result.longitude
      }))
      
      setSuccess('Address geocoded successfully! Coordinates have been automatically filled.')
    } catch (error) {
      logger.error('Geocoding error:', error)
      setError('Failed to geocode address. Please check the address and try again.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleBusinessHoursChange = (day: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours?.[day],
          [field]: value
        }
      }
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings
          </CardTitle>
          <CardDescription>
            Manage your company information, business hours, and service settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <select
                    id="business_type"
                    value={(formData as any).business_type || ''}
                    onChange={(e) => handleInputChange('business_type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select business type</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="hvac">HVAC</option>
                    <option value="electrical">Electrical</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="roofing">Roofing</option>
                    <option value="painting">Painting</option>
                    <option value="appliance">Appliance</option>
                    <option value="locksmith">Locksmith</option>
                    <option value="handyman">Handyman</option>
                    <option value="car detailing">Car Detailing</option>
                    <option value="car dealership">Car Dealership</option>
                    <option value="other">Other</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Used for industry-specific terminology in AI assistant
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your company"
                  rows={3}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code || ''}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Business Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone || 'America/New_York'}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_address">Base Address (for service area calculation)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="base_address"
                      value={formData.base_address || ''}
                      onChange={(e) => handleInputChange('base_address', e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleGeocodeAddress}
                      disabled={geocoding || !formData.base_address?.trim()}
                      variant="outline"
                    >
                      {geocoding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This address will be used as the center point for service area calculations. Click the map icon to geocode.
                  </p>
                  {(formData.base_latitude && formData.base_longitude) && (
                    <p className="text-xs text-green-600">
                      ✓ Coordinates: {formData.base_latitude.toFixed(6)}, {formData.base_longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_radius">Service Radius (miles)</Label>
                  <Input
                    id="service_radius"
                    type="number"
                    value={formData.service_radius_miles || 25}
                    onChange={(e) => handleInputChange('service_radius_miles', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="emergency_service"
                  checked={formData.emergency_service || false}
                  onCheckedChange={(checked) => handleInputChange('emergency_service', checked)}
                />
                <Label htmlFor="emergency_service">Emergency Service Available</Label>
              </div>
            </div>

            {/* AI Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                AI Settings
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="ai_phone_number">AI Phone Number</Label>
                <Input
                  id="ai_phone_number"
                  value={formData.ai_phone_number || ''}
                  onChange={(e) => handleInputChange('ai_phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={updateCompanySettingsMutation.isPending}>
                {updateCompanySettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
