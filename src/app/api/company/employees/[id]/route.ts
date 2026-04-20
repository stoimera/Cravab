import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/service'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
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
    
    const { user, tenantId, supabase } = authResult

    // Get user data to check role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user is admin
    if (userData?.role !== 'admin') {
      return createErrorResponse('Forbidden', 403)
    }

    const { id } = await params

    const body = await request.json()
    const { name, email, role } = body

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the employee belongs to the same company
    const { data: employee, error: employeeError } = await supabaseAdmin()
      .from('users')
      .select('tenant_id')
      .eq('id', id)
      .single()

    if (employeeError || !employee) {
      return createErrorResponse('Employee not found', 404)
    }

    if (employee.tenant_id !== tenantId) {
      return createErrorResponse('Forbidden', 403)
    }

    // Update user in Supabase Auth
    const { error: updateError } = await supabaseAdmin().auth.admin.updateUserById(
      id,
      {
        email: email,
        user_metadata: {
          tenant_id: tenantId,
          role: role,
          name: name
        }
      }
    )

    if (updateError) {
      // Error updating user
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Update user record in users table
    const { error: userRecordError } = await supabaseAdmin()
      .from('users')
      .update({
        email: email,
        role: role
      })
      .eq('id', id)

    if (userRecordError) {
      // Error updating user record
      return NextResponse.json(
        { error: 'Failed to update user record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully'
    })

  } catch (error) {
    // Error updating employee
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return createErrorResponse('User not found', 404)
    }

    const tenantId = (userData as any).tenant_id

    // Check if user is admin
    if ((userData as any).role !== 'admin') {
      return createErrorResponse('Forbidden', 403)
    }

    const { id } = await params

    // Don't allow deleting yourself
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Verify the employee belongs to the same company
    const { data: employee, error: employeeError } = await supabaseAdmin()
      .from('users')
      .select('tenant_id')
      .eq('id', id)
      .single()

    if (employeeError || !employee) {
      return createErrorResponse('Employee not found', 404)
    }

    if (employee.tenant_id !== tenantId) {
      return createErrorResponse('Forbidden', 403)
    }

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin().auth.admin.deleteUser(id)

    if (deleteError) {
      // Error deleting user
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    // Delete user record from users table
    const { error: userRecordError } = await supabaseAdmin()
      .from('users')
      .delete()
      .eq('id', id)

    if (userRecordError) {
      // Error deleting user record
      return NextResponse.json(
        { error: 'Failed to delete user record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })

  } catch (error) {
    // Error deleting employee
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
