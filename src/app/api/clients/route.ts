import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { DatabaseService } from '@/lib/database'
import { createClientSchema } from '@/lib/schemas'

export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId } = authResult

    const clients = await DatabaseService.getClients(tenantId)
    return createSuccessResponse(clients)
  } catch (error) {
    return createErrorResponse('Failed to fetch clients', 500, { 
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

    // Validate tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single()
    
    if (tenantError || !tenant) {
      return createErrorResponse('Invalid company configuration', 400, { 
        tenantId, 
        error: tenantError?.message 
      })
    }

    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    const client = await DatabaseService.createClient(validatedData, tenantId)
    return createSuccessResponse(client, 201)
  } catch (error) {
    return createErrorResponse('Failed to create client', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
