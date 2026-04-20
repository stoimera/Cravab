import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/service';
import { encryptText, testEncryption } from '@/lib/crypto';
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const { tenant_id, provider, api_key, assistant_id, phone_number } = await request.json();

    // Validate input
    if (!tenant_id || !provider || !api_key) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, provider, api_key' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['vapi', 'twilio'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "vapi" or "twilio"' },
        { status: 400 }
      );
    }

    // Additional validation based on provider
    if (provider === 'vapi' && !assistant_id) {
      return NextResponse.json(
        { error: 'assistant_id required for Vapi configuration' },
        { status: 400 }
      );
    }

    if (provider === 'twilio' && !phone_number) {
      return NextResponse.json(
        { error: 'phone_number required for Twilio configuration' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Verify user belongs to tenant and has admin/owner role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse('User not found', 404);
    }

    if ((userData as any).tenant_id !== tenant_id) {
      return createErrorResponse('Access denied to this tenant', 403);
    }

    if (!['admin', 'owner'].includes((userData as any).role)) {
      return createErrorResponse('Admin or owner access required', 403);
    }

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Test encryption before storing
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;
    if (!masterKey) {
      return createErrorResponse('Encryption key not configured', 500);
    }

    try {
      await testEncryption(masterKey);
    } catch (error) {
      return createErrorResponse('Encryption system error', 500);
    }

    // Encrypt the API key
    const encryptedKey = encryptText(masterKey, api_key);

    // Prepare update data based on provider
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (provider === 'vapi') {
      updateData.vapi_api_key_encrypted = encryptedKey;
      updateData.vapi_assistant_id = assistant_id;
    } else if (provider === 'twilio') {
      updateData.twilio_phone_number = phone_number;
    }

    // Store configuration in tenants table using service role client
    const { error: updateError } = await supabaseAdmin()
      .from('tenants')
      .update(updateData)
      .eq('id', tenant_id);

    if (updateError) {
      logger.error('Error storing provider configuration:', updateError);
      return createErrorResponse('Failed to store provider configuration', 500);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${provider} configuration updated successfully`,
      tenant_name: (tenant as any).name
    });

  } catch (error) {
    logger.error('Provider key storage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const provider = searchParams.get('provider') || 'vapi';

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

    // Verify user belongs to tenant and has admin/owner role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse('User not found', 404);
    }

    if ((userData as any).tenant_id !== tenant_id) {
      return createErrorResponse('Access denied to this tenant', 403);
    }

    if (!['admin', 'owner'].includes((userData as any).role)) {
      return createErrorResponse('Admin or owner access required', 403);
    }

    // Get tenant info to check provider configuration
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('vapi_api_key_encrypted, vapi_assistant_id, twilio_phone_number, created_at, updated_at')
      .eq('id', tenant_id)
      .single();

    if (tenantError) {
      return createErrorResponse('Failed to fetch tenant info', 500);
    }

    let isConfigured = false;
    let configData: any = {};

    if (provider === 'vapi') {
      isConfigured = !!((tenantData as any).vapi_api_key_encrypted && (tenantData as any).vapi_assistant_id);
      configData = {
        has_api_key: !!(tenantData as any).vapi_api_key_encrypted,
        has_assistant_id: !!(tenantData as any).vapi_assistant_id
      };
    } else if (provider === 'twilio') {
      isConfigured = !!(tenantData as any).twilio_phone_number;
      configData = {
        has_phone_number: !!(tenantData as any).twilio_phone_number
      };
    }

    return NextResponse.json({
      configured: isConfigured,
      provider: provider,
      ...configData,
      created_at: (tenantData as any).created_at,
      updated_at: (tenantData as any).updated_at
    });

  } catch (error) {
    logger.error('Provider key fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { tenant_id, provider } = await request.json();

    if (!tenant_id || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, provider' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Verify user belongs to tenant and has admin/owner role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse('User not found', 404);
    }

    if ((userData as any).tenant_id !== tenant_id) {
      return createErrorResponse('Access denied to this tenant', 403);
    }

    if (!['admin', 'owner'].includes((userData as any).role)) {
      return createErrorResponse('Admin or owner access required', 403);
    }

    // Clear provider configuration from tenants table using service role client
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (provider === 'vapi') {
      updateData.vapi_api_key_encrypted = null;
      updateData.vapi_assistant_id = null;
    } else if (provider === 'twilio') {
      updateData.twilio_phone_number = null;
    }

    const { error: deleteError } = await supabaseAdmin()
      .from('tenants')
      .update(updateData)
      .eq('id', tenant_id);

    if (deleteError) {
      logger.error('Error deleting provider configuration:', deleteError);
      return createErrorResponse('Failed to delete provider configuration', 500);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${provider} configuration deleted successfully` 
    });

  } catch (error) {
    logger.error('Provider key deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
