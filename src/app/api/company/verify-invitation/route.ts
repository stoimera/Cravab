import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/service'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const token = searchParams.get('token')

    if (!tenantId || !token) {
      return NextResponse.json(
        { error: 'Missing tenant ID or token' },
        { status: 400 }
      )
    }

    // Verify the tenant exists and is active
    const { data: tenant, error: tenantError } = await supabaseAdmin()
      .from('tenants')
      .select('id, name, email')
      .eq('id', tenantId)
      .eq('status', 'active')
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // TODO: Implement proper token verification system
    // For now, we'll just check if the tenant exists and is active

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email
      }
    })

  } catch (error) {
    logger.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
