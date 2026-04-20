import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">CRAVAB</h1>
          <p className="mt-2 text-sm text-gray-600">
            Professional service business management platform
          </p>
        </div>
        <Suspense fallback={
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
