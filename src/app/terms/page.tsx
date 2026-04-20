import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { cookies } from 'next/headers'

export default async function TermsPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ResponsiveLayout activeTab="more" title="Terms of Service" showBackButton={true}>
      <div className="mb-4">
        <p className="text-gray-600">Terms and conditions for using CRAVAB</p>
      </div>
        
        <div className="space-y-6">
          {/* Agreement */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agreement to Terms
            </h3>
            <p className="text-sm text-gray-600">
              By accessing and using CRAVAB, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </div>

          {/* Service Description */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Service Description
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">CRAVAB provides:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Appointment scheduling and management</li>
                  <li>• Client database and relationship management</li>
                  <li>• AI-powered call handling and automation</li>
                  <li>• Business analytics and reporting</li>
                  <li>• Service catalog and pricing management</li>
                  <li>• Team collaboration and user management</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Processing Agreement */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Data Processing Agreement
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Third-Party Services:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• VAPI AI: Call processing and transcription services</li>
                  <li>• Twilio: Phone number and SMS services</li>
                  <li>• Supabase: Database and authentication services</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Data Sharing:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Call transcripts shared with VAPI for AI processing</li>
                  <li>• Phone numbers shared with Twilio for call routing</li>
                  <li>• All data encrypted and stored securely with Supabase</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CCPA Compliance */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              CCPA Compliance
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">California Consumer Privacy Act:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Right to know what personal information is collected</li>
                  <li>• Right to delete personal information</li>
                  <li>• Right to opt-out of sale of personal information</li>
                  <li>• Right to non-discrimination for exercising privacy rights</li>
                </ul>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> We do not sell personal data to third parties. 
                  Data sharing is limited to service providers necessary for app functionality.
                </p>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Responsibilities
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">You agree to:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Provide accurate and complete information</li>
                  <li>• Maintain the security of your account credentials</li>
                  <li>• Use the service in compliance with applicable laws</li>
                  <li>• Not engage in any illegal or unauthorized activities</li>
                  <li>• Respect the intellectual property rights of others</li>
                  <li>• Not attempt to gain unauthorized access to our systems</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Terms - COMMENTED OUT */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Billing and Payments:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Subscription fees are billed monthly or annually</li>
                  <li>• Payment is due in advance of each billing period</li>
                  <li>• All fees are non-refundable unless otherwise stated</li>
                  <li>• We may change pricing with 30 days notice</li>
                  <li>• Late payments may result in service suspension</li>
                </ul>
              </div>
            </CardContent>
          </Card> */}


          {/* Termination */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Termination
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Either party may terminate:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  {/* <li>• You may cancel your subscription at any time</li> */}
                  <li>• We may suspend or terminate for breach of terms</li>
                  <li>• Upon termination, your data will be deleted after 30 days</li>
                  <li>• You may export your data before termination</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Terms - COMMENTED OUT */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Billing:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Monthly subscription fees billed in advance</li>
                  <li>• Usage-based charges for AI calls and phone services</li>
                  <li>• All prices in USD, excluding applicable taxes</li>
                  <li>• Payment required within 30 days of invoice date</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Cancellation:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Cancel anytime with 30 days notice</li>
                  <li>• No refunds for partial months</li>
                  <li>• Data export available before account closure</li>
                </ul>
              </div>
            </CardContent>
          </Card> */}

          {/* Service Level Agreement */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Service Level Agreement
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uptime Guarantee:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• 99.9% uptime for core services</li>
                  <li>• Scheduled maintenance with advance notice</li>
                  <li>• Emergency maintenance as needed</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Support:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Email support within 24 hours</li>
                  <li>• Phone support during business hours</li>
                  <li>• Documentation and help center available</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Limitation of Liability
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                CRAVAB is provided "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Business losses or missed appointments</li>
                <li>• Data loss due to user error or third-party services</li>
                <li>• Service interruptions or technical issues</li>
                <li>• Indirect, incidental, or consequential damages</li>
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                For questions about these terms, please contact us:
              </p>
              <div className="text-sm text-gray-900">
                <p>Phone: +1 (628) 295-4082</p>
                <p>Email: support@CRAVAB.com</p>
              </div>
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