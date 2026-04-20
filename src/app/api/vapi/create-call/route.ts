import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
/**
 * This route handles inbound calls only.
 * When a call comes in via Twilio, it gets forwarded to Vapi for AI handling.
 * Each tenant has their own Vapi API key and Assistant ID configured.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenant_id, from_number, to_number, call_sid } = await request.json();

    // Validate input
    if (!tenant_id || !from_number || !to_number) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, from_number, to_number' },
        { status: 400 }
      );
    }

    // Get tenant configuration (Vapi API key and Assistant ID)
    const supabaseAdmin = createAdminClient();
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, vapi_api_key_encrypted, vapi_assistant_id, twilio_phone_number')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Check if tenant has Vapi configured
    if (!tenant.vapi_api_key_encrypted || !tenant.vapi_assistant_id) {
      return createSuccessResponse({ 
        error: 'Vapi not configured for this tenant. Please add Vapi API key and Assistant ID.' 
      }, 400);
    }

    // Verify the to_number matches the tenant's Twilio phone number
    if (tenant.twilio_phone_number && to_number !== tenant.twilio_phone_number) {
      return createSuccessResponse({ 
        error: 'Invalid phone number for this tenant' 
      }, 400);
    }

    // Store the inbound call in database
    const { data: callRecord, error: callError } = await supabaseAdmin
      .from('calls')
      .insert({
        tenant_id: tenant_id,
        direction: 'inbound',
        from_number: from_number,
        to_number: to_number,
        status: 'ringing',
        metadata: {
          twilio_call_sid: call_sid,
          tenant_name: tenant.name,
          created_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (callError) {
      // Error storing call record
      return createSuccessResponse({ 
        error: 'Failed to store call record' 
      }, 500);
    }

    // Log usage
    await supabaseAdmin
      .from('usage_logs')
      .insert({
        tenant_id: tenant_id,
        feature: 'inbound_call',
        usage_amount: 1,
        unit: 'call',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      call: {
        id: callRecord.id,
        tenant_id: tenant_id,
        direction: 'inbound',
        from_number: from_number,
        to_number: to_number,
        status: 'ringing'
      },
      message: 'Inbound call recorded successfully. Vapi will handle the call via Twilio webhook.'
    });

  } catch (error) {
    // Create inbound call error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get calls for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const call_id = searchParams.get('call_id');

    if (!tenant_id) {
      return createErrorResponse('tenant_id required', 400);
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Verify user belongs to tenant
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData || (userData as any).tenant_id !== tenant_id) {
      return createErrorResponse('Access denied', 403);
    }

    // Get calls for tenant
    let query = supabase
      .from('calls')
      .select(`
        id,
        vapi_call_id,
        direction,
        from_number,
        to_number,
        status,
        duration_seconds,
        created_at,
        updated_at,
        metadata
      `)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (call_id) {
      query = query.eq('vapi_call_id', call_id);
    } else {
      query = query.limit(50); // Limit to recent 50 calls
    }

    const { data: calls, error: callsError } = await query;

    if (callsError) {
      // Error fetching calls
      return createErrorResponse('Failed to fetch calls', 500);
    }

    return NextResponse.json({
      calls: calls || [],
      count: calls?.length || 0
    });

  } catch (error) {
    // Get calls error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}