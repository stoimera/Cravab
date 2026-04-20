import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/service'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, supabase } = authResult

    // Check if the user has admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return createErrorResponse('Admin access required', 403, { userId: user.id })
    }

    const body = await request.json()
    const {
      companyName,
      contactName,
      email,
      phone,
      address,
      businessType
    } = body

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Note: Vapi API keys are now stored per-tenant in tenants table

    // Create tenant in database
    const tenantData: any = {
      name: companyName
    }
    
    // Add business_type if provided
    if (businessType) {
      tenantData.business_type = businessType
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin()
      .from('tenants')
      .insert(tenantData)
      .select('id, name')
      .single()

    // Also create company_settings with industry if business_type was provided
    if (tenant && businessType) {
      await supabaseAdmin()
        .from('company_settings')
        .insert({
          tenant_id: tenant.id,
          industry: businessType
        })
        .select()
        .single()
    }

    if (tenantError || !tenant) {
      logger.error('Error creating tenant:', tenantError)
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      )
    }

    // TODO: Implement email notification system
    // Send invitation email to tenant contact
    // Tenant created successfully

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant?.id,
        name: tenant?.name
      }
    })

  } catch (error) {
    logger.error('Error in company creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Verify admin authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get all tenants
    const { data: tenants, error } = await supabaseAdmin()
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching tenants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tenants })

  } catch (error) {
    logger.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateTemporaryPassword(): string {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
