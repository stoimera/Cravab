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

    // Get appointments data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        starts_at,
        ends_at,
        duration_minutes,
        created_at,
        clients (
          id,
          first_name,
          last_name,
          phone
        ),
        services (
          id,
          name,
          category,
          base_price
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('starts_at', { ascending: false })

    if (appointmentsError) {
      logger.error('Error fetching appointments:', appointmentsError)
      return createErrorResponse('Failed to fetch appointments data', 500)
    }

    // Calculate appointment analytics
    const totalAppointments = appointments?.length || 0
    const completedAppointments = appointments?.filter((apt: any) => apt.status === 'completed').length || 0
    const cancelledAppointments = appointments?.filter((apt: any) => apt.status === 'cancelled').length || 0
    const noShowAppointments = appointments?.filter((apt: any) => apt.status === 'no_show').length || 0
    const scheduledAppointments = appointments?.filter((apt: any) => apt.status === 'scheduled').length || 0
    const confirmedAppointments = appointments?.filter((apt: any) => apt.status === 'confirmed').length || 0
    
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
    const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0
    const noShowRate = totalAppointments > 0 ? Math.round((noShowAppointments / totalAppointments) * 100) : 0
    
    // Revenue analytics (using services base_price as proxy for now)
    const totalEstimatedRevenue = appointments?.reduce((sum: number, apt: any) => sum + (apt.services?.base_price || 0), 0) || 0
    const totalFinalRevenue = appointments?.reduce((sum: number, apt: any) => sum + (apt.services?.base_price || 0), 0) || 0
    const completedAppointmentsRevenue = appointments
      ?.filter((apt: any) => apt.status === 'completed')
      .reduce((sum: number, apt: any) => sum + (apt.services?.base_price || 0), 0) || 0
    
    // Priority breakdown
    const priorityBreakdown = appointments?.reduce((acc: any, apt: any) => {
      const priority = apt.priority || 'normal'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Service category breakdown
    const serviceCategoryBreakdown = appointments?.reduce((acc: any, apt: any) => {
      const category = apt.services?.category || 'uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Daily appointment volume (last 7 days)
    const dailyAppointmentVolume = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayAppointments = appointments?.filter((apt: any) => {
        const aptDate = new Date(apt.starts_at)
        return aptDate >= dayStart && aptDate <= dayEnd
      }).length || 0
      
      dailyAppointmentVolume.push({
        date: date.toISOString().split('T')[0],
        appointments: dayAppointments
      })
    }
    
    // Upcoming appointments (next 7 days)
    const upcomingStart = new Date(now)
    upcomingStart.setHours(0, 0, 0, 0)
    const upcomingEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    upcomingEnd.setHours(23, 59, 59, 999)
    
    const upcomingAppointments = appointments?.filter((apt: any) => {
      const aptDate = new Date(apt.starts_at)
      return aptDate >= upcomingStart && aptDate <= upcomingEnd &&      
             (apt.status === 'scheduled' || apt.status === 'confirmed') 
    }).length || 0
    
    // Top clients by appointment count
    const clientAppointmentCounts = appointments?.reduce((acc: any, apt: any) => {
      if (apt.clients) {
        const clientId = apt.clients.id
        acc[clientId] = {
          name: `${apt.clients.first_name} ${apt.clients.last_name}`,
          phone: apt.clients.phone,
          count: (acc[clientId]?.count || 0) + 1
        }
      }
      return acc
    }, {} as Record<string, { name: string; phone: string; count: number }>) || {}
    
    const topAppointmentClients = Object.values(clientAppointmentCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    const appointmentAnalytics = {
      overview: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        scheduledAppointments,
        confirmedAppointments,
        completionRate,
        cancellationRate,
        noShowRate,
        upcomingAppointments
      },
      revenue: {
        totalEstimated: totalEstimatedRevenue,
        totalFinal: totalFinalRevenue,
        completedRevenue: completedAppointmentsRevenue
      },
      breakdown: {
        status: {
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          no_show: noShowAppointments,
          scheduled: scheduledAppointments,
          confirmed: confirmedAppointments
        },
        priority: priorityBreakdown,
        serviceCategory: serviceCategoryBreakdown
      },
      trends: {
        dailyVolume: dailyAppointmentVolume
      },
      topClients: topAppointmentClients,
      period,
      lastUpdated: now.toISOString()
    }

    return NextResponse.json(appointmentAnalytics)
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
