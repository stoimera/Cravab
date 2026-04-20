import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    const body = await request.json()
    const { email, companyName } = body

    if (!email) {
      return createErrorResponse('Email is required', 400)
    }

    // Send password reset email using Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) {
      return createErrorResponse('Failed to send password reset email', 500)
    }

    // Send custom email using Resend
    try {
      await emailService.sendPasswordReset({
        to: email,
        resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        companyName: companyName || 'CRAVAB'
      })
    } catch (emailError) {
      logger.error('Resend email error:', emailError)
      // Don't fail the request if email fails - Supabase already sent the reset email
    }

    return NextResponse.json({ 
      message: 'Password reset email sent successfully' 
    })
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}
