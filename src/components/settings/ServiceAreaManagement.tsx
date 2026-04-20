'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MapPin, Plus, Edit, Trash2, Map, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ServiceAreaChecker } from '@/components/service-area/ServiceAreaChecker'
import { geocodeAddress } from '@/lib/geocoding/google-maps'
import { useCreateServiceArea, useUpdateServiceArea, useDeleteServiceArea } from '@/hooks/useQueries'

interface ServiceArea {
  id: string
  name: string
  description?: string
  center_address: string
  center_latitude: number
  center_longitude: number
  radius_miles: number
  zip_codes: string[]
  cities: string[]
  states: string[]
  countries: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CompanySettings {
  tenant_id: string
  base_address?: string
  base_latitude?: number
  base_longitude?: number
  service_radius_miles: number
  timezone: string
  service_areas: any[]
}

interface ServiceAreaManagementProps {
  tenantId: string
}

export function ServiceAreaManagement({ tenantId }: ServiceAreaManagementProps) {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null)
  const { toast } = useToast()
  
  // Mutation hooks for instant updates
  const createServiceAreaMutation = useCreateServiceArea(tenantId)
  const updateServiceAreaMutation = useUpdateServiceArea(tenantId)
  const deleteServiceAreaMutation = useDeleteServiceArea(tenantId)

  // Form state for new/editing service area
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    center_address: '',
    center_latitude: '',
    center_longitude: '',
    radius_miles: 25,
    zip_codes: '',
    cities: '',
    states: '',
    countries: '',
    is_active: true
  })

  // Geocoding state
  const [geocodingAddress, setGeocodingAddress] = useState('')
  const [geocodingResult, setGeocodingResult] = useState<any>(null)
  const [geocodingLoading, setGeocodingLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [tenantId])

  // Geocode address function
  const handleGeocodeAddress = async () => {
    if (!geocodingAddress.trim()) {
      toast.error('Please enter an address to geocode')
      return
    }

    setGeocodingLoading(true)
    try {
      const result = await geocodeAddress(geocodingAddress)
      setGeocodingResult(result)
      
      // Auto-fill form data if we're in edit mode
      if (editingArea) {
        setFormData(prev => ({
          ...prev,
          center_address: result.formatted_address,
          center_latitude: result.latitude.toString(),
          center_longitude: result.longitude.toString()
        }))
      }
      
      toast.success('Address geocoded successfully')
    } catch (error) {
      // Geocoding error
      toast.error('Failed to geocode address')
    } finally {
      setGeocodingLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load company settings
      const settingsResponse = await fetch('/api/company-settings')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setCompanySettings(settingsData.company_settings)
      }

      // Load service areas
      const areasResponse = await fetch('/api/service-areas')
      if (areasResponse.ok) {
        const areasData = await areasResponse.json()
        setServiceAreas(areasData.service_areas)
      }
    } catch (error) {
      // Error loading data
      toast.error('Failed to load service area data')
    } finally {
      setLoading(false)
    }
  }

