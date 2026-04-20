'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function DataDeletionPage() {
  const [email, setEmail] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletionResult, setDeletionResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'warning' | 'confirm' | 'result'>('form')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (confirmation !== 'DELETE_MY_DATA') {
      setError('Please type "DELETE_MY_DATA" to confirm')
      return
    }

    setStep('warning')
  }

  const handleConfirmDeletion = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/privacy/delete-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          confirmation: 'DELETE_MY_DATA'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setDeletionResult(data.deleted_data)
        setStep('result')
        toast.success('Data deletion completed successfully')
      } else {
        setError(data.error || 'Failed to delete data')
        toast.error('Failed to delete data')
        setStep('form')
      }
    } catch (error) {
      logger.error('Deletion error:', error)
      setError('An error occurred while deleting your data')
      toast.error('Deletion failed')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setStep('form')
    setEmail('')
    setConfirmation('')
    setError('')
  }

  if (step === 'warning') {
    return (
      <ResponsiveLayout activeTab="more" title="Confirm Data Deletion" showBackButton={true}>
        <div className="max-w-2xl mx-auto space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> This action cannot be undone. All your personal data will be permanently deleted.
            </AlertDescription>
          </Alert>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Trash2 className="h-5 w-5" />
                Confirm Data Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">What will be deleted:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Your user account and profile</li>
                  <li>• All personal data and preferences</li>
                  <li>• Audit logs and activity history</li>
                  <li>• Personal information from appointments and calls</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">What will be retained:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Business records (appointments, calls) - anonymized</li>
                  <li>• Company data and settings</li>
                  <li>• Legal compliance records</li>
                </ul>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> If you are the only admin of your company, 
                  you must transfer admin rights to another user before deletion.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirmDeletion}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Yes, Delete My Data
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    )
  }

  if (step === 'result') {
    return (
      <ResponsiveLayout activeTab="more" title="Data Deletion Complete" showBackButton={true}>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                Data Deletion Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-800">
                Your personal data has been successfully deleted from our systems.
              </p>

              {deletionResult && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-900">Deleted Data Summary:</h4>
                  <ul className="text-sm text-green-700 space-y-1 ml-4">
                    {Object.entries(deletionResult).map(([key, value]) => (
                      <li key={key}>
                        • {key.replace(/_/g, ' ')}: {String(value)} records
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Some business records may be retained for legal compliance. 
                  These records have been anonymized and do not contain your personal information.
                </p>
              </div>

              <Button 
                onClick={() => window.location.href = '/auth/login'}
                className="w-full"
              >
                Return to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout activeTab="more" title="Delete Your Data" showBackButton={true}>
      <div className="mb-4">
        <p className="text-gray-600">Permanently delete all your personal data from our systems</p>
      </div>

      <div className="space-y-6">
        {/* Deletion Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Request Data Deletion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
                <p className="text-sm text-gray-600">
                  Enter the email address associated with your account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation">Confirmation</Label>
                <Input
                  id="confirmation"
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Type DELETE_MY_DATA to confirm"
                  required
                />
                <p className="text-sm text-gray-600">
                  Type "DELETE_MY_DATA" to confirm you want to permanently delete your data
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button type="submit" variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Request Data Deletion
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* What Gets Deleted */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              What Gets Deleted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-red-900">Personal Data (Deleted)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User account and profile</li>
                  <li>• Personal preferences</li>
                  <li>• Audit logs and activity</li>
                  <li>• Personal information from records</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-green-900">Business Data (Anonymized)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Appointment records (anonymized)</li>
                  <li>• Call transcripts (anonymized)</li>
                  <li>• Company settings</li>
                  <li>• Legal compliance records</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>Irreversible:</strong> This action cannot be undone. All your personal data will be permanently deleted.</p>
              <p><strong>Account Access:</strong> You will no longer be able to access your account after deletion.</p>
              <p><strong>Business Records:</strong> Some business records may be retained for legal compliance but will be anonymized.</p>
              <p><strong>Admin Rights:</strong> If you're the only admin, transfer admin rights before deletion.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  )
}
