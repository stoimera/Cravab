'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Bell, Shield, Globe, User, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { BusinessHoursSettings } from './BusinessHoursSettings'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { useUpdateUserSettings, useUpdateCompanySettings, useUpdateNotificationSettings } from '@/hooks/useQueries'
import { useAppContext } from '@/contexts/AppContext'
import { Database } from '@/types/database-comprehensive'

// Type aliases for better readability
type User = Database['public']['Tables']['users']['Row']
type Tenant = Database['public']['Tables']['tenants']['Row']
type UserPreferences = {
  email_notifications: boolean
  sms_notifications: boolean
  call_notifications: boolean
  appointment_reminders: boolean
}

interface UserSettings {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  title: string | null
}

interface TenantSettings {
  name: string
  email: string | null
  timezone: string | null
  service_area: string | null
  service_radius: number
  base_address: string | null
  business_hours: any
  subscription_plan: string
  subscription_active: boolean
  business_type?: string | null
  industry?: string | null
  service_categories?: any
}

interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  call_notifications: boolean
  appointment_reminders: boolean
}

function SettingsFormContent() {
  const supabase = createClient()
  const { tenantId } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Mutation hooks for instant updates
  const updateUserSettingsMutation = useUpdateUserSettings(tenantId || '')
  const updateCompanySettingsMutation = useUpdateCompanySettings(tenantId || '')
  const updateNotificationSettingsMutation = useUpdateNotificationSettings(tenantId || '')
  
  // User settings
  const [userSettings, setUserSettings] = useState<UserSettings>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: ''
  })

  // Tenant settings
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    name: '',
    email: '',
    timezone: 'America/New_York',
    service_area: '',
    service_radius: 25,
    base_address: '',
    business_hours: null,
    subscription_plan: 'basic',
    subscription_active: false,
    business_type: null,
    industry: null,
    service_categories: []
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    call_notifications: true,
    appointment_reminders: true
  })

  useEffect(() => {
    const loadSettings = async () => {
      // Don't load settings if tenantId is not available
      if (!tenantId) return
      
      setLoading(true) // Reset loading state
      
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          // Get user data
          const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, first_name, last_name, email, phone, title')
            .eq('id', authUser.id)
            .single()
          
          if (userData) {
            const user = userData as User
            setUser(user) // Set the database user data
            setUserSettings({
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              phone: user.phone,
              title: user.title
            })

            // Get tenant data
            if (user.tenant_id) {
              const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('name, email, timezone, address, service_area, service_radius, base_address, business_hours, subscription_plan, subscription_active, business_type')
                .eq('id', user.tenant_id)
                .single()
              
              // Also get company_settings for industry
              const { data: companySettingsData, error: companySettingsError } = await supabase
                .from('company_settings')
                .select('industry, service_categories')
                .eq('tenant_id', user.tenant_id)
                .maybeSingle()
              
              if (tenantData && !tenantError) {
                const tenant = tenantData as any
                const companySettings = (companySettingsData && !companySettingsError) ? companySettingsData as any : null
                setTenantSettings({
                  name: tenant.name,
                  email: tenant.email,
                  timezone: tenant.timezone,
                  service_area: tenant.service_area || '',
                  service_radius: tenant.service_radius || 25,
                  base_address: tenant.base_address || tenant.address || '',
                  business_hours: tenant.business_hours,
                  subscription_plan: tenant.subscription_plan || 'basic',
                  subscription_active: tenant.subscription_active || false,
                  business_type: tenant.business_type || null,
                  industry: companySettings?.industry || null,
                  service_categories: companySettings?.service_categories || []
                })
              }

              // Get user notification preferences (only if user exists)
              if (user && user.id) {
                const { data: preferencesData } = await supabase
                  .from('user_preferences')
                  .select('email_notifications, sms_notifications, call_notifications, appointment_reminders')
                  .eq('user_id', user.id)
                  .single()
              
                if (preferencesData) {
                  const preferences = preferencesData as UserPreferences
                  setNotificationSettings({
                    email_notifications: preferences.email_notifications,
                    sms_notifications: preferences.sms_notifications,
                    call_notifications: preferences.call_notifications,
                    appointment_reminders: preferences.appointment_reminders
                  })
                }
              }
            }
          }
        }
      } catch (error) {
        // Error loading settings
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [supabase, tenantId])

  const handleUserSettingsChange = (field: keyof UserSettings, value: string) => {
    setUserSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleTenantSettingsChange = (field: keyof TenantSettings, value: string | number | null) => {
    setTenantSettings(prev => {
      const updated = { ...prev, [field]: value }
      // Sync business_type to industry when business_type changes
      if (field === 'business_type' && value) {
        updated.industry = value as string
      }
      return updated
    })
  }

  const handleBusinessHoursChange = (businessHours: any) => {
    setTenantSettings(prev => ({ ...prev, business_hours: businessHours }))
  }

  const handleNotificationSettingsChange = useCallback(async (field: keyof NotificationSettings, value: boolean) => {
    // Don't save if still loading
    if (loading) return
    
    // Update state first
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
    
    // Auto-save notification settings using mutation hook
    try {
      await updateNotificationSettingsMutation.mutateAsync({
        [field]: value
      })
      
      toast.success('Notification settings saved')
    } catch (error) {
      logger.error('Error saving notification settings:', error)
      toast.error('Failed to save notification settings')
      // Revert the change on error
      setNotificationSettings(prev => ({ ...prev, [field]: !value }))
    }
  }, [loading, updateNotificationSettingsMutation])

  const handleSaveUserSettings = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      await updateUserSettingsMutation.mutateAsync({
        first_name: userSettings.first_name,
        last_name: userSettings.last_name,
        phone: userSettings.phone,
        title: userSettings.title
      })
      
      toast.success('User settings saved successfully!')
      setIsEditing(false)
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user settings';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your settings and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to save settings. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save settings. Please check your connection and try again.');
      } else {
        toast.error('Failed to save user settings. Please try again.');
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTenantSettings = async () => {
    if (!tenantId) return
    
    setSaving(true)
    try {
      // Update tenant table (business_type)
      if (tenantSettings.business_type !== undefined) {
        const { error: tenantUpdateError } = await (supabase as any)
          .from('tenants')
          .update({ business_type: tenantSettings.business_type })
          .eq('id', tenantId)
        
        if (tenantUpdateError) {
          logger.error('Error updating business_type:', tenantUpdateError)
        }
      }

      // Update company_settings table (industry)
      if (tenantSettings.industry !== undefined || tenantSettings.business_type !== undefined) {
        const { data: existingSettings } = await supabase
          .from('company_settings')
          .select('id')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        const industryValue = tenantSettings.industry || tenantSettings.business_type

        if (existingSettings) {
          await (supabase as any)
            .from('company_settings')
            .update({ industry: industryValue })
            .eq('tenant_id', tenantId)
        } else {
          await (supabase as any)
            .from('company_settings')
            .insert({ tenant_id: tenantId, industry: industryValue })
        }
      }

      await updateCompanySettingsMutation.mutateAsync({
        name: tenantSettings.name,
        email: tenantSettings.email,
        timezone: tenantSettings.timezone,
        service_area: tenantSettings.service_area,
        service_radius: tenantSettings.service_radius,
        base_address: tenantSettings.base_address,
        business_hours: tenantSettings.business_hours,
        subscription_plan: tenantSettings.subscription_plan,
        subscription_active: tenantSettings.subscription_active
      })
      
      toast.success('Company settings saved successfully!')
      setIsEditing(false)
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save company settings';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your company settings and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to save company settings. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save company settings. Please check your connection and try again.');
      } else {
        toast.error('Failed to save company settings. Please try again.');
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBusinessHours = async (businessHours: any) => {
    if (!tenantId) return
    
    setSaving(true)
    try {
      await updateCompanySettingsMutation.mutateAsync({
        business_hours: businessHours
      })
      
      toast.success('Business hours saved successfully!')
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save business hours';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your business hours and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to save business hours. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save business hours. Please check your connection and try again.');
      } else {
        toast.error('Failed to save business hours. Please try again.');
      }
    } finally {
      setSaving(false)
    }
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'UTC'
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-600">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Profile Settings */}
      <Card className="card-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={userSettings.first_name || ''}
                onChange={(e) => handleUserSettingsChange('first_name', e.target.value)}
                disabled={!isEditing}
                className="form-transition"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={userSettings.last_name || ''}
                onChange={(e) => handleUserSettingsChange('last_name', e.target.value)}
                disabled={!isEditing}
                className="form-transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userSettings.email}
              disabled
              className="form-transition bg-gray-50"
            />
            <p className="text-sm text-gray-500">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={userSettings.phone || ''}
                onChange={(e) => handleUserSettingsChange('phone', e.target.value)}
                disabled={!isEditing}
                className="form-transition"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={userSettings.title || ''}
                onChange={(e) => handleUserSettingsChange('title', e.target.value)}
                placeholder="e.g., Senior Technician"
                disabled={!isEditing}
                className="form-transition"
              />
            </div>
          </div>

          <Button 
            onClick={isEditing ? handleSaveUserSettings : () => setIsEditing(true)} 
            disabled={saving}
            className="btn-transition w-full sm:w-auto border border-gray-300"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Save Personal Settings'
            ) : (
              'Edit Personal Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card className="card-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings
          </CardTitle>
          <CardDescription>
            Manage your company information and service area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={tenantSettings.name}
              onChange={(e) => handleTenantSettingsChange('name', e.target.value)}
              disabled={!isEditing}
              className="form-transition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type / Industry</Label>
            <Select
              value={tenantSettings.business_type || ''}
              onValueChange={(value) => handleTenantSettingsChange('business_type', value)}
              disabled={!isEditing}
            >
              <SelectTrigger className="form-transition">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={tenantSettings.email || ''}
                onChange={(e) => handleTenantSettingsChange('email', e.target.value)}
                disabled={!isEditing}
                className="form-transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={tenantSettings.timezone || undefined}
                onValueChange={(value) => handleTenantSettingsChange('timezone', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="form-transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_radius">Service Radius (miles)</Label>
              <Input
                id="service_radius"
                type="number"
                min="1"
                max="100"
                value={tenantSettings.service_radius}
                onChange={(e) => handleTenantSettingsChange('service_radius', parseInt(e.target.value))}
                disabled={!isEditing}
                className="form-transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_area">Service Area Description</Label>
            <Input
              id="service_area"
              value={tenantSettings.service_area || ''}
              onChange={(e) => handleTenantSettingsChange('service_area', e.target.value)}
              placeholder="e.g., Greater Boston Area, All of Massachusetts"
              disabled={!isEditing}
              className="form-transition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_address">Base Address</Label>
            <Textarea
              id="base_address"
              value={tenantSettings.base_address || ''}
              onChange={(e) => handleTenantSettingsChange('base_address', e.target.value)}
              placeholder="Enter your company's base address"
              disabled={!isEditing}
              className="form-transition"
              rows={3}
            />
          </div>

          <Button 
            onClick={isEditing ? handleSaveTenantSettings : () => setIsEditing(true)} 
            disabled={saving}
            className="btn-transition w-full sm:w-auto border border-gray-300"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Save Company Settings'
            ) : (
              'Edit Company Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Business Hours Settings */}
      <BusinessHoursSettings
        businessHours={tenantSettings.business_hours}
        onSave={handleSaveBusinessHours}
        saving={saving}
      />

      {/* Notification Settings */}
      {/* COMMENTED OUT - Notification Preferences section
      <Card className="card-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="email_notifications"
                checked={notificationSettings.email_notifications}
                onCheckedChange={(checked) => handleNotificationSettingsChange('email_notifications', checked)}
              />
            </div>


            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="call_notifications">Call Notifications</Label>
                <p className="text-sm text-gray-500">Get notified about incoming calls</p>
              </div>
              <Switch
                id="call_notifications"
                checked={notificationSettings.call_notifications}
                onCheckedChange={(checked) => handleNotificationSettingsChange('call_notifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="appointment_reminders">Appointment Reminders</Label>
                <p className="text-sm text-gray-500">Receive reminders for upcoming appointments</p>
              </div>
              <Switch
                id="appointment_reminders"
                checked={notificationSettings.appointment_reminders}
                onCheckedChange={(checked) => handleNotificationSettingsChange('appointment_reminders', checked)}
              />
            </div>
          </div>

        </CardContent>
      </Card>
      */}

      {/* Security Settings */}
      <Card className="card-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Your account is secured with industry-standard encryption.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Last Login</Label>
            <p className="text-sm text-gray-500">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Account Created</Label>
            <p className="text-sm text-gray-500">
              {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsForm() {
  return (
    <APIErrorBoundary context="settings form">
      <SettingsFormContent />
    </APIErrorBoundary>
  )
}
