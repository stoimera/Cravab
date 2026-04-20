import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
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
    
    const { tenantId, supabase } = authResult
    const { id } = await params

    // Fetch specific invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Invoice not found', 404)
      }
      return createErrorResponse('Failed to fetch invoice', 500)
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    return createErrorResponse('Failed to fetch invoice', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { id } = await params

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

    // Update invoice
    const { data: invoice, error } = await (supabase as any)
      .from('invoices')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Invoice not found', 404)
      }
      return createErrorResponse('Failed to fetch invoice', 500)
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    return createErrorResponse('Failed to fetch invoice', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { id } = await params

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

    // Delete invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return createErrorResponse('Failed to fetch invoice', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse('Failed to fetch invoice', 500)
  }
}
