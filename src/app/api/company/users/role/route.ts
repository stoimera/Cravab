import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function PUT(request: NextRequest) {
  try {
    const { user_id, role, tenant_id } = await request.json()

    if (!user_id || !role || !tenant_id) {
      return createErrorResponse('User ID, role, and tenant_id are required', 400)
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
      .select('role')
      .eq('id', user.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (companyError || !userCompany || !['owner', 'manager'].includes((userCompany as any).role)) {
      return createErrorResponse('Forbidden', 403)
    }

    // Update user role
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ role })
      .eq('id', user_id)
      .eq('tenant_id', tenant_id)

    if (updateError) {
      logger.error('Error updating user role:', updateError)
      return createErrorResponse('Failed to update role', 500)
    }

    return NextResponse.json({ message: 'Role updated successfully' })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
