import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const { id } = await params
    const serviceId = id

    if (!serviceId) {
      return createErrorResponse('Service ID is required', 400)
    }

    const body = await request.json()
    
    // Handle both old and new data formats
    let serviceData
    let bodyServiceId
    
    if (body.serviceId && body.serviceData) {
      // New format: { serviceId, serviceData }
      serviceData = body.serviceData
      bodyServiceId = body.serviceId
    } else {
      // Direct format: service data directly
      serviceData = body
      bodyServiceId = serviceId
    }

    // Validate that the service ID in the body matches the URL parameter
    if (bodyServiceId !== serviceId) {
      return createErrorResponse('Service ID mismatch', 400)
    }

    // Check if service exists and belongs to the tenant
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id, tenant_id')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingService) {
      return createErrorResponse('Service not found', 404, { 
        tenantId, 
        serviceId 
      })
    }

    // Prepare update data with timestamp
    const updateData = {
      ...serviceData,
      updated_at: new Date().toISOString()
    }


    // Update the service
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateError) {
      return createErrorResponse('Failed to update service', 500, { 
        tenantId, 
        serviceId,
        error: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
    }

    if (!updatedService) {
      return createErrorResponse('Service not found after update', 404, { 
        tenantId, 
        serviceId 
      })
    }

    return createSuccessResponse({
      message: 'Service updated successfully',
      service: updatedService
    })

  } catch (error) {
    logger.error('Error in PUT /api/services/[id]:', error)
    return createErrorResponse('Failed to update service', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult
    const { id } = await params
    const serviceId = id

    if (!serviceId) {
      return createErrorResponse('Service ID is required', 400)
    }

    // Check if service exists and belongs to the tenant
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id, tenant_id')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingService) {
      return createErrorResponse('Service not found', 404, { 
        tenantId, 
        serviceId 
      })
    }

    // Delete the service
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      logger.error('Error deleting service:', deleteError)
      return createErrorResponse('Failed to delete service', 500, { 
        tenantId, 
        serviceId,
        error: deleteError.message 
      })
    }

    return createSuccessResponse({
      message: 'Service deleted successfully',
      serviceId
    })

  } catch (error) {
    logger.error('Error in DELETE /api/services/[id]:', error)
    return createErrorResponse('Failed to delete service', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}