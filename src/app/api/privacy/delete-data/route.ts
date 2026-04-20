import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

/**
 * CCPA Right to Delete - Data Deletion Endpoint
 * Allows users to request deletion of their personal data
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user, tenantId, supabase } = authResult
    const { email, confirmation } = await request.json()

    if (!email || !confirmation) {
      return createErrorResponse('Email and confirmation are required for data deletion', 400)
    }

    if (confirmation !== 'DELETE_MY_DATA') {
      return createErrorResponse('Invalid confirmation. Must type "DELETE_MY_DATA"', 400)
    }

    // Verify the email belongs to the requesting user
    if (user.email !== email) {
      return createErrorResponse('Unauthorized: Can only delete your own data', 403)
    }

    // Check if user is the only admin (prevent deletion if they're the last admin)
    const { data: adminCount } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'admin')
      .neq('id', user.id)

    if (adminCount && adminCount.length === 0) {
      return createErrorResponse('Cannot delete data: You are the only admin. Transfer admin role first.', 400)
    }

    // Start data deletion process
    const deletionResults = await deletePersonalData(supabase, tenantId, user.id, email)

    // Log the data deletion request
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'data_deletion_requested',
      resource_type: 'privacy',
      resource_id: user.id,
      new_values: { 
        email, 
        deletion_date: new Date().toISOString(),
        deleted_tables: Object.keys(deletionResults)
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return createSuccessResponse({
      message: 'Data deletion completed successfully',
      deleted_data: deletionResults,
      retention_note: 'Some business records may be retained for legal compliance'
    })

  } catch (error) {
    return createErrorResponse('Failed to delete data', 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function deletePersonalData(supabase: any, tenantId: string, userId: string, email: string) {
  const results: Record<string, number> = {}

  try {
    // Delete user preferences
    const { count: prefsCount } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
    results.user_preferences = prefsCount || 0

    // Delete audit logs for this user
    const { count: auditCount } = await supabase
      .from('audit_logs')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
    results.audit_logs = auditCount || 0

    // Anonymize appointments (keep for business records but remove personal data)
    const { count: apptCount } = await supabase
      .from('appointments')
      .update({
        title: '[DELETED USER]',
        description: '[Personal data deleted]',
        notes: '[Personal data deleted]',
        created_by: null
      })
      .eq('created_by', userId)
      .eq('tenant_id', tenantId)
    results.appointments_anonymized = apptCount || 0

    // Anonymize calls (keep for business records but remove personal data)
    const { count: callsCount } = await supabase
      .from('calls')
      .update({
        transcript: '[Personal data deleted]',
        ai_summary: '[Personal data deleted]',
        follow_up_notes: '[Personal data deleted]'
      })
      .or(`from_number.eq.${email},to_number.eq.${email}`)
      .eq('tenant_id', tenantId)
    results.calls_anonymized = callsCount || 0

    // Delete user account (this will cascade to other tables due to foreign keys)
    const { count: userCount } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId)
    results.user_account = userCount || 0

    // Note: We don't delete the entire tenant or business records
    // as these may be needed for legal compliance

  } catch (error) {
    logger.error('Error during data deletion:', error)
    throw error
  }

  return results
}
