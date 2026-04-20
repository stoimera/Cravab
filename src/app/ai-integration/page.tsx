'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { Loader2, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { encryptText } from '@/lib/crypto'

interface VapiConfig {
  vapi_api_key_encrypted: string | null
  vapi_public_api_key: string | null
  vapi_assistant_id: string | null
}

export default function AIIntegrationPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [config, setConfig] = useState<VapiConfig>({
    vapi_api_key_encrypted: null,
    vapi_public_api_key: null,
    vapi_assistant_id: null
  })
  const [formData, setFormData] = useState({
    vapi_api_key: '',
    vapi_public_api_key: '',
    vapi_assistant_id: ''
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setTenantId((userData as any).tenant_id)
          
          // Check if user is admin
          if ((userData as any).role !== 'admin') {
            toast.error('Access denied. Admin privileges required.')
            return
          }
          
          // Fetch tenant config
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('vapi_api_key_encrypted, vapi_public_api_key, vapi_assistant_id')
            .eq('id', (userData as any).tenant_id)
            .single()
          
          if (tenantData) {
            setConfig(tenantData)
            // Also populate the form fields with saved values
            setFormData({
              vapi_api_key: '', // Don't show the actual API key for security
              vapi_public_api_key: '', // Don't show the actual public API key for security
              vapi_assistant_id: (tenantData as any).vapi_assistant_id || ''
            })
          }
        }
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSave = async () => {
    if (!tenantId) return
    
    setSaving(true)
    try {
      // Send to API endpoint for server-side encryption
      const response = await fetch('/api/vapi/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vapi_api_key: formData.vapi_api_key,
          vapi_public_api_key: formData.vapi_public_api_key,
          vapi_assistant_id: formData.vapi_assistant_id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save configuration')
      }

      const result = await response.json()

      toast.success('Vapi configuration saved successfully!')
      setConfig({
        vapi_api_key_encrypted: result.vapi_api_key_encrypted,
        vapi_public_api_key: result.vapi_public_api_key,
        vapi_assistant_id: result.vapi_assistant_id
      })
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your configuration and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to save configuration. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save configuration. Please check your connection and try again.');
      } else {
        toast.error('Failed to save configuration. Please try again.');
      }
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    }
  }

  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/vapi/webhook`
    }
    return '/api/vapi/webhook'
  }

  const getInternalAvailabilityUrl = () => {
    if (typeof window !== 'undefined' && tenantId) {
      return `${window.location.origin}/api/internal/${tenantId}/availability`
    }
    return tenantId ? `/api/internal/${tenantId}/availability` : ''
  }

  const getInternalBookUrl = () => {
    if (typeof window !== 'undefined' && tenantId) {
      return `${window.location.origin}/api/internal/${tenantId}/book`
    }
    return tenantId ? `/api/internal/${tenantId}/book` : ''
  }


  if (loading) {
    return (
      <ResponsiveLayout activeTab="more" title="AI Integration" showBackButton={true}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-2 text-gray-600">Loading...</p>
        </div>
      </ResponsiveLayout>
    )
  }

  if (!user || !tenantId) {
    return (
      <ResponsiveLayout activeTab="more" title="AI Integration" showBackButton={true}>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout activeTab="more" title="AI Integration" showBackButton={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl text-gray-900">
            Configure Vapi AI for automated call handling and appointment booking
          </h1>
        </div>

        {/* Configuration Status */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Configuration Status
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {config.vapi_api_key_encrypted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Private API Key</span>
                </div>
                <Badge 
                  variant={config.vapi_api_key_encrypted ? "default" : "destructive"}
                  className="mt-2"
                >
                  {config.vapi_api_key_encrypted ? "Configured" : "Missing"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {config.vapi_public_api_key ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Public API Key</span>
                </div>
                <Badge 
                  variant={config.vapi_public_api_key ? "default" : "destructive"}
                  className="mt-2"
                >
                  {config.vapi_public_api_key ? "Configured" : "Missing"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {config.vapi_assistant_id ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Assistant ID</span>
                </div>
                <Badge 
                  variant={config.vapi_assistant_id ? "default" : "destructive"}
                  className="mt-2"
                >
                  {config.vapi_assistant_id ? "Configured" : "Missing"}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vapi Configuration Form */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Vapi Configuration
            </h3>
            <p className="text-sm text-gray-600">
              Enter your Vapi API credentials to enable AI call handling
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vapi_api_key">Private API Key</Label>
              <Input
                id="vapi_api_key"
                type="password"
                placeholder={config.vapi_api_key_encrypted ? "Private API key is saved (enter new key to update)" : "Enter your Vapi Private API key"}
                value={formData.vapi_api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, vapi_api_key: e.target.value }))}
                className="form-transition"
              />
              <p className="text-sm text-gray-500">
                {config.vapi_api_key_encrypted 
                  ? "Private API key is securely saved. Enter a new key above to update it."
                  : "Get your Private API key from the Vapi dashboard (Settings > API Keys). Used for backend operations and webhooks."
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vapi_public_api_key">Public API Key</Label>
              <Input
                id="vapi_public_api_key"
                type="password"
                placeholder={config.vapi_public_api_key ? "Public API key is saved (enter new key to update)" : "Enter your Vapi Public API key"}
                value={formData.vapi_public_api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, vapi_public_api_key: e.target.value }))}
                className="form-transition"
              />
              <p className="text-sm text-gray-500">
                {config.vapi_public_api_key 
                  ? "Public API key is securely saved. Enter a new key above to update it."
                  : "Get your Public API key from the Vapi dashboard (Settings > API Keys). Used for frontend testing and client-side features."
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vapi_assistant_id">Assistant ID</Label>
              <Input
                id="vapi_assistant_id"
                type="text"
                placeholder="Enter your Vapi Assistant ID"
                value={formData.vapi_assistant_id}
                onChange={(e) => setFormData(prev => ({ ...prev, vapi_assistant_id: e.target.value }))}
                className="form-transition"
              />
              <p className="text-sm text-gray-500">
                The ID of your Vapi assistant that will handle calls
              </p>
            </div>



            <Button 
              onClick={handleSave} 
              disabled={saving || (!formData.vapi_api_key && !formData.vapi_public_api_key && !formData.vapi_assistant_id)}
              className="btn-transition w-full border border-gray-300"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                formData.vapi_api_key || formData.vapi_assistant_id 
                  ? 'Update Configuration' 
                  : 'Save Configuration'
              )}
            </Button>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Webhook URLs
            </h3>
            <p className="text-sm text-gray-600">
              Configure these URLs in your Vapi assistant settings
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vapi Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={getWebhookUrl()}
                  readOnly
                  className="form-transition"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getWebhookUrl())}
                  className="btn-transition"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Configure this as your webhook URL in Vapi assistant settings (Global level)
              </p>
            </div>
          </div>
        </div>

      </div>
    </ResponsiveLayout>
  )
}