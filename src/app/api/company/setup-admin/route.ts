import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/service'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, email, password } = body

    if (!tenantId || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin()
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Create admin user
    const { data: userData, error: userError } = await supabaseAdmin().auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        role: 'admin',
        name: name
      }
    })

    if (userError) {
      logger.error('Error creating admin user:', userError)
      return NextResponse.json(
        { error: 'Failed to create admin account' },
        { status: 500 }
      )
    }

    // Update tenant with admin info
    const { error: updateError } = await supabaseAdmin()
      .from('tenants')
      .update({ 
        email: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId)

    if (updateError) {
      logger.error('Error updating company status:', updateError)
      // Don't fail the request, just log the error
    }

    // Create user record in users table
    const { error: userRecordError } = await supabaseAdmin()
      .from('users')
      .insert({
        id: userData.user.id,
        email: email,
        tenant_id: tenantId,
        first_name: userData.user.user_metadata?.first_name || 'Admin',
        last_name: userData.user.user_metadata?.last_name || 'User',
        role: 'admin'
      })

    if (userRecordError) {
      logger.error('Error creating user record:', userRecordError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully'
    })

  } catch (error) {
    logger.error('Error in admin setup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
