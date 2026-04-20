import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { emailService } from '@/lib/email'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const { email, role, tenant_id, worker_type } = await request.json()

    if (!email || !role || !tenant_id) {
      return createErrorResponse('Email, role, and tenant_id are required', 400)
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Check if user is owner or manager
    const { data: userCompany, error: companyError } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (companyError || !userCompany || !['owner', 'manager'].includes((userCompany as any).role)) {
      return createErrorResponse('Forbidden', 403)
    }

    // Get tenant information
    const { data: tenant, error: tenantInfoError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single()

    if (tenantInfoError || !tenant) {
      return createErrorResponse('Tenant not found', 404)
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return createErrorResponse('User already exists', 409)
    }

    // Create pending user record with 7-day expiration
    const { data: newUser, error: createError } = await (supabase as any)
      .from('users')
      .insert({
        email,
        role,
        tenant_id,
        is_active: false, // Use is_active instead of status
        first_name: '',
        last_name: '',
        phone: null,
        title: null,
        permissions: {},
        invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })
      .select('id')
      .single()

    if (createError || !newUser) {
      logger.error('Error creating user invitation:', createError)
      return createErrorResponse('Failed to create invitation', 500)
    }

    // Send invitation email using Resend
    try {
      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?invite=${newUser.id}&company=${tenant_id}`
      
      await emailService.sendUserInvite({
        to: email,
        inviterName: `${(userCompany as any).first_name} ${(userCompany as any).last_name}`.trim() || 'Team Member',
        companyName: (tenant as any).name,
        inviteLink,
        role: role.charAt(0).toUpperCase() + role.slice(1)
      })
    } catch (emailError) {
      logger.error('Resend email error:', emailError)
      // Don't fail the request if email fails - user record is created
    }

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      user: newUser
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
