import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
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

    // Get clients data
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        status,
        created_at
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (clientsError) {
      logger.error('Error fetching clients:', clientsError)
      return createErrorResponse('Failed to fetch clients data', 500)
    }

    // Get calls data for client activity
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select(`
        id,
        client_id,
        duration_seconds,
        status,
        created_at,
        clients (
          id,
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())

    if (callsError) {
      logger.error('Error fetching calls:', callsError)
    }

    // Get appointments data for client activity
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        status,
        starts_at,
        created_at,
        clients (
          id,
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())

    if (appointmentsError) {
      logger.error('Error fetching appointments:', appointmentsError)
    }

    // Calculate client analytics
    const totalClients = clients?.length || 0
    const activeClients = clients?.filter((client: any) => client.status === 'active').length || 0
    const inactiveClients = clients?.filter((client: any) => client.status === 'inactive').length || 0
    const newClients = clients?.filter((client: any) =>
      new Date(client.created_at) >= startDate
    ).length || 0

    // Client activity analysis
    const clientActivity = clients?.map((client: any) => {
      const clientCalls = calls?.filter((call: any) => call.client_id === client.id) || []
      const clientAppointments = appointments?.filter((apt: any) => apt.client_id === client.id) || []
      
      const totalCalls = clientCalls.length
      const completedCalls = clientCalls.filter((call: any) => call.status === 'completed').length
      const totalAppointments = clientAppointments.length
      const completedAppointments = clientAppointments.filter((apt: any) => apt.status === 'completed').length
      
      return {
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone,
        status: client.status,
        created_at: client.created_at,
        totalCalls,
        completedCalls,
        totalAppointments,
        completedAppointments,
        totalValue: totalCalls + totalAppointments, // Simplified value calculation
        activityScore: totalCalls + totalAppointments
      }
    }) || []

    // Top clients by revenue
    const topRevenueClients = clientActivity
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 10)

    // Top clients by activity
    const topActiveClients = clientActivity
      .sort((a: any, b: any) => b.activityScore - a.activityScore)
      .slice(0, 10)

    // Geographic distribution (simplified - using address field)
    const geographicDistribution = clients?.reduce((acc: any, client: any) => {   
      const location = client.address || 'Unknown'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Client acquisition over time (last 30 days)
    const acquisitionTrend = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayClients = clients?.filter((client: any) => {
        const clientDate = new Date(client.created_at)
        return clientDate >= dayStart && clientDate <= dayEnd
      }).length || 0
      
      acquisitionTrend.push({
        date: date.toISOString().split('T')[0],
        newClients: dayClients
      })
    }

    // Client lifetime value analysis
    const clientLTV = clientActivity.map(client => ({
      id: client.id,
      name: client.name,
      totalValue: client.totalValue,
      monthsActive: Math.max(1, Math.ceil(
        (now.getTime() - new Date(client.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
      )),
      monthlyValue: client.totalValue / Math.max(1, Math.ceil(
        (now.getTime() - new Date(client.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
      ))
    }))

    const avgLTV = clientLTV.length > 0 
      ? clientLTV.reduce((sum, client) => sum + client.totalValue, 0) / clientLTV.length 
      : 0

    const clientAnalytics = {
      overview: {
        totalClients,
        activeClients,
        inactiveClients,
        newClients,
        avgLTV: Math.round(avgLTV)
      },
      distribution: {
        status: {
          active: activeClients,
          inactive: inactiveClients
        },
        geographic: geographicDistribution
      },
      topClients: {
        byRevenue: topRevenueClients,
        byActivity: topActiveClients
      },
      trends: {
        acquisition: acquisitionTrend
      },
      period,
      lastUpdated: now.toISOString()
    }

    return NextResponse.json(clientAnalytics)
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
