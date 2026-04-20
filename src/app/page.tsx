'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true

    const safeRedirect = (path: string) => {
      if (isMounted) {
        router.replace(path)
      }
    }

    const checkAuthAndRedirect = async () => {
      try {
        // Prefer session-first read to avoid hanging on invalid refresh token fetches.
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          await supabase.auth.signOut()
          safeRedirect('/auth/login')
          return
        }

        if (session?.user) {
          safeRedirect('/calls')
        } else {
          safeRedirect('/auth/login')
        }
      } catch (error) {
        await supabase.auth.signOut()
        safeRedirect('/auth/login')
      }
    }

    const fallbackTimer = setTimeout(() => {
      safeRedirect('/auth/login')
    }, 4000)

    checkAuthAndRedirect()

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
    }
  }, [router, supabase])

  // Show loading spinner while checking authentication and redirecting
  // Use fixed positioning to ensure it's always centered and prevents layout shift
  return (
    <div 
      className="fixed inset-0 min-h-screen bg-background flex items-center justify-center z-50"
      suppressHydrationWarning
    >
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-foreground font-inter">Loading...</p>
      </div>
    </div>
  )
}