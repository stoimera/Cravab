import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const period = searchParams.get('period') || '30d'

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

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get calls data with detailed analytics
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select(`
        id,
        duration_seconds,
        status,
        direction,
        created_at,
        clients (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false })

    if (callsError) {
      logger.error('Error fetching calls:', callsError)
      return createErrorResponse('Failed to fetch calls data', 500)
    }

    // Calculate detailed analytics
    const totalCalls = calls?.length || 0
    const completedCalls = calls?.filter((call: any) => call.status === 'completed').length || 0
    const inProgressCalls = calls?.filter((call: any) => call.status === 'in_progress').length || 0
    const failedCalls = calls?.filter((call: any) => call.status === 'failed').length || 0
    
    const totalDuration = calls?.reduce((sum: number, call: any) => sum + (call.duration_seconds || 0), 0) || 0
    const avgCallDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls / 60) : 0
    
    const conversionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0
    
    // Call direction breakdown
    const inboundCalls = calls?.filter((call: any) => call.direction === 'inbound').length || 0
    const outboundCalls = calls?.filter((call: any) => call.direction === 'outbound').length || 0
    
    // Daily call volume (last 7 days)
    const dailyVolume = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayCalls = calls?.filter((call: any) => {
        const callDate = new Date(call.created_at)
        return callDate >= dayStart && callDate <= dayEnd
      }).length || 0
      
      dailyVolume.push({
        date: date.toISOString().split('T')[0],
        calls: dayCalls
      })
    }
    
    // Hourly call distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourCalls = calls?.filter((call: any) => {
        const callHour = new Date(call.created_at).getHours()
        return callHour === hour
      }).length || 0
      
      return {
        hour: hour,
        calls: hourCalls
      }
    })
    
    // Top clients by call volume
    const clientCallCounts = calls?.reduce((acc: any, call: any) => {
      if (call.clients) {
        const clientId = call.clients.id
        acc[clientId] = {
          name: `${call.clients.first_name} ${call.clients.last_name}`,
          phone: call.clients.phone,
          count: (acc[clientId]?.count || 0) + 1
        }
      }
      return acc
    }, {} as Record<string, { name: string; phone: string; count: number }>) || {}
    
    const topClients = Object.values(clientCallCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    const analyticsData = {
      overview: {
        totalCalls,
        completedCalls,
        inProgressCalls,
        failedCalls,
        avgCallDuration,
        conversionRate
      },
      breakdown: {
        callTypes: {
          inbound: inboundCalls,
          outbound: outboundCalls
        },
        status: {
          completed: completedCalls,
          in_progress: inProgressCalls,
          failed: failedCalls
        }
      },
      trends: {
        dailyVolume,
        hourlyDistribution
      },
      topClients,
      period,
      lastUpdated: now.toISOString()
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
