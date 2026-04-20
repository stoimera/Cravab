import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/schemas'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = loginSchema.parse(body)
    
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      return createErrorResponse(error.message, 400)
    }

    return createSuccessResponse({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      error instanceof Error ? 400 : 500
    )
  }
}
