import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, AlertCircle } from 'lucide-react'

export default function PaymentRequiredPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Payment Required</CardTitle>
          <CardDescription>
            Your subscription is inactive or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To continue using CRAVAB, please complete your payment setup.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Payment Instructions:</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Contact your administrator to complete payment setup</li>
              <li>Payment can be made via bank-to-bank transfer</li>
              <li>Once payment is verified, your account will be activated</li>
            </ol>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              <span>Need help? Contact support for assistance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
