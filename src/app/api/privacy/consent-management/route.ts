import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

/**
 * CCPA Consent Management Endpoint
 * Tracks and manages user consent for data collection and processing
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user, tenantId, supabase } = authResult
    const { 
      consent_type,
      granted,
      purpose,
      data_categories = [],
      retention_period = "indefinite"
    } = await request.json()

    if (!consent_type || typeof granted !== 'boolean') {
      return createErrorResponse('consent_type and granted are required', 400)
    }

    // Validate consent type
    const validConsentTypes = [
      'data_collection',
      'data_processing', 
      'marketing_communications',
      'analytics_tracking',
      'third_party_sharing',
      'call_recording',
      'location_tracking'
    ]

    if (!validConsentTypes.includes(consent_type)) {
      return createErrorResponse('Invalid consent type', 400)
    }

    // Record consent
    const consentRecord = {
      user_id: user.id,
      tenant_id: tenantId,
      consent_type,
      granted,
      purpose: purpose || getDefaultPurpose(consent_type),
      data_categories,
      retention_period,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      consent_date: new Date().toISOString(),
      expires_at: granted ? calculateExpiryDate(retention_period) : null
    }

    // Store consent record
    const { error: consentError } = await supabase
      .from('consent_records')
      .insert(consentRecord)

    if (consentError) {
      // If table doesn't exist, create it first
      if (consentError.code === 'PGRST116') {
        await createConsentTable(supabase)
        const { error: retryError } = await supabase
          .from('consent_records')
          .insert(consentRecord)
        if (retryError) throw retryError
      } else {
        throw consentError
      }
    }

    // Update user preferences
    await updateUserConsentPreferences(supabase, user.id, tenantId, consent_type, granted)

    // Log consent action
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'consent_updated',
      resource_type: 'privacy',
      resource_id: user.id,
      new_values: {
        consent_type,
        granted,
        purpose,
        consent_date: consentRecord.consent_date
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return createSuccessResponse({
      message: 'Consent recorded successfully',
      consent: consentRecord,
      next_required_consents: getNextRequiredConsents(consent_type)
    })

  } catch (error) {
    return createErrorResponse('Failed to record consent', 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user, tenantId, supabase } = authResult

    // Get all consent records for user
    const { data: consentRecords } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .order('consent_date', { ascending: false })

    // Get current consent summary
    const consentSummary = {
      data_collection: getLatestConsent(consentRecords, 'data_collection'),
      data_processing: getLatestConsent(consentRecords, 'data_processing'),
      marketing_communications: getLatestConsent(consentRecords, 'marketing_communications'),
      analytics_tracking: getLatestConsent(consentRecords, 'analytics_tracking'),
      third_party_sharing: getLatestConsent(consentRecords, 'third_party_sharing'),
      call_recording: getLatestConsent(consentRecords, 'call_recording'),
      location_tracking: getLatestConsent(consentRecords, 'location_tracking')
    }

    return createSuccessResponse({
      consent_summary: consentSummary,
      all_records: consentRecords || [],
      required_consents: getRequiredConsents(),
      last_updated: consentRecords?.[0]?.consent_date || null
    })

  } catch (error) {
    return createErrorResponse('Failed to get consent records', 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function getDefaultPurpose(consentType: string): string {
  const purposes = {
    data_collection: "To provide services and manage appointments",
    data_processing: "To process appointments, calls, and service requests",
    marketing_communications: "To send appointment reminders and service updates",
    analytics_tracking: "To improve our service and user experience",
    third_party_sharing: "To enable AI call processing and phone services",
    call_recording: "To provide quality assurance and training",
    location_tracking: "To determine service area coverage and travel time"
  }
  return purposes[consentType as keyof typeof purposes] || "Service provision"
}

function calculateExpiryDate(retentionPeriod: string): string | null {
  if (retentionPeriod === "indefinite") return null
  
  const now = new Date()
  const periods = {
    "1_year": 365,
    "2_years": 730,
    "3_years": 1095,
    "5_years": 1825
  }
  
  const days = periods[retentionPeriod as keyof typeof periods] || 365
  now.setDate(now.getDate() + days)
  return now.toISOString()
}

function getLatestConsent(records: any[], consentType: string) {
  const record = records?.find(r => r.consent_type === consentType)
  return record ? {
    granted: record.granted,
    date: record.consent_date,
    expires: record.expires_at
  } : { granted: false, date: null, expires: null }
}

function getNextRequiredConsents(currentConsent: string): string[] {
  const allConsents = [
    'data_collection',
    'data_processing', 
    'marketing_communications',
    'analytics_tracking',
    'third_party_sharing',
    'call_recording',
    'location_tracking'
  ]
  
  const currentIndex = allConsents.indexOf(currentConsent)
  return allConsents.slice(currentIndex + 1)
}

function getRequiredConsents(): string[] {
  return [
    'data_collection',
    'data_processing',
    'call_recording'
  ]
}

async function createConsentTable(supabase: any) {
  // This would typically be done via migration, but for simplicity:
  logger.debug('Consent table needs to be created via migration')
}

async function updateUserConsentPreferences(supabase: any, userId: string, tenantId: string, consentType: string, granted: boolean) {
  // Update user preferences with consent status
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('consent_preferences')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single()

  const consentPreferences = {
    ...existing?.consent_preferences,
    [consentType]: granted
  }

  if (existing) {
    await supabase
      .from('user_preferences')
      .update({ consent_preferences: consentPreferences })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
  } else {
    await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        consent_preferences: consentPreferences
      })
  }
}
