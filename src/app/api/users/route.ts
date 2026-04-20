import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { validateUserCreation, handleAuthError } from '@/lib/user-validation'

// GET /api/users - Get all users for the company
export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult

    // Fetch users for the tenant using standardized query helper
    const { data: users, error } = await executeTenantQuery(
      supabase,
      'users',
      (query) => query.select('*').order('created_at', { ascending: false }),
      tenantId
    )

    if (error) {
      return createErrorResponse('Failed to fetch users', 500, { tenantId })
    }

    return createSuccessResponse({ users })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult

    // Parse request body
    const body = await request.json()
    const {
      email,
      first_name,
      last_name,
      phone,
      title,
      role = 'worker',
      permissions = {
        can_manage_clients: true,
        can_manage_appointments: true,
        can_manage_services: false,
        can_manage_users: false,
        can_view_reports: true
      }
    } = body

    // Validate user creation data
    const validation = await validateUserCreation(supabase, { email, first_name, last_name }, tenantId)
    if (!validation.isValid) {
      return validation.error
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'temp_password_123', // User will need to reset this
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        first_name,
        last_name,
        phone,
        title,
        role
      }
    })

    if (authError) {
      return handleAuthError(authError)
    }

    // Create user record in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        tenant_id: tenantId,
        first_name,
        last_name,
        phone,
        title,
        role,
        permissions,
        status: 'active'
      })
      .select()
      .single()

    if (dbError) {
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return createErrorResponse('Failed to create user record', 500, { 
        tenantId, 
        error: dbError.message 
      })
    }

    return createSuccessResponse({ 
      message: 'User created successfully',
      user: dbUser 
    }, 201)
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
