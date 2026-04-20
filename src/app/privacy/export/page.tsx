'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function DataExportPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [exportData, setExportData] = useState<any>(null)
  const [error, setError] = useState('')

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/privacy/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setExportData(data.data)
        toast.success('Data export completed successfully')
      } else {
        setError(data.error || 'Failed to export data')
        toast.error('Failed to export data')
      }
    } catch (error) {
      logger.error('Export error:', error)
      setError('An error occurred while exporting your data')
      toast.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadData = () => {
    if (!exportData) return

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `CRAVAB-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <ResponsiveLayout activeTab="more" title="Export Your Data" showBackButton={true}>
      <div className="mb-4">
        <p className="text-gray-600">Request a complete copy of all your personal data</p>
      </div>

      <div className="space-y-6">
        {/* Export Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Request Data Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-4">
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

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting Data...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Export Results */}
        {exportData && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                Export Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-green-800">
                  Your data has been successfully exported. The export includes:
                </p>
                <ul className="text-sm text-green-700 space-y-1 ml-4">
                  <li>• Profile information</li>
                  <li>• Appointment history</li>
                  <li>• User preferences</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadData} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>

              <div className="text-xs text-green-700">
                <p><strong>Export Date:</strong> {exportData.export_date}</p>
                <p><strong>Data Categories:</strong> {Object.keys(exportData.data_categories).length} categories</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Included */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              What's Included in Your Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Personal Data</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Name and contact information</li>
                  <li>• Account settings and preferences</li>
                  <li>• Profile information</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Business Data</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Appointment history and details</li>
                  <li>• Client information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention Info */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Profile Data:</strong> Retained for 3 months after account closure</p>
              <p><strong>Appointment Data:</strong> Retained for 3 months after completion</p>
              <p><strong>Call Data:</strong> Retained for 3 months after call completion</p>
              <p><strong>Audit Logs:</strong> Retained for 3 months after creation</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  )
}
