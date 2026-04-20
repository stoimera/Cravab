import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    // Fetch invoices for the company
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse('Failed to fetch invoices', 500, { 
        tenantId, 
        error: error.message 
      })
    }

    return createSuccessResponse({ invoices })
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

    // Create new invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        ...body,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse('Failed to create invoice', 500, { 
        tenantId, 
        error: error.message 
      })
    }

    return createSuccessResponse({ invoice })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