// Duplicate function removed - using the one defined above

  const handleSaveServiceArea = async () => {
    try {
      setSaving(true)

      const areaData = {
        name: formData.name,
        description: formData.description || null,
        center_address: formData.center_address,
        center_latitude: parseFloat(formData.center_latitude),
        center_longitude: parseFloat(formData.center_longitude),
        radius_miles: formData.radius_miles,
        zip_codes: formData.zip_codes ? formData.zip_codes.split(',').map(z => z.trim()) : [],
        cities: formData.cities ? formData.cities.split(',').map(c => c.trim()) : [],
        states: formData.states ? formData.states.split(',').map(s => s.trim()) : [],
        countries: formData.countries ? formData.countries.split(',').map(c => c.trim()) : [],
        is_active: formData.is_active
      }

      if (editingArea) {
        // Update existing service area
        await updateServiceAreaMutation.mutateAsync({
          serviceAreaId: editingArea.id,
          serviceAreaData: areaData
        })
        toast.success('Service area updated successfully')
      } else {
        // Create new service area
        await createServiceAreaMutation.mutateAsync(areaData)
        toast.success('Service area created successfully')
      }
      
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      // Error saving service area
      const errorMessage = error instanceof Error ? error.message : 'Failed to save service area';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your service area information and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to save service areas. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save service area. Please check your connection and try again.');
      } else {
        toast.error('Failed to save service area. Please try again.');
      }
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      center_address: '',
      center_latitude: '',
      center_longitude: '',
      radius_miles: 25,
      zip_codes: '',
      cities: '',
      states: '',
      countries: '',
      is_active: true
    })
    setEditingArea(null)
  }

  const handleEdit = (area: ServiceArea) => {
    setEditingArea(area)
    setFormData({
      name: area.name,
      description: area.description || '',
      center_address: area.center_address,
      center_latitude: area.center_latitude.toString(),
      center_longitude: area.center_longitude.toString(),
      radius_miles: area.radius_miles,
      zip_codes: area.zip_codes.join(', '),
      cities: area.cities.join(', '),
      states: area.states.join(', '),
      countries: area.countries.join(', '),
      is_active: area.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDeleteServiceArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this service area?')) {
      return
    }

    try {
      await deleteServiceAreaMutation.mutateAsync(areaId)
      toast.success('Service area deleted successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete service area';
      if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to delete service areas. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to delete service area. Please check your connection and try again.');
      } else {
        toast.error('Failed to delete service area. Please try again.');
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Base Service Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Base Service Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-address" className="text-foreground font-inter">
                Base Address
              </Label>
              <Input
                id="base-address"
                value={companySettings?.base_address || ''}
                placeholder="123 Main St, City, State 12345"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-radius" className="text-foreground font-inter">
                Service Radius (miles)
              </Label>
              <Input
                id="service-radius"
                type="number"
                value={companySettings?.service_radius_miles || 25}
                disabled
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Base service area is configured in Company Settings. 
            Additional service areas can be added below.
          </div>
        </CardContent>
      </Card>

      {/* Service Area Checker */}
      {companySettings?.base_address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Service Area Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceAreaChecker
              baseAddress={companySettings.base_address}
              serviceRadiusMiles={companySettings.service_radius_miles || 25}
              onResult={(result) => {
                // Service area check result
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Service Areas Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground font-inter flex items-center gap-2">
              <Map className="h-5 w-5" />
              Service Areas
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service Area
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white mx-auto my-2 sm:my-8 p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>
                    {editingArea ? 'Edit Service Area' : 'Add New Service Area'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Downtown Service Area"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="radius_miles">Radius (miles) *</Label>
                      <Input
                        id="radius_miles"
                        type="number"
                        value={formData.radius_miles}
                        onChange={(e) => setFormData(prev => ({ ...prev, radius_miles: parseInt(e.target.value) || 25 }))}
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this service area..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="center_address">Center Address *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="center_address"
                        value={formData.center_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, center_address: e.target.value }))}
                        placeholder="123 Main St, City, State 12345"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeocodeAddress}
                      >
                        Geocode
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="center_latitude">Latitude *</Label>
                      <Input
                        id="center_latitude"
                        type="number"
                        step="any"
                        value={formData.center_latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, center_latitude: e.target.value }))}
                        placeholder="41.8781"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="center_longitude">Longitude *</Label>
                      <Input
                        id="center_longitude"
                        type="number"
                        step="any"
                        value={formData.center_longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, center_longitude: e.target.value }))}
                        placeholder="-87.6298"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zip_codes">ZIP Codes</Label>
                      <Input
                        id="zip_codes"
                        value={formData.zip_codes}
                        onChange={(e) => setFormData(prev => ({ ...prev, zip_codes: e.target.value }))}
                        placeholder="60601, 60602, 60603"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cities">Cities</Label>
                      <Input
                        id="cities"
                        value={formData.cities}
                        onChange={(e) => setFormData(prev => ({ ...prev, cities: e.target.value }))}
                        placeholder="Chicago, Evanston, Oak Park"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="states">States</Label>
                      <Input
                        id="states"
                        value={formData.states}
                        onChange={(e) => setFormData(prev => ({ ...prev, states: e.target.value }))}
                        placeholder="IL, Illinois"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="countries">Countries</Label>
                      <Input
                        id="countries"
                        value={formData.countries}
                        onChange={(e) => setFormData(prev => ({ ...prev, countries: e.target.value }))}
                        placeholder="US, United States"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveServiceArea} disabled={saving}>
                      {saving ? 'Saving...' : editingArea ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {serviceAreas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No service areas configured yet.</p>
              <p className="text-sm">Add your first service area to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceAreas.map((area) => (
                <div key={area.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{area.name}</h3>
                        <Badge variant={area.is_active ? 'default' : 'secondary'}>
                          {area.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {area.description && (
                        <p className="text-sm text-muted-foreground">{area.description}</p>
                      )}
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Address:</strong> {area.center_address}</p>
                        <p><strong>Radius:</strong> {area.radius_miles} miles</p>
                        <p><strong>Coordinates:</strong> {area.center_latitude}, {area.center_longitude}</p>
                        {area.zip_codes.length > 0 && (
                          <p><strong>ZIP Codes:</strong> {area.zip_codes.join(', ')}</p>
                        )}
                        {area.cities.length > 0 && (
                          <p><strong>Cities:</strong> {area.cities.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(area)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteServiceArea(area.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
