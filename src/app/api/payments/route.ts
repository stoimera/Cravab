import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    // Fetch payments for the company
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoices:invoice_id (
          invoice_number,
          total_amount
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse('Failed to fetch payments', 500)
    }

    return NextResponse.json({ payments })
  } catch (error) {
    return createErrorResponse('Failed to fetch payments', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return createErrorResponse('User not found', 404)
    }

    const tenantId = (userData as any).tenant_id

    // Create new payment
    const { data: payment, error } = await (supabase as any)
      .from('payments')
      .insert({
        ...body,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse('Failed to fetch payments', 500)
    }

    return NextResponse.json({ payment })
  } catch (error) {
    return createErrorResponse('Failed to fetch payments', 500)
  }
}
