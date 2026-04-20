import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">CRAVAB</h1>
          <p className="mt-2 text-sm text-gray-600">
            Professional service business management platform
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
