import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return createErrorResponse('Tenant ID is required', 400)
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Check if user belongs to the company
    const { data: userCompany, error: companyError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (companyError || !userCompany || (userCompany as any).tenant_id !== tenantId) {
      return createErrorResponse('Forbidden', 403)
    }

    // Get all users in the company
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        last_login,
        created_at,
        invitation_expires_at
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    logger.debug('Raw users data:', users)
    logger.debug('Users error:', usersError)

    if (usersError) {
      logger.error('Error fetching users:', usersError)
      return createErrorResponse('Failed to fetch users', 500)
    }

    // Format the response
    const formattedUsers = users?.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name',
      role: user.role,
      status: user.is_active ? 'active' : 'pending',
      last_login: user.last_login,
      created_at: user.created_at,
      invitation_expires_at: user.invitation_expires_at
    })) || []

    logger.debug('Formatted users:', formattedUsers)

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
