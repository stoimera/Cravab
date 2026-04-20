'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function PrivacyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      if (!user) {
        router.push('/auth/login')
      }
    }
    getUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ResponsiveLayout activeTab="more" title="Privacy & Security" showBackButton={true}>
      <div className="mb-4">
        <p className="text-gray-600">Manage your data and privacy preferences</p>
      </div>


        <div className="space-y-6">
          {/* Data Collection */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Data Collection
            </h3>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">What we collect:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Account information (name, email, company details)</li>
                <li>• Business data (appointments, clients, calls)</li>
                <li>• Usage analytics (app interactions, feature usage)</li>
              </ul>
            </div>
          </div>

          {/* Data Usage */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How we use your data
            </h3>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">We use your data to:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Provide and improve our services</li>
                <li>• Process appointments and manage clients</li>
                <li>• Send important notifications and updates</li>
                <li>• Ensure security and prevent fraud</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </div>
          </div>

          {/* Data Protection */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Data Protection
            </h3>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">We protect your data by:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Using industry-standard encryption</li>
                <li>• Implementing secure data storage</li>
                <li>• Regular security audits and updates</li>
                <li>• Limited access to authorized personnel only</li>
                <li>• Compliance with GDPR and privacy regulations</li>
              </ul>
            </div>
          </div>

          {/* CCPA Rights */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your CCPA Rights (California Consumer Privacy Act)
            </h3>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">As a US resident, you have the right to:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Right to Know:</strong> Request information about personal data collected</li>
                <li>• <strong>Right to Delete:</strong> Request deletion of personal data</li>
                <li>• <strong>Right to Opt-Out:</strong> Opt out of sale of personal data (we don't sell data)</li>
                <li>• <strong>Right to Non-Discrimination:</strong> Exercise rights without discrimination</li>
                <li>• <strong>Right to Data Portability:</strong> Export your data in a portable format</li>
                <li>• <strong>Right to Correct:</strong> Correct inaccurate personal information</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> We do not sell personal data to third parties. 
                We only share data with VAPI (AI services) and Twilio (phone services) 
                as necessary to provide our services.
              </p>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Data Retention Policy
            </h3>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">We retain your data for:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Account Data:</strong> 3 months after account closure</li>
                <li>• <strong>Appointment Records:</strong> 3 months after completion</li>
                <li>• <strong>Call Records:</strong> 3 months after call completion</li>
                <li>• <strong>Audit Logs:</strong> 3 months after creation</li>
                <li>• <strong>Marketing Data:</strong> Until you opt out</li>
              </ul>
            </div>
            <div className="mt-4 p-3 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Automatic Cleanup:</strong> We automatically delete expired data 
                according to our retention policies. You can request immediate deletion 
                of your personal data at any time.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Us
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                If you have any questions about this privacy policy or want to exercise your rights, 
                please contact us at:
              </p>
              <div className="text-sm text-gray-900">
                <p>Phone: +1 (628) 295-4082</p>
                <p>Email: support@CRAVAB.com</p>
              </div>
            </div>
          </div>

          {/* CCPA Rights Actions */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-medium text-gray-900">Export Your Data</h3>
                  <p className="text-sm text-gray-600">Download all your personal data</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="mt-2 w-full border border-gray-300"
                onClick={() => window.location.href = '/privacy/export'}
              >
                Request Export
              </Button>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-medium text-gray-900">Delete Your Data</h3>
                  <p className="text-sm text-gray-600">Permanently remove your data</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="destructive" 
                className="mt-2 w-full"
                onClick={() => window.location.href = '/privacy/delete'}
              >
                Request Deletion
              </Button>
            </div>

          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500">
            <p>Last updated: 7.10.2025</p>
          </div>
        </div>
    </ResponsiveLayout>
  )
}