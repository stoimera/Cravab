import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

/**
 * CCPA Right to Know - Data Export Endpoint
 * Allows users to request all personal data collected about them
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user, tenantId, supabase } = authResult
    const { email } = await request.json()

    if (!email) {
      return createErrorResponse('Email is required for data export', 400)
    }

    // Verify the email belongs to the requesting user or is authorized
    if (user.email !== email) {
      return createErrorResponse('Unauthorized: Can only export your own data', 403)
    }

    // Collect all personal data
    const personalData = await collectPersonalData(supabase, tenantId, user.id, email)

    // Create export package
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      email: email,
      data_categories: {
        profile: personalData.profile,
        appointments: personalData.appointments,
        calls: personalData.calls,
        audit_logs: personalData.auditLogs,
        preferences: personalData.preferences
      },
      data_retention_info: {
        profile_data: "Retained while account is active",
        appointment_data: "Retained for 7 years for business records",
        call_data: "Retained for 3 years for quality assurance",
        audit_logs: "Retained for 1 year for security purposes"
      },
      third_party_sharing: {
        vapi: "Call transcripts and recordings shared for AI processing",
        twilio: "Phone numbers shared for call routing",
        supabase: "All data stored securely in encrypted database"
      }
    }

    // Log the data export request
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'data_export_requested',
      resource_type: 'privacy',
      resource_id: user.id,
      new_values: { email, export_date: exportData.export_date },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return createSuccessResponse({
      message: 'Data export completed successfully',
      data: exportData,
      download_url: `/api/privacy/download-export/${user.id}` // For future file download
    })

  } catch (error) {
    return createErrorResponse('Failed to export data', 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function collectPersonalData(supabase: any, tenantId: string, userId: string, email: string) {
  // Get user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('tenant_id', tenantId)
    .single()

  // Get appointments data
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, title, description, starts_at, ends_at, status, notes, 
      address, city, state, zip_code, created_at, updated_at
    `)
    .eq('tenant_id', tenantId)
    .or(`created_by.eq.${userId},client_id.in.(${await getClientIdsForUser(supabase, tenantId, email)})`)

  // Get calls data
  const { data: calls } = await supabase
    .from('calls')
    .select(`
      id, direction, from_number, to_number, status, duration_seconds,
      transcript, ai_sentiment, ai_intent, ai_summary, created_at
    `)
    .eq('tenant_id', tenantId)
    .or(`from_number.eq.${email},to_number.eq.${email}`)

  // Get audit logs (limited to user's actions)
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('action, resource_type, resource_id, old_values, new_values, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get user preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  return {
    profile: profile || {},
    appointments: appointments || [],
    calls: calls || [],
    auditLogs: auditLogs || [],
    preferences: preferences || []
  }
}

async function getClientIdsForUser(supabase: any, tenantId: string, email: string) {
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email', email)
  
  return clients?.map((c: any) => c.id).join(',') || ''
}
