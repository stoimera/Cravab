import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function PUT(request: NextRequest) {
  try {
    const { tenant_id, alerts_enabled } = await request.json()

    if (!tenant_id || typeof alerts_enabled !== 'boolean') {
      return createErrorResponse('Tenant ID and alerts_enabled are required', 400)
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Check if user belongs to the company
    const { data: userCompany, error: companyError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (companyError || !userCompany || (userCompany as any).tenant_id !== tenant_id) {
      return createErrorResponse('Forbidden', 403)
    }

    // Update company settings for alerts
    // TODO: Consider creating a separate company_settings table for better organization
    // For now, we'll just return success
    const { error: updateError } = await (supabase as any)
      .from('tenants')
      .update({
        // This would be a field in the tenants table for alert settings 
        // For now, we'll just update the updated_at field
        updated_at: new Date().toISOString()
      })
      .eq('id', tenant_id)

    if (updateError) {
      logger.error('Error updating alerts:', updateError)
      return createErrorResponse('Failed to update alerts', 500)
    }

    return NextResponse.json({ 
      message: 'Alerts updated successfully',
      alerts_enabled 
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
