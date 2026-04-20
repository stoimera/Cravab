'use client';

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getWebhookUrl } from '@/lib/url-helper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Phone, Settings, TestTube } from 'lucide-react';
import { APIErrorBoundary } from '@/components/APIErrorBoundary';
import { useSaveVapiApiKey, useCreateVapiAssistant } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Database } from '@/types/database-comprehensive';

// Use proper types from database schema
type Tenant = Database['public']['Tables']['tenants']['Row']

interface VapiConfig {
  vapi_api_key_encrypted: string | null;
  vapi_assistant_id: string | null;
  twilio_phone_number: string | null;
}

interface VapiAssistant {
  id: string;
  assistant_id: string;
  name: string;
  voice_id: string;
  language: string;
  is_active: boolean;
  created_at: string;
}

interface VapiIntegrationClientProps {
  tenantId: string;
}

export function VapiIntegrationClient({ tenantId }: VapiIntegrationClientProps) {
  const [vapiConfig, setVapiConfig] = useState<VapiConfig | null>(null);
  const [assistants] = useState<VapiAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState<{
    vapi_api_key: string;
    vapi_assistant_id: string;
    twilio_phone_number: string;
  }>({
    vapi_api_key: '',
    vapi_assistant_id: '',
    twilio_phone_number: ''
  });

  const supabase = createClient();
  
  // Mutation hooks for instant updates
  const saveApiKeyMutation = useSaveVapiApiKey(tenantId);
  const createAssistantMutation = useCreateVapiAssistant(tenantId);

  const fetchVapiConfig = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch tenant configuration (Vapi keys and assistant ID are now stored in tenants table)
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('vapi_api_key_encrypted, vapi_assistant_id, twilio_phone_number')
        .eq('id', tenantId)
        .single();

      if (tenantError && tenantError.code !== 'PGRST116') {
        logger.error('Error fetching tenant config:', tenantError);
      }

      if (tenantData) {
        const tenant = tenantData as Tenant
        setVapiConfig({
          vapi_api_key_encrypted: tenant.vapi_api_key_encrypted,
          vapi_assistant_id: tenant.vapi_assistant_id,
          twilio_phone_number: tenant.twilio_phone_number
        });
        setFormData(prev => ({
          ...prev,
          vapi_api_key: tenant.vapi_api_key_encrypted ? '••••••••••••••••' : '', // Masked for security
          vapi_assistant_id: tenant.vapi_assistant_id || '',
          twilio_phone_number: tenant.twilio_phone_number || ''
        }));
      }

      // Assistants are now managed through Vapi dashboard, not stored locally

    } catch (error) {
      logger.error('Error fetching Vapi data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, supabase]);

  useEffect(() => {
    fetchVapiConfig();
  }, [fetchVapiConfig]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveApiKey = async () => {
    if (!formData.vapi_api_key || formData.vapi_api_key === '••••••••••••••••') {
      toast.error('Please enter a valid Vapi API key');
      return;
    }

    try {
      await saveApiKeyMutation.mutateAsync(formData.vapi_api_key);
      
      toast.success('Vapi API key saved successfully');
      await fetchVapiConfig();
      setFormData(prev => ({
        ...prev,
        vapi_api_key: '••••••••••••••••'
      }));
    } catch (error) {
      logger.error('Error saving API key:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save API key';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your API key and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to save API keys. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to save API key. Please check your connection and try again.');
      } else {
        toast.error('Failed to save API key. Please try again.');
      }
    }
  };

  const handleCreateAssistant = async () => {
    if (!vapiConfig) {
      toast.error('Please configure your Vapi API key first');
      return;
    }

    try {
      await createAssistantMutation.mutateAsync({
        name: 'Booking Assistant',
        voice_id: 'alloy',
        language: 'en-US'
      });

      toast.success('Assistant created successfully');
      await fetchVapiConfig();
    } catch (error) {
      logger.error('Error creating assistant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create assistant';
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        toast.error('Please check your assistant configuration and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('You don\'t have permission to create assistants. Please contact your administrator.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Unable to create assistant. Please check your connection and try again.');
      } else {
        toast.error('Failed to create assistant. Please try again.');
      }
    }
  };

  const createTestCall = async () => {
    try {
      const response = await fetch('/api/vapi/create-test-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'web-test',
          duration: 120, // 2 minutes
          transcript: 'Test call from web interface - AI assistant integration test'
        })
      });

      if (response.ok) {
        toast.success('Test call record created successfully!');
      } else {
        toast.error('Failed to create test call record');
      }
    } catch (error) {
      toast.error('Error creating test call record');
    }
  };

  const handleTestIntegration = async () => {
    if (!vapiConfig) {
      toast.error('Please configure your Vapi API key first');
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // Test by creating a call (this will be a test call)
      const response = await fetch('/api/vapi/create-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          to_phone: '+15551234567', // Test number
          metadata: {
            test: true
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult('success');
        toast.success('Integration test successful!');
        
        // Create a test call record for web testing
        await createTestCall();
      } else {
        const errorMessage = data.error || 'Test failed'
        if (errorMessage.includes('not configured') || errorMessage.includes('missing')) {
          throw new Error('VAPI integration is not properly configured. Please check your API key and assistant ID.')
        } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
          throw new Error('You don\'t have permission to test the integration. Please contact your administrator.')
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('Unable to test integration. Please check your connection and try again.')
        } else {
          throw new Error(errorMessage)
        }
      }
    } catch (error) {
      setTestResult('error');
      const errorMessage = error instanceof Error ? error.message : 'Integration test failed'
      toast.error(errorMessage)
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteAssistant = async () => {
    if (!confirm('Are you sure you want to delete this assistant?')) {
      return;
    }

    try {
      // Note: This would need to be implemented in the backend
      // For now, we'll just show a message
      toast.info('Assistant deletion not yet implemented');
    } catch (error) {
      logger.error('Error deleting assistant:', error);
      toast.error('Failed to delete assistant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Vapi integration...</span>
      </div>
    );
  }

  return (
    <APIErrorBoundary context="Vapi integration">
      <div className="space-y-6">
      {/* API Key Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vapi Configuration
          </h3>
          <p className="text-sm text-gray-600">
            Configure your Vapi API key to enable AI call handling
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vapi_api_key">Vapi API Key</Label>
            <Input
              id="vapi_api_key"
              type="password"
              placeholder="Enter your Vapi API key"
              value={formData.vapi_api_key}
              onChange={(e) => handleInputChange('vapi_api_key', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Get your API key from the Vapi dashboard
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button 
              onClick={handleSaveApiKey} 
              disabled={saving || !formData.vapi_api_key}
              className="border border-gray-200"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </Button>

            {vapiConfig && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:flex-1">
                <Button
                  onClick={handleTestIntegration} 
                  disabled={testing}
                  variant="outline"
                  className="border border-gray-200 sm:flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Integration
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={createTestCall}
                  variant="outline"
                  className="border border-gray-200 sm:flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Create Test Call Record
                </Button>
              </div>
            )}
          </div>

          {testResult && (
            <Alert variant={testResult === 'success' ? 'default' : 'destructive'} className={testResult === 'success' ? 'border-green-200 bg-green-50' : ''}>
              <div className="flex items-center gap-2">
                {testResult === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {testResult === 'success' 
                    ? 'Integration test passed successfully!' 
                    : 'Integration test failed. Please check your configuration.'
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}

          {vapiConfig && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Vapi API key configured and active
            </div>
          )}
        </div>
      </div>

      {/* Assistants Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Assistants
          </h3>
          <p className="text-sm text-gray-600">
            Manage your Vapi AI assistants for call handling
          </p>
        </div>
        <div>
          {assistants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No assistants configured yet</p>
              <Button onClick={handleCreateAssistant} disabled={!vapiConfig || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Assistant'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assistants.map((assistant) => (
                <div key={assistant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{assistant.name}</h3>
                      <Badge variant={assistant.is_active ? 'default' : 'secondary'}>
                        {assistant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Voice: {assistant.voice_id} • Language: {assistant.language}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(assistant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAssistant()}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button onClick={handleCreateAssistant} disabled={!vapiConfig || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Another Assistant'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Integration Status
          </h3>
          <p className="text-sm text-gray-600">
            Current status of your Vapi integration
          </p>
        </div>
        <div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>API Key</span>
              <Badge variant={vapiConfig ? 'default' : 'secondary'}>
                {vapiConfig ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Assistants</span>
              <Badge variant={assistants.length > 0 ? 'default' : 'secondary'}>
                {assistants.length} configured
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Webhook URL</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {getWebhookUrl()}/api/vapi/webhook
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span>VAPI Webhook</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {getWebhookUrl()}/api/vapi/webhook
              </code>
            </div>
          </div>
        </div>
      </div>
      </div>
    </APIErrorBoundary>
  );
}
