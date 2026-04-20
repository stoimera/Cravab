import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const body = await request.json()
    const { password, access_token, refresh_token } = body

    if (!password || !access_token || !refresh_token) {
      return createSuccessResponse({ 
        error: 'Password, access_token, and refresh_token are required' 
      }, 400)
    }

    if (password.length < 6) {
      return createSuccessResponse({ 
        error: 'Password must be at least 6 characters long' 
      }, 400)
    }

    // Set the session using the tokens from the reset link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (sessionError || !sessionData.session) {
      logger.error('Error setting session:', sessionError)
      return createSuccessResponse({ 
        error: 'Invalid or expired reset link. Please request a new password reset.' 
      }, 400)
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      logger.error('Error updating password:', updateError)
      return createErrorResponse('Failed to update password', 500)
    }

    return NextResponse.json({ 
      message: 'Password updated successfully' 
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
