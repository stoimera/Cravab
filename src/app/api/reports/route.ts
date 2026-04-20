import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    // If previous value is 0, any current value is 100% increase
    return current > 0 ? 100 : 0
  }
  
  const change = ((current - previous) / previous) * 100
  return Math.round(change * 10) / 10 // Round to 1 decimal place
}

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range based on period
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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Fetch appointments data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, status, created_at, starts_at, ends_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (appointmentsError) {
      return createErrorResponse('Failed to fetch appointments for reports', 500, { 
        tenantId, 
        error: appointmentsError.message 
      })
    }

    // Try to fetch VAPI dashboard data first, fallback to local calls
    let vapiData = null
    try {
      const { config } = await import('@/lib/config')
      const vapiResponse = await fetch(`${config.app.url}/api/vapi/dashboard`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || '',
        }
      })
      
      // VAPI dashboard response status
      
      if (vapiResponse.ok) {
        vapiData = await vapiResponse.json()
        // VAPI dashboard data fetched successfully
      } else {
        const errorText = await vapiResponse.text()
        // VAPI dashboard response not ok
      }
    } catch (error) {
      // VAPI dashboard not available, using local calls data
    }

    // Fetch local calls data as fallback
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, status, created_at, duration_seconds, metadata')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (callsError) {
      return createErrorResponse('Failed to fetch calls for reports', 500, { 
        tenantId, 
        error: callsError.message 
      })
    }

    // Local calls data processed

    // Check if we have any calls at all
    if (!calls || calls.length === 0) {
      // No local calls found in database
    }

    // Fetch clients data for quick stats
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')

    if (clientsError) {
      return createErrorResponse('Failed to fetch clients for reports', 500, { 
        tenantId, 
        error: clientsError.message 
      })
    }

    // Calculate date ranges for this week
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    const endOfWeek = new Date(currentDate)
    endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6)
    startOfWeek.setHours(0, 0, 0, 0)
    endOfWeek.setHours(23, 59, 59, 999)

    // Calculate metrics - use VAPI data if available, otherwise use local calls
    const totalCalls = vapiData?.totalCalls?.value || calls?.length || 0
    
    // Calculate average call time from local data if VAPI data not available
    let localAvgCallTime = 0
    if (!vapiData && calls && calls.length > 0) {
      const callDurations: number[] = calls
        .filter((call: any) => call.duration_seconds && call.duration_seconds > 0)
        .map((call: any) => call.duration_seconds!)
        .filter((duration: any): duration is number => duration !== null)
      localAvgCallTime = callDurations.length > 0
        ? callDurations.reduce((sum, duration) => sum + duration, 0) / callDurations.length / 60 // Convert to minutes
        : 0
    }
    
    const avgCallTime = vapiData?.avgCallTime?.value || localAvgCallTime

    // Calculate this week's appointments
    const thisWeekAppointments = appointments?.filter((apt: any) => {
      const aptDate = new Date(apt.starts_at)
      return aptDate >= startOfWeek && aptDate <= endOfWeek
    }).length || 0


    // Calculate previous period for comparison
    const periodDuration = now.getTime() - startDate.getTime()
    const previousPeriodStart = new Date(startDate.getTime() - periodDuration)
    const previousPeriodEnd = new Date(startDate.getTime())
    
    // Fetch previous period calls data
    const { data: previousCalls } = await supabase
      .from('calls')
      .select('id, duration_seconds, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', previousPeriodEnd.toISOString())
      .order('created_at', { ascending: false })

    const previousPeriodCalls = previousCalls?.length || 0
    
    // Calculate previous period average call time
    const previousCallDurations: number[] = (previousCalls || [])       
      .filter((call: any) => call.duration_seconds && call.duration_seconds > 0)                                                                               
      .map((call: any) => call.duration_seconds!)
      .filter((duration: any): duration is number => duration !== null)
    const previousAvgCallTime = previousCallDurations.length > 0
      ? previousCallDurations.reduce((sum, duration) => sum + duration, 0) / previousCallDurations.length / 60
      : 0

    // Debug logging for percentage calculations (remove in production)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Reports Debug:', {
        period,
        currentPeriod: { start: startDate.toISOString(), end: now.toISOString() },
        previousPeriod: { start: previousPeriodStart.toISOString(), end: previousPeriodEnd.toISOString() },
        currentCalls: totalCalls,
        previousCalls: previousPeriodCalls,
        currentAvgTime: avgCallTime,
        previousAvgTime: previousAvgCallTime
      })
    }

    // Calculate this month's appointments
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    startOfMonth.setHours(0, 0, 0, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    const thisMonthAppointments = appointments?.filter((apt: any) => {
      const aptDate = new Date(apt.starts_at)
      return aptDate >= startOfMonth && aptDate <= endOfMonth
    }).length || 0

    // Calculate this week's new clients
    const thisWeekNewClients = clients?.filter((client: any) => {
      const clientDate = new Date(client.created_at)
      return clientDate >= startOfWeek && clientDate <= endOfWeek
    }).length || 0

    // Calculate calls this day
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const callsToday = calls?.filter((call: any) => {
      const callDate = new Date(call.created_at)
      return callDate >= startOfDay && callDate < endOfDay
    }).length || 0

    // Reports calculations completed

    const reportsData = {
      period,
      lastUpdated: new Date().toISOString(),
      metrics: {
        totalCalls: {
          value: totalCalls,
          change: vapiData?.totalCalls?.change || calculatePercentageChange(totalCalls, previousPeriodCalls),
          trend: vapiData?.totalCalls?.trend || (totalCalls >= previousPeriodCalls ? 'up' : 'down')
        },
        avgCallTime: {
          value: Math.round(avgCallTime * 10) / 10,
          change: vapiData?.avgCallTime?.change || calculatePercentageChange(avgCallTime, previousAvgCallTime),
          trend: vapiData?.avgCallTime?.trend || (avgCallTime >= previousAvgCallTime ? 'up' : 'down')
        }
      },
      quickStats: {
        totalClients: clients?.length || 0,
        thisWeekNewClients: thisWeekNewClients,
        thisWeekAppointments: thisWeekAppointments,
        thisMonthAppointments: thisMonthAppointments,
        callsToday: callsToday
      }
    }

    return createSuccessResponse(reportsData)
  } catch (error) {
    return createErrorResponse('Failed to fetch reports data', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}