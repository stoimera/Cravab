import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { performanceMonitor, QueryTracker } from '@/lib/performance/monitoring'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'

export async function PUT(request: NextRequest) {
  const tracker = new QueryTracker()
  const startTime = Date.now()
  
  try {
    // Authentication
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const { appointmentId, updatedData } = await request.json()

    if (!appointmentId || !updatedData) {
      return createErrorResponse('Appointment ID and updated data are required', 400, { tenantId })
    }

    // Cache is handled by React Query on the client side

    // Start transaction for data consistency
    tracker.incrementQuery()
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('client_id, service_id')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !appointment) {
      return createErrorResponse('Appointment not found', 404, { tenantId, appointmentId })
    }

    // Performance Optimization: Batch all updates in a single transaction
    const updates = []

    // 1. Update appointment (always needed)
    tracker.incrementQuery()
    updates.push(
      supabase
        .from('appointments')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          address: updatedData.address,
          city: updatedData.city,
          state: updatedData.state,
          zip_code: updatedData.zip_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('tenant_id', tenantId)
    )

    // 2. Update client (only if client data changed)
    if (updatedData.clientName || updatedData.clientPhone) {
      const nameParts = updatedData.clientName?.trim().split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      tracker.incrementQuery()
      updates.push(
        supabase
          .from('clients')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: updatedData.clientPhone,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointment.client_id)
          .eq('tenant_id', tenantId)
      )
    }

    // 3. Update service (only if service description changed)
    if (updatedData.serviceDescription && appointment.service_id) {
      tracker.incrementQuery()
      updates.push(
        supabase
          .from('services')
          .update({
            description: updatedData.serviceDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointment.service_id)
          .eq('tenant_id', tenantId)
      )
    }

    // Execute all updates in parallel for maximum performance
    const results = await Promise.all(updates)
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        throw result.error
      }
    }

    // Invalidate cache after successful update
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: appointmentId,
      warmCache: true
    })

    // Record performance metrics
    const duration = Date.now() - startTime
    performanceMonitor.record({
      operation: 'updateAppointment',
      duration,
      success: true,
      queryCount: tracker.getStats().queryCount,
      cacheHits: tracker.getStats().cacheHits,
      cacheMisses: tracker.getStats().cacheMisses
    })

    return createSuccessResponse({
      message: 'Appointment updated successfully',
      appointmentId,
      updatedFields: Object.keys(updatedData),
      performance: {
        duration,
        queryCount: tracker.getStats().queryCount,
        cacheHitRate: tracker.getStats().cacheHitRate
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    // Record error metrics
    performanceMonitor.record({
      operation: 'updateAppointment',
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      queryCount: tracker.getStats().queryCount,
      cacheHits: tracker.getStats().cacheHits,
      cacheMisses: tracker.getStats().cacheMisses
    })

    return createErrorResponse('Failed to update appointment', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
