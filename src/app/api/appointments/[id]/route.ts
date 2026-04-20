import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { updateAppointmentSchema } from '@/lib/schemas'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'
import { logger } from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Authentication
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const appointmentId = id

    if (!appointmentId) {
      return createErrorResponse('Appointment ID is required', 400)
    }

    const body = await request.json()
    const { appointmentId: bodyAppointmentId, updatedData } = body

    // Validate that the appointment ID in the body matches the URL parameter
    if (bodyAppointmentId !== appointmentId) {
      return createErrorResponse('Appointment ID mismatch', 400)
    }

    // Validate the update data
    const validatedData = updateAppointmentSchema.parse(updatedData)

    // Check if appointment exists and belongs to the tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, tenant_id, client_id, service_id')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return createErrorResponse('Appointment not found', 404, { 
        tenantId, 
        appointmentId 
      })
    }

    // Prepare update data with timestamp
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          phone,
          email,
          address
        ),
        services (
          id,
          name,
          description,
          category,
          base_price,
          hourly_rate,
          estimated_duration_minutes,
          is_emergency_service,
          requires_equipment
        ),
        users (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .single()

    if (updateError) {
      logger.error('Error updating appointment:', updateError)
      return createErrorResponse('Failed to update appointment', 500, { 
        tenantId, 
        appointmentId,
        error: updateError.message 
      })
    }

    if (!updatedAppointment) {
      return createErrorResponse('Appointment not found after update', 404, { 
        tenantId, 
        appointmentId 
      })
    }

    // Invalidate cache after successful update
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: appointmentId,
      warmCache: true
    })

    return createSuccessResponse({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    })

  } catch (error) {
    logger.error('Error in PUT /api/appointments/[id]:', error)
    return createErrorResponse('Failed to update appointment', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Authentication
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const appointmentId = id

    if (!appointmentId) {
      return createErrorResponse('Appointment ID is required', 400)
    }

    // Fetch the appointment with related data
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          phone,
          email,
          address
        ),
        services (
          id,
          name,
          description,
          category,
          base_price,
          hourly_rate,
          estimated_duration_minutes,
          is_emergency_service,
          requires_equipment
        ),
        users (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !appointment) {
      return createErrorResponse('Appointment not found', 404, { 
        tenantId, 
        appointmentId 
      })
    }

    return createSuccessResponse({ appointment })

  } catch (error) {
    logger.error('Error in GET /api/appointments/[id]:', error)
    return createErrorResponse('Failed to fetch appointment', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Authentication
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const appointmentId = id

    if (!appointmentId) {
      return createErrorResponse('Appointment ID is required', 400)
    }

    // Check if appointment exists and belongs to the tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, tenant_id')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return createErrorResponse('Appointment not found', 404, { 
        tenantId, 
        appointmentId 
      })
    }

    // Delete the appointment
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      logger.error('Error deleting appointment:', deleteError)
      return createErrorResponse('Failed to delete appointment', 500, { 
        tenantId, 
        appointmentId,
        error: deleteError.message 
      })
    }

    // Invalidate cache after successful deletion
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: appointmentId,
      warmCache: true
    })

    return createSuccessResponse({
      message: 'Appointment deleted successfully',
      appointmentId
    })

  } catch (error) {
    logger.error('Error in DELETE /api/appointments/[id]:', error)
    return createErrorResponse('Failed to delete appointment', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
