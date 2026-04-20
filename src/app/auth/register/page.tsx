'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    firstName: '',
    lastName: '',
    role: 'admin' as 'admin' | 'manager' | 'worker',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const router = useRouter()

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  // Password validation regex (uppercase, lowercase, number, symbol, min 8 chars)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

  // Debounced password validation
  const [passwordTimeout, setPasswordTimeout] = useState<NodeJS.Timeout | null>(null)

  const validateEmail = useCallback((email: string) => {
    if (!email) return ''
    return emailRegex.test(email) ? '' : 'Invalid email. Please enter a valid email address.'
  }, [])

  const validatePassword = useCallback((password: string) => {
    if (!password) return ''
    if (password.length < 8) return 'Password must be at least 8 characters long.'
    if (!passwordRegex.test(password)) {
      return 'Please use a lower case and an upper case letter, a number, and a symbol (minimum 8 characters).'
    }
    return ''
  }, [])

  const validateForm = useCallback(() => {
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    
    setFieldErrors(prev => ({
      ...prev,
      email: emailError,
      password: passwordError,
    }))

    const isValid = Boolean(
      formData.email && !emailError &&
      formData.password && !passwordError &&
      formData.confirmPassword && formData.password === formData.confirmPassword &&
      formData.name.trim() &&
      formData.firstName.trim() &&
      formData.lastName.trim()
    )

    setIsFormValid(isValid)
  }, [formData.email, formData.password, formData.confirmPassword, formData.name, formData.firstName, formData.lastName, validateEmail, validatePassword])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear general error when user starts typing
    if (error) setError('')
  }

  const handleEmailChange = (value: string) => {
    handleInputChange('email', value)
    const emailError = validateEmail(value)
    setFieldErrors(prev => ({ ...prev, email: emailError }))
  }

  const handlePasswordChange = (value: string) => {
    handleInputChange('password', value)
    
    // Clear existing timeout
    if (passwordTimeout) {
      clearTimeout(passwordTimeout)
    }
    
    // Set new timeout for password validation (2 seconds delay)
    const timeout = setTimeout(() => {
      const passwordError = validatePassword(value)
      setFieldErrors(prev => ({ ...prev, password: passwordError }))
    }, 2000)
    
    setPasswordTimeout(timeout)
  }

  const handleConfirmPasswordChange = (value: string) => {
    handleInputChange('confirmPassword', value)
    // Validation will be triggered by the useEffect below
  }

  // Validate form whenever formData changes
  useEffect(() => {
    validateForm()
  }, [formData.email, formData.password, formData.confirmPassword, formData.name, formData.firstName, formData.lastName])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (passwordTimeout) {
        clearTimeout(passwordTimeout)
      }
    }
  }, [passwordTimeout])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!formData.name.trim()) {
      setError('Company name is required')
      setLoading(false)
      return
    }

    if (!formData.firstName.trim()) {
      setError('First name is required')
      setLoading(false)
      return
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
      } else {
        // Show success message and redirect
        setError('') // Clear any errors
        router.push('/auth/login?message=Registration successful! Your account has been created and you can now sign in.')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
          <CardDescription>
            Sign up for your CRAVAB account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Company Information */}
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your company name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                autoComplete="organization"
                className="mobile-input"
              />
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  autoComplete="given-name"
                  className="mobile-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  autoComplete="family-name"
                  className="mobile-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
                autoComplete="email"
                className={`mobile-input ${fieldErrors.email ? 'border-red-500' : ''}`}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger id="role" name="role" className="mobile-input">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                autoComplete="tel"
                className="mobile-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                autoComplete="new-password"
                className={`mobile-input ${fieldErrors.password ? 'border-red-500' : ''}`}
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                required
                autoComplete="new-password"
                className={`mobile-input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : ''}`}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full mobile-button bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
