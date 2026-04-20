import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { emailService } from '@/lib/email'

function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, tenant_id } = await request.json()

    if (!user_id || !tenant_id) {
      return createErrorResponse('User ID and tenant ID are required', 400)
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

    // Get the pending user to resend invitation
    const { data: pendingUser, error: pendingError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        tenant_id,
        is_active,
        invitation_expires_at,
        tenants!inner(name)
      `)
      .eq('id', user_id)
      .eq('tenant_id', tenant_id)
      .eq('is_active', false)
      .single()

    if (pendingError || !pendingUser) {
      return createErrorResponse('Pending user not found', 404)
    }

    // Check if invitation is still valid (not expired)
    const now = new Date()
    const expiresAt = new Date((pendingUser as any).invitation_expires_at)
    if (expiresAt < now) {
      return createErrorResponse('Invitation has expired. Please create a new invitation.', 400)
    }

    // Update expiration to 7 days from now
    const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ invitation_expires_at: newExpiration })
      .eq('id', user_id)

    if (updateError) {
      // Error updating invitation expiration
      return createErrorResponse('Failed to update invitation', 500)
    }

    // Send new invitation email
    try {
      const { config } = await import('@/lib/config')
      const inviteLink = `${config.app.url}/auth/invite?invite=${user_id}&company=${tenant_id}`
      
      await emailService.sendUserInvite({
        to: (pendingUser as any).email,
        inviterName: `${(userCompany as any).first_name} ${(userCompany as any).last_name}`.trim() || 'Team Member',
        companyName: (pendingUser as any).tenants.name,
        inviteLink,
        role: (pendingUser as any).role.charAt(0).toUpperCase() + (pendingUser as any).role.slice(1)
      })
    } catch (emailError) {
      // Resend email error
      return createErrorResponse('Failed to send invitation email', 500)
    }

    return NextResponse.json({ 
      message: 'Invitation resent successfully',
      expires_at: newExpiration
    })
  } catch (error) {
    // Resend invitation error
    return createErrorResponse('Internal server error', 500)
  }
}
