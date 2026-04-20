'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Auth callback error:', error)
          setError(error.message)
        } else if (data.session) {
          // User is authenticated, redirect to dashboard
          router.push('/calls')
        } else {
          setError('No session found')
        }
      } catch (err) {
        logger.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Sign in successful! Redirecting...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
