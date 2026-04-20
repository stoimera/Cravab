import { MagicLinkForm } from '@/components/auth/MagicLinkForm'
import Link from 'next/link'

export default function MagicLinkPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <MagicLinkForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in with password
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}