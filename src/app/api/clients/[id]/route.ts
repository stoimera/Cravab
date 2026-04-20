import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { DatabaseService } from '@/lib/database'
import { updateClientSchema } from '@/lib/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult
    const { id } = await params
    
    const client = await DatabaseService.getClient(id)
    return createSuccessResponse(client)
  } catch (error) {
    return createErrorResponse('Failed to fetch client', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

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
    
    const { tenantId } = authResult
    const { id } = await params
    const body = await request.json()
    
    const validatedData = updateClientSchema.parse(body)

    const client = await DatabaseService.updateClient(id, validatedData, tenantId)
    return createSuccessResponse(client)
  } catch (error) {
    return createErrorResponse('Failed to update client', 500, { 
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
    
    const { tenantId } = authResult
    const { id } = await params
    
    await DatabaseService.deleteClient(id)
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse('Failed to delete client', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
