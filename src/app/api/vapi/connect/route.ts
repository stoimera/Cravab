import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { VapiClient, VapiError } from '@vapi-ai/server-sdk';
import { decryptText } from '@/lib/crypto';


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
/**
 * This route handles the actual Vapi integration for inbound calls.
 * It creates a Vapi call using the tenant's configured API key and Assistant ID.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const from = searchParams.get('from');
    const call_sid = searchParams.get('call_sid');

    if (!tenant_id || !from) {
      return new NextResponse(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">We're sorry, there was an error processing your call. Please try again later.</Say>
          <Hangup/>
        </Response>
      `, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Get tenant configuration
    const supabaseAdmin = createAdminClient();
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, vapi_api_key_encrypted, vapi_assistant_id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant || !tenant.vapi_api_key_encrypted || !tenant.vapi_assistant_id) {
      // Tenant or Vapi configuration not found
      return new NextResponse(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">We're sorry, our AI assistant is not available right now. Please try again later.</Say>
          <Hangup/>
        </Response>
      `, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Decrypt Vapi API key
    const { config } = await import('@/lib/config');
    const masterKey = config.security.masterEncryptionKey;
    
    if (!masterKey) {
      return new NextResponse(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">We're sorry, there was a configuration error. Please try again later.</Say>
          <Hangup/>
        </Response>
      `, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    let vapiApiKey: string;
    try {
      vapiApiKey = decryptText(tenant.vapi_api_key_encrypted, masterKey);
    } catch (error) {
      // Error decrypting Vapi key
      return new NextResponse(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">We're sorry, there was a configuration error. Please try again later.</Say>
          <Hangup/>
        </Response>
      `, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Create Vapi client
    const vapiClient = new VapiClient({ token: vapiApiKey });

    try {
      // Create Vapi call for inbound call
      const vapiCall = await vapiClient.calls.create({
        assistantId: tenant.vapi_assistant_id,
        customer: {
          number: from
        }
      });

      // Update our call record with Vapi call ID
      const vapiCallId = 'id' in vapiCall ? vapiCall.id : null;
      if (vapiCallId && call_sid) {
        await supabaseAdmin
          .from('calls')
          .update({
            vapi_call_id: vapiCallId,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', tenant_id)
          .eq('metadata->>twilio_call_sid', call_sid);
      }

      // Return TwiML that connects to Vapi
      // Note: This is a simplified approach. In production, you'd use Vapi's Twilio integration
      return new NextResponse(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Connecting you to our AI assistant now. Please hold.</Say>
          <Hangup/>
        </Response>
      `, {
        headers: { 'Content-Type': 'text/xml' }
      });

    } catch (error) {
      // Vapi call creation error
      
      if (error instanceof VapiError) {
        // Vapi API Error
      }

      return new NextResponse(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">We're sorry, our AI assistant is not available right now. Please try again later.</Say>
          <Hangup/>
        </Response>
      `, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

  } catch (error) {
    // Vapi connect error
    return new NextResponse(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">We're sorry, there was an error processing your call. Please try again later.</Say>
        <Hangup/>
      </Response>
    `, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
