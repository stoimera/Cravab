import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { DatabaseService } from '@/lib/database'
import { createAppointmentSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let appointments
    if (startDate && endDate) {
      appointments = await DatabaseService.getAppointmentsByDateRange(
        tenantId,
        startDate,
        endDate
      )
    } else {
      appointments = await DatabaseService.getAppointments(tenantId)
    }

    return createSuccessResponse({ appointments })
  } catch (error) {
    return createErrorResponse('Failed to fetch appointments', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    // Use the authenticated server-side Supabase client directly
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({ ...validatedData, tenant_id: tenantId })
      .select()
      .single()
    
      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`)
      }
    
    return createSuccessResponse(appointment, 201)
  } catch (error) {
    logger.error('Appointment creation error:', error)
    return createErrorResponse('Failed to create appointment', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    const body = await request.json()
    const { id, status, ...otherUpdates } = body

    if (!id) {
      return createErrorResponse('Appointment ID is required', 400)
    }

    // Validate status if provided
    const validStatuses = ['scheduled', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return createErrorResponse('Invalid status', 400)
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
    }

    // Add other updates if provided
    Object.keys(otherUpdates).forEach(key => {
      if (otherUpdates[key] !== undefined) {
        updateData[key] = otherUpdates[key]
      }
    })

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId) // Ensure user can only update their tenant's appointments
      .select()
      .single()

    if (updateError) {
      return createErrorResponse('Failed to update appointment', 500, { 
        tenantId, 
        error: updateError.message 
      })
    }

    if (!updatedAppointment) {
      return createErrorResponse('Appointment not found', 404, { tenantId })
    }

    return createSuccessResponse(updatedAppointment)
  } catch (error) {
    return createErrorResponse('Failed to update appointment', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}