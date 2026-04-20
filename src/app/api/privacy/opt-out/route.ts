import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

/**
 * CCPA Right to Opt-Out - Data Sales Opt-Out Endpoint
 * Allows users to opt out of data sales and certain data processing
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user, tenantId, supabase } = authResult
    const { 
      opt_out_data_sales = false,
      opt_out_marketing = false,
      opt_out_analytics = false,
      opt_out_third_party_sharing = false
    } = await request.json()

    // Get or create user preferences
    let { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    const privacySettings = {
      data_sales_opted_out: opt_out_data_sales,
      marketing_opted_out: opt_out_marketing,
      analytics_opted_out: opt_out_analytics,
      third_party_sharing_opted_out: opt_out_third_party_sharing,
      opt_out_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }

    if (preferences) {
      // Update existing preferences
      const { error } = await supabase
        .from('user_preferences')
        .update({
          privacy_settings: {
            ...preferences.privacy_settings,
            ...privacySettings
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', preferences.id)

      if (error) throw error
    } else {
      // Create new preferences
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          tenant_id: tenantId,
          privacy_settings: privacySettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    }

    // Log the opt-out request
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'privacy_opt_out',
      resource_type: 'privacy',
      resource_id: user.id,
      new_values: privacySettings,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return createSuccessResponse({
      message: 'Privacy preferences updated successfully',
      settings: privacySettings,
      effective_date: new Date().toISOString()
    })

  } catch (error) {
    return createErrorResponse('Failed to update privacy preferences', 500, {
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

    // Get current privacy preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('privacy_settings')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    const currentSettings = preferences?.privacy_settings || {
      data_sales_opted_out: false,
      marketing_opted_out: false,
      analytics_opted_out: false,
      third_party_sharing_opted_out: false
    }

    return createSuccessResponse({
      current_settings: currentSettings,
      data_usage_info: {
        data_sales: "We do not sell personal data to third parties",
        marketing: "Used for appointment reminders and service updates",
        analytics: "Used to improve our service and user experience",
        third_party_sharing: "Limited to VAPI (AI calls) and Twilio (phone services)"
      }
    })

  } catch (error) {
    return createErrorResponse('Failed to get privacy preferences', 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
