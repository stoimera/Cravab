'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  role: string
  worker_type: string
  tenant_id: string
  company_name: string
  status: string
}

function InviteForm() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const inviteId = searchParams.get('invite')
  const tenantId = searchParams.get('company')

  const validateInvitation = useCallback(async () => {
    try {
      const { data: invitationData, error: inviteError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          tenant_id,
          is_active,
          invitation_expires_at,
          tenants!inner(name)
        `)
        .eq('id', inviteId!)
        .eq('tenant_id', tenantId!)
        .eq('is_active', false)
        .single()

      if (inviteError || !invitationData) {
        setError('Invalid or expired invitation')
        setLoading(false)
        return
      }

      // Check if invitation has expired
      const now = new Date()
      const expiresAt = new Date((invitationData as any).invitation_expires_at)
      if (expiresAt < now) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.')
        setLoading(false)
        return
      }

      setInvitation({
        id: (invitationData as any).id,
        email: (invitationData as any).email,
        role: (invitationData as any).role,
        worker_type: (invitationData as any).role, // Use role as worker_type
        tenant_id: (invitationData as any).tenant_id,
        company_name: (invitationData as any).tenants.name,
        status: (invitationData as any).is_active ? 'active' : 'pending'
      })
      setLoading(false)
    } catch (err) {
      setError('Failed to validate invitation')
      setLoading(false)
    }
  }, [supabase, inviteId, tenantId])

  useEffect(() => {
    if (inviteId && tenantId) {
      validateInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [inviteId, tenantId, validateInvitation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setSubmitting(false)
      return
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.email,
        password: formData.password,
      })

      if (authError) {
        setError(authError.message)
        setSubmitting(false)
        return
      }

      if (authData.user) {
        // Update the pending user record with auth user ID and profile data
        const { error: updateError } = await (supabase as any)
          .from('users')
          .update({
            id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            status: 'active',
            is_active: true,
          })
          .eq('id', invitation!.id)

        if (updateError) {
          setError('Failed to complete registration')
          setSubmitting(false)
          return
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/login?message=Registration successful! Please sign in to continue.')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-foreground font-inter">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-green-600">Welcome to the Team!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-foreground font-inter mb-4">
              Your account has been created successfully. You'll be redirected to the login page shortly.
            </p>
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Registration</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation?.company_name}</strong> as a <strong>{invitation?.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  className="mobile-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  className="mobile-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="mobile-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className="mobile-input"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full mobile-button bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-foreground font-inter">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <InviteForm />
    </Suspense>
  )
}
