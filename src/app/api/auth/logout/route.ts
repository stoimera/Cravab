import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return createErrorResponse(error.message, 400)
    }

    return createSuccessResponse({ success: true })
  } catch (err) {
    return createErrorResponse('Internal server error', 500)
  }
}
