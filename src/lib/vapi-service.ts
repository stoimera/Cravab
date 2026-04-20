// Vapi Service - Centralized Vapi operations for inbound calls only
import { VapiClient, VapiError, Vapi } from '@vapi-ai/server-sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { decryptText } from '@/lib/crypto';

export interface VapiInboundCallRequest {
  tenantId: string;
  fromNumber: string;
  metadata?: Record<string, any>;
}

export interface VapiCallResponse {
  id: string;
  status: string;
  toNumber: string;
  assistantId: string;
  tenantId: string;
}

export class VapiService {
  private static async getVapiClient(tenantId: string): Promise<VapiClient> {
    const supabaseAdmin = createAdminClient();
    
    // Get tenant's Vapi API key
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('vapi_api_key_encrypted')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.vapi_api_key_encrypted) {
      throw new Error('Vapi API key not configured for this tenant');
    }

    const { config } = await import('@/lib/config');
    const masterKey = config.security.masterEncryptionKey;

    try {
      const vapiApiKey = decryptText(tenant.vapi_api_key_encrypted, masterKey);
      return new VapiClient({ token: vapiApiKey });
    } catch (error) {
      // Error decrypting Vapi key
      throw new Error('Failed to decrypt Vapi API key');
    }
  }

  static async createInboundCall(request: VapiInboundCallRequest): Promise<VapiCallResponse> {
    try {
      const vapiClient = await this.getVapiClient(request.tenantId);
      
      // Get tenant configuration
      const supabaseAdmin = createAdminClient();
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('vapi_assistant_id')
        .eq('id', request.tenantId)
        .single();

      if (tenantError || !tenant || !tenant.vapi_assistant_id) {
        throw new Error('No Vapi assistant configured for this tenant');
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = request.fromNumber.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Invalid phone number format');
      }

      // Create inbound call via Vapi SDK
      const callData: Vapi.CreateCallDto = {
        assistantId: tenant.vapi_assistant_id,
        customer: {
          number: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
        },
        // Note: Vapi SDK doesn't support metadata in CreateCallDto
        // We'll store this information in our database instead
      };

      const vapiCall = await vapiClient.calls.create(callData);

      // Vapi SDK returns a Call object directly
      return {
        id: (vapiCall as any).id || 'unknown',
        status: (vapiCall as any).status || 'queued',
        toNumber: cleanPhone,
        assistantId: tenant.vapi_assistant_id,
        tenantId: request.tenantId
      };
    } catch (error) {
      if (error instanceof VapiError) {
        // Vapi API error
        throw new Error(`Vapi API error: ${error.message} (Status: ${error.statusCode})`);
      }
      throw error;
    }
  }

  static async getCall(tenantId: string, callId: string): Promise<any> {
    try {
      const vapiClient = await this.getVapiClient(tenantId);
      return await vapiClient.calls.get(callId);
    } catch (error) {
      if (error instanceof VapiError) {
        // Vapi API error
        throw new Error(`Vapi API error: ${error.message} (Status: ${error.statusCode})`);
      }
      throw error;
    }
  }

  static async listCalls(tenantId: string, limit: number = 50): Promise<any[]> {
    try {
      const vapiClient = await this.getVapiClient(tenantId);
      const response = await vapiClient.calls.list({ limit });
      return response || [];
    } catch (error) {
      if (error instanceof VapiError) {
        // Vapi API error
        throw new Error(`Vapi API error: ${error.message} (Status: ${error.statusCode})`);
      }
      throw error;
    }
  }

  static async getAssistant(tenantId: string, assistantId: string): Promise<any> {
    try {
      const vapiClient = await this.getVapiClient(tenantId);
      return await vapiClient.assistants.get(assistantId);
    } catch (error) {
      if (error instanceof VapiError) {
        // Vapi API error
        throw new Error(`Vapi API error: ${error.message} (Status: ${error.statusCode})`);
      }
      throw error;
    }
  }

  static async listAssistants(tenantId: string): Promise<any[]> {
    try {
      const vapiClient = await this.getVapiClient(tenantId);
      const response = await vapiClient.assistants.list();
      return response || [];
    } catch (error) {
      if (error instanceof VapiError) {
        // Vapi API error
        throw new Error(`Vapi API error: ${error.message} (Status: ${error.statusCode})`);
      }
      throw error;
    }
  }

  static async updateAssistant(tenantId: string, assistantId: string, updates: any): Promise<any> {
    try {
      const vapiClient = await this.getVapiClient(tenantId);
      return await vapiClient.assistants.update(assistantId, updates);
    } catch (error) {
      if (error instanceof VapiError) {
        // Vapi API error
        throw new Error(`Vapi API error: ${error.message} (Status: ${error.statusCode})`);
      }
      throw error;
    }
  }
}