import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { decryptText } from '@/lib/crypto'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    // Get tenant's VAPI configuration
    const supabaseAdmin = createAdminClient()
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('vapi_api_key_encrypted, vapi_assistant_id')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant?.vapi_api_key_encrypted || !tenant?.vapi_assistant_id) {
      return createErrorResponse('VAPI configuration not found', 404, { tenantId })
    }

    // Decrypt VAPI API key
    const { config } = await import('@/lib/config')
    const masterKey = config.security.masterEncryptionKey

    let vapiApiKey: string
    try {
      vapiApiKey = decryptText(tenant.vapi_api_key_encrypted, masterKey)
    } catch (error) {
      return createErrorResponse('Failed to decrypt VAPI API key', 500, { tenantId })
    }

    // Fetch calls from VAPI dashboard
    const vapiResponse = await fetch('https://api.vapi.ai/call', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    logger.debug('VAPI response status:', vapiResponse.status, vapiResponse.statusText)

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text()
      logger.error('VAPI API error:', errorText)
      return createErrorResponse('Failed to fetch VAPI dashboard data', 500, { 
        tenantId,
        status: vapiResponse.status,
        statusText: vapiResponse.statusText,
        error: errorText
      })
    }

    const vapiData = await vapiResponse.json()
    logger.debug('VAPI data received:', JSON.stringify(vapiData, null, 2))

    // Calculate metrics from VAPI data
    const calls = vapiData.data || []
    const totalCalls = calls.length
    logger.debug('VAPI calls count:', totalCalls)
    
    // Calculate average call duration
    const callDurations = calls
      .filter((call: any) => call.duration && call.duration > 0)
      .map((call: any) => call.duration)
    
    const avgCallTime = callDurations.length > 0
      ? callDurations.reduce((sum: number, duration: number) => sum + duration, 0) / callDurations.length / 60 // Convert to minutes
      : 0

    // Calculate this week's calls
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() - now.getDay() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const thisWeekCalls = calls.filter((call: any) => {
      const callDate = new Date(call.createdAt || call.created_at)
      return callDate >= startOfWeek && callDate <= endOfWeek
    }).length

    // Calculate previous week for comparison
    const previousWeekStart = new Date(startOfWeek)
    previousWeekStart.setDate(startOfWeek.getDate() - 7)
    const previousWeekEnd = new Date(endOfWeek)
    previousWeekEnd.setDate(endOfWeek.getDate() - 7)

    const previousWeekCalls = calls.filter((call: any) => {
      const callDate = new Date(call.createdAt || call.created_at)
      return callDate >= previousWeekStart && callDate <= previousWeekEnd
    }).length

    // Calculate trends
    const totalCallsChange = previousWeekCalls > 0 
      ? ((thisWeekCalls - previousWeekCalls) / previousWeekCalls) * 100 
      : 0

    const vapiDashboardData = {
      totalCalls: {
        value: totalCalls,
        change: totalCallsChange,
        trend: totalCallsChange >= 0 ? 'up' : 'down'
      },
      avgCallTime: {
        value: Math.round(avgCallTime * 10) / 10,
        change: 0, // VAPI doesn't provide historical duration data easily
        trend: 'up' as const
      },
      thisWeekCalls,
      lastUpdated: new Date().toISOString()
    }

    return createSuccessResponse(vapiDashboardData)
  } catch (error) {
    return createErrorResponse('Failed to fetch VAPI dashboard data', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
