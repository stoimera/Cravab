import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { createServiceClient } from '@/lib/supabase/service'
import { withCors } from '@/lib/middleware/cors'

async function getCompanySettings() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    // Get company settings
    const supabaseService = createServiceClient()
    const { data: companySettings, error: companySettingsError } = await supabaseService
      .from('company_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (companySettingsError && companySettingsError.code !== 'PGRST116') {
      return createErrorResponse('Failed to fetch company settings', 500, { tenantId })
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

export const GET = withCors(getCompanySettings)

export async function PUT(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult
    const settingsData = await request.json()

    if (!settingsData.tenant_id) {
      return createErrorResponse('Tenant ID is required', 400)
    }

    // Check if user belongs to the company and has admin role
    const { data: userCompany, error: companyError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (companyError || !userCompany || userCompany.tenant_id !== settingsData.tenant_id) {
      return createErrorResponse('Forbidden', 403, { tenantId })
    }

    if (userCompany.role !== 'admin' && userCompany.role !== 'owner') {
      return createErrorResponse('Insufficient permissions', 403, { tenantId })
    }

    // Update or create company settings
    const supabaseService = createServiceClient()
    const { data: existingSettings } = await supabaseService
      .from('company_settings')
      .select('id')
      .eq('tenant_id', settingsData.tenant_id)
      .single()

    const updateData = {
      tenant_id: settingsData.tenant_id,
      base_address: settingsData.base_address || null,
      base_latitude: settingsData.base_latitude || null,
      base_longitude: settingsData.base_longitude || null,
      service_radius_miles: settingsData.service_radius_miles || 25,
      timezone: settingsData.timezone || 'America/Chicago',
      service_areas: settingsData.service_areas || [],
      updated_at: new Date().toISOString()
    }

    let result
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabaseService
        .from('company_settings')
        .update(updateData)
        .eq('tenant_id', settingsData.tenant_id)
        .select()
        .single()

      if (error) {
        return createErrorResponse('Failed to update settings', 500, { 
          tenantId, 
          error: error.message 
        })
      }
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabaseService
        .from('company_settings')
        .insert(updateData)
        .select()
        .single()

      if (error) {
        return createErrorResponse('Failed to create settings', 500, { 
          tenantId, 
          error: error.message 
        })
      }
      result = data
    }

    return createSuccessResponse({ 
      message: 'Company settings updated successfully',
      company_settings: result
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
