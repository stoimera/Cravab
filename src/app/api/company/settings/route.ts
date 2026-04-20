import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    // Get company/tenant data
    const { data: company, error: companyError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (companyError || !company) {
      return createErrorResponse('Company not found', 404)
    }

    return NextResponse.json({ company })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settingsData = await request.json()

    if (!settingsData.id) {
      return createErrorResponse('Tenant ID is required', 400)
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

    if (companyError || !userCompany || (userCompany as any).tenant_id !== settingsData.id) {
      return createErrorResponse('Forbidden', 403)
    }

    // Update tenant settings
    const { error: updateError } = await (supabase as any)
      .from('tenants')
      .update({
        name: settingsData.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', settingsData.id)

    if (updateError) {
      logger.error('Error updating company settings:', updateError)
      return createErrorResponse('Failed to update settings', 500)
    }

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}