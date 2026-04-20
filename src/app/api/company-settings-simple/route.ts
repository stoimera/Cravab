import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from headers or query params
    const tenantId = request.headers.get('X-Tenant-ID') || 
                    request.nextUrl.searchParams.get('tenant_id')

    if (!tenantId) {
      return createErrorResponse('Tenant ID is required', 400)
    }

    // Use regular client with cookies
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get company settings
    const { data: companySettings, error: companySettingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (companySettingsError && companySettingsError.code !== 'PGRST116') {
      return createErrorResponse('Failed to fetch company settings', 500, { 
        tenantId, 
        error: companySettingsError.message 
      })
    }

    // If no company settings exist, return default structure
    const settings = companySettings || {
      tenant_id: tenantId,
      base_address: null,
      base_latitude: null,
      base_longitude: null,
      service_radius_miles: 25,
      timezone: 'America/Chicago',
      service_areas: []
    }

    return createSuccessResponse({ company_settings: settings })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
      'Access-Control-Allow-Credentials': 'true',
    }
  })
}
