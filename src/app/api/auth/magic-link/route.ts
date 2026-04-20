import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, companyName } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Send magic link using Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    })

    if (error) {
      logger.error('Supabase magic link error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Send custom email using Resend
    try {
      await emailService.sendMagicLink({
        to: email,
        magicLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        companyName: companyName || 'CRAVAB'
      })
    } catch (emailError) {
      logger.error('Resend email error:', emailError)
      // Don't fail the request if email fails - Supabase already sent the magic link
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent successfully'
    })

  } catch (error) {
    logger.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
