import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { tenantResolutionService } from '@/lib/tenant-resolution'

import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, duration, transcript } = body
    
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get user data to determine tenant_id
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Use centralized tenant resolution service
    const tenantResolution = await tenantResolutionService.resolveTenantForUser(user.id)
    const tenantId = tenantResolution.tenantId

    // Test call tenant resolution
    
    // Create test call record
    const callData = {
      id: `test-${Date.now()}`,
      tenant_id: tenantId,
      vapi_call_id: `test-call-${Date.now()}`,
      direction: 'inbound' as const,
      from_number: '+15551234567', // Test number
      to_number: '+15551234568', // Test number
      status: 'completed' as const,
      duration_seconds: duration || 120,
      recording_url: null,
      transcript: transcript || 'Hello, I need help with a service issue. When can someone come out to help me?',
      ai_summary: 'Customer reported a service issue and needs a technician to come out. Customer is looking for scheduling availability.',
      ai_sentiment: 'neutral',
      ai_intent: 'test',
      follow_up_required: false,
      follow_up_notes: null,
      metadata: {
        vapi_call_id: `test-call-${Date.now()}`,
        webhook_type: 'test',
        full_webhook_data: {
          type: 'test-call',
          test: true,
          source: 'web-interface'
        }
      }
    }
    
    const { error: callError } = await (supabase as any)
      .from('calls')
      .insert(callData)
    
    if (callError) {
      return createErrorResponse('Failed to create test call', 500)
    }
    
    return NextResponse.json({ 
      success: true, 
      call_id: callData.id,
      message: 'Test call created successfully' 
    })
    
  } catch (error) {
    return createErrorResponse(
      'Failed to create test call', 
      500, 
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}
