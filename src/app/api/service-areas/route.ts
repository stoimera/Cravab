import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    // Get service areas for the tenant
    const supabaseService = createServiceClient()
    const { data: serviceAreas, error: serviceAreasError } = await supabaseService
      .from('service_area_coverage')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (serviceAreasError) {
      logger.error('Error fetching service areas:', serviceAreasError)
      return createErrorResponse('Failed to fetch service areas', 500)
    }

    return NextResponse.json({ service_areas: serviceAreas || [] })      
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceAreaData = await request.json()

    if (!serviceAreaData.tenant_id) {
      return createErrorResponse('Tenant ID is required', 400)
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Check if user belongs to the company and has admin role
    const { data: userCompany, error: companyError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (companyError || !userCompany || (userCompany as any).tenant_id !== serviceAreaData.tenant_id) {
      return createErrorResponse('Forbidden', 403)
    }

    if ((userCompany as any).role !== 'admin' && (userCompany as any).role !== 'owner') {
      return createErrorResponse('Insufficient permissions', 403)
    }

    // Validate required fields
    if (!serviceAreaData.name || !serviceAreaData.center_address || 
        !serviceAreaData.center_latitude || !serviceAreaData.center_longitude) {
      return createSuccessResponse({ 
        error: 'Missing required fields: name, center_address, center_latitude, center_longitude' 
      }, 400)
    }

    // Create service area
    const supabaseService = createServiceClient()
    const { data, error } = await (supabaseService as any)
      .from('service_area_coverage')
      .insert({
        tenant_id: serviceAreaData.tenant_id,
        name: serviceAreaData.name,
        description: serviceAreaData.description || null,
        center_address: serviceAreaData.center_address,
        center_latitude: serviceAreaData.center_latitude,
        center_longitude: serviceAreaData.center_longitude,
        radius_miles: serviceAreaData.radius_miles || 25,
        zip_codes: serviceAreaData.zip_codes || [],
        cities: serviceAreaData.cities || [],
        states: serviceAreaData.states || [],
        countries: serviceAreaData.countries || [],
        is_active: serviceAreaData.is_active !== false
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse('Internal server error', 500)
    }

    return NextResponse.json({ 
      message: 'Service area created successfully',
      service_area: data
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
