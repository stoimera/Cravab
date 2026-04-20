import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const { id } = await params

    // Fetch the specific user
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('User not found', 404, { tenantId })
      }
      return createErrorResponse('Failed to fetch user', 500, { tenantId, error: error.message })
    }

    return createSuccessResponse({ user: userData })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const { id } = await params

    // Parse request body
    const body = await request.json()
    const {
      first_name,
      last_name,
      phone,
      title,
      role,
      permissions,
      status
    } = body

    // Update user
    const { data: userData, error } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        phone,
        title,
        role,
        permissions,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('User not found', 404, { tenantId })
      }
      return createErrorResponse('Failed to update user', 500, { tenantId, error: error.message })
    }

    return createSuccessResponse({ 
      message: 'User updated successfully',
      user: userData 
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult
    const { id } = await params

    // Check if user is trying to delete themselves
    if (user.id === id) {
      return createErrorResponse('Cannot delete your own account', 400, { tenantId })
    }

    // Delete user from database
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (dbError) {
      return createErrorResponse('Failed to delete user', 500, { tenantId, error: dbError.message })
    }

    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    
    if (authError) {
      logger.error('Error deleting user from auth:', authError)
      // Don't fail the request since the database record is already deleted
    }

    return createSuccessResponse({ message: 'User deleted successfully' })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
