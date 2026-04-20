'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    companySize: '',
    businessType: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create company')
      }

      setSuccess(true)
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin')
      }, 2000)

    } catch (err) {
      setError('Failed to create company. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Company Created!</CardTitle>
            <CardDescription>
              The company has been successfully created and added to the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Login credentials have been sent to {formData.email}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/admin" className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Company</h1>
                <p className="text-sm text-gray-600">Add a new company to the platform</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Fill in the tenant details and Vapi configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="ABC Services Co."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@abcservices.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <select
                      id="companySize"
                      value={formData.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select company size</option>
                      <option value="1-5">1-5 employees</option>
                      <option value="6-20">6-20 employees</option>
                      <option value="21-50">21-50 employees</option>
                      <option value="50+">50+ employees</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <select
                      id="businessType"
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
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
              </div>

              {/* Vapi Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vapi AI Configuration</h3>
                <p className="text-sm text-gray-600">
                  Vapi AI is configured per-tenant. Each tenant will need to provide their own Vapi API key.
                  This allows for better isolation and customization per tenant.
                </p>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Tenants will configure their Vapi API keys after account creation.
                    No additional configuration is needed during tenant creation.
                  </p>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information about this company..."
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/admin">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Company'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
