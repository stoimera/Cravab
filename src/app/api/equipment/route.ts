import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    // Fetch equipment for the company using standardized query helper
    const { data: equipment, error } = await executeTenantQuery(
      supabase,
      'equipment',
      (query) => query.select('*').order('created_at', { ascending: false }),
      tenantId
    )

    if (error) {
      return createErrorResponse('Failed to fetch equipment', 500, { tenantId })
    }

    return createSuccessResponse({ equipment })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
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

    // Create new equipment with tenant isolation
    const { data: equipment, error } = await supabase
      .from('equipment')
      .insert({
        ...body,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse('Failed to create equipment', 500, { 
        tenantId, 
        error: error.message 
      })
    }

    return createSuccessResponse({ equipment })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
