import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
// Temporary endpoint to fix missing user records
export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult
    const supabaseService = createServiceClient()

    // Check if user already exists in users table
    const { data: existingUser, error: existingUserError } = await supabaseService
      .from('users')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      // Error checking existing user
      return createErrorResponse('Database error checking user', 500)
    }

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists in database',
        user: existingUser
      })
    }

    // Get tenant_id from user metadata or create a default one
    let userTenantId = user.user_metadata?.tenant_id

    if (!userTenantId) {
      // Create a default tenant for this user
      const { data: newTenant, error: tenantError } = await supabaseService
        .from('tenants')
        .insert({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'My Company',
          slug: user.email?.split('@')[0]?.toLowerCase() || 'my-company',
          email: user.email,
          status: 'active'
        })
        .select('id')
        .single()

      if (tenantError) {
        // Error creating tenant
        return createErrorResponse('Failed to create tenant', 500)
      }

      userTenantId = newTenant.id

      // Update user metadata with tenant_id
      await supabaseService.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          tenant_id: userTenantId
        }
      })
    }

    // Create user record in users table
    const { data: newUser, error: userRecordError } = await supabaseService
      .from('users')
      .insert({
        id: user.id!,
        email: user.email!,
        tenant_id: userTenantId,
        first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User',
        last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Name',
        role: user.user_metadata?.role || 'admin',
        is_active: true,
        status: 'active'
      })
      .select()
      .single()

    if (userRecordError) {
      // Error creating user record
      return createErrorResponse('Failed to create user record', 500)
    }

    return NextResponse.json({ 
      message: 'User record created successfully',
      user: newUser,
      tenant_id: tenantId
    })

  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
