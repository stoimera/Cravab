import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, supabase } = authResult

    // Fetch notifications for the user
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse('Failed to fetch notifications', 500, { 
        userId: user.id, 
        error: error.message 
      })
    }

    return createSuccessResponse({ notifications })
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
    
    const { user, supabase } = authResult
    const body = await request.json()

    // Create new notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        ...body,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse('Failed to create notification', 500, { 
        userId: user.id, 
        error: error.message 
      })
    }

    return createSuccessResponse({ notification })
  } catch (error) {
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
