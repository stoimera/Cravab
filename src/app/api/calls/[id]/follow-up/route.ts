import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'

export async function PATCH(
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
    const callId = id

    if (!callId) {
      return createErrorResponse('Call ID is required', 400)
    }

    const body = await request.json()
    const { follow_up_required, follow_up_notes, follow_up_completed_at } = body

    // Validate input
    if (follow_up_required !== undefined && typeof follow_up_required !== 'boolean') {
      return createErrorResponse('follow_up_required must be a boolean', 400)
    }

    // Check if call exists and belongs to tenant
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('id, tenant_id, follow_up_required')
      .eq('id', callId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingCall) {
      return createErrorResponse('Call not found', 404, { 
        tenantId, 
        callId 
      })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (follow_up_required !== undefined) {
      updateData.follow_up_required = follow_up_required
    }

    if (follow_up_notes !== undefined) {
      updateData.follow_up_notes = follow_up_notes
    }

    if (follow_up_completed_at !== undefined) {
      updateData.follow_up_completed_at = follow_up_completed_at
    }

    // If marking as complete, set completion timestamp
    if (follow_up_required === false && !follow_up_completed_at) {
      updateData.follow_up_completed_at = new Date().toISOString()
    }

    // Update the call
    const { data: updatedCall, error: updateError } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId)
      .eq('tenant_id', tenantId)
      .select(`
        id,
        vapi_call_id,
        from_number,
        follow_up_required,
        follow_up_notes,
        follow_up_completed_at,
        updated_at
      `)
      .single()

    if (updateError) {
      // Error updating call follow-up
      return createErrorResponse('Failed to update call follow-up', 500, { 
        tenantId, 
        callId,
        error: updateError.message 
      })
    }

    // Invalidate cache
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'calls',
      specificId: callId,
      warmCache: true
    })

    return createSuccessResponse(updatedCall)
  } catch (error) {
    // Error in follow-up update
    return createErrorResponse('Failed to update follow-up', 500, { 
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
    const callId = id

    if (!callId) {
      return createErrorResponse('Call ID is required', 400)
    }

    // Get call with follow-up details
    const { data: call, error: fetchError } = await supabase
      .from('calls')
      .select(`
        id,
        vapi_call_id,
        from_number,
        transcript,
        ai_summary,
        follow_up_required,
        follow_up_notes,
        follow_up_completed_at,
        created_at,
        updated_at
      `)
      .eq('id', callId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !call) {
      return createErrorResponse('Call not found', 404, { 
        tenantId, 
        callId 
      })
    }

    return createSuccessResponse(call)
  } catch (error) {
    // Error fetching call follow-up details
    return createErrorResponse('Failed to fetch follow-up details', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
