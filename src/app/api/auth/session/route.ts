import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return createErrorResponse(error.message, 401)
    }

    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    return createSuccessResponse({ user })
  } catch (err) {
    return createErrorResponse('Internal server error', 500)
  }
}
