import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
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

    // Get current month usage data
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Get calls data for current month (if table exists)
    let calls: Array<{ duration_seconds: number | null; created_at: string }> = []
    try {
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('duration_seconds, created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

      if (callsError) {
        // Error fetching calls
      } else {
        calls = callsData || []
      }
    } catch (error) {
      // Calls table does not exist yet, using empty data
      calls = []
    }

    // Get SMS data for current month (if table exists)
    let smsLogs: Array<{ created_at: string }> = []
    try {
      const { data: smsData, error: smsError } = await supabase
        .from('sms_logs')
        .select('created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

      if (smsError) {
        // Error fetching SMS logs
      } else {
        smsLogs = smsData || []
      }
    } catch (error) {
      // SMS logs table does not exist yet, using empty data
      smsLogs = []
    }

    // Calculate usage metrics
    const totalMinutes = calls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / 60 || 0
    const totalSMS = smsLogs?.length || 0
    
    // TODO: Integrate with billing/subscription service (Stripe, etc.)
    // For now using calculated usage with example limits and pricing
    const runtimeData = {
      current_month: {
        minutes_used: Math.round(totalMinutes),
        minutes_limit: 1000, // Example limit
        sms_sent: totalSMS,
        sms_limit: 500, // Example limit
        cost: Math.round(totalMinutes * 0.05 + totalSMS * 0.01), // Example pricing
        cost_limit: 100 // Example cost limit
      },
      usage_trend: {
        minutes: totalMinutes > 800 ? 'up' : totalMinutes < 200 ? 'down' : 'stable',
        sms: totalSMS > 400 ? 'up' : totalSMS < 100 ? 'down' : 'stable',
        cost: totalMinutes * 0.05 + totalSMS * 0.01 > 80 ? 'up' : totalMinutes * 0.05 + totalSMS * 0.01 < 20 ? 'down' : 'stable'
      },
      alerts_enabled: true, // This would come from company settings
      billing_portal_url: 'https://billing.stripe.com/p/login/test', // Example billing portal
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(runtimeData)
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
