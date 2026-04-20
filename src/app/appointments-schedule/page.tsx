'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { ScheduleAppointmentModal } from '@/components/appointments/ScheduleAppointmentModal'
import { Button } from '@/components/ui/button'
import { CalendarPlus, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ScheduleAppointmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setTenantId((userData as any).tenant_id)
        }
      }
      
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleAppointmentScheduled = () => {
    toast.success('Appointment scheduled successfully!')
    router.push('/appointments')
  }

  if (loading) {
    return (
      <ResponsiveLayout activeTab="appointments" title="Schedule Appointment" showBackButton={true}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-2 text-gray-600">Loading...</p>
        </div>
      </ResponsiveLayout>
    )
  }

  if (!user || !tenantId) {
    return (
      <ResponsiveLayout activeTab="appointments" title="Schedule Appointment" showBackButton={true}>
        <div className="text-center py-8">
          <p className="text-gray-600">Please log in to schedule appointments.</p>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout activeTab="appointments" title="Schedule Appointment" showBackButton={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Schedule New Appointment</h1>
          <p className="mt-2 text-gray-600">
            Create a new appointment for one of your clients
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Schedule</h3>
            <p className="text-blue-700 mb-4">
              Schedule an appointment with all the details in one form
            </p>
            <Button 
              onClick={() => setShowModal(true)}
              className="w-full btn-transition"
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">From Call</h3>
            <p className="text-green-700 mb-4">
              Create an appointment based on a recent call or inquiry
            </p>
            <Button 
              variant="outline"
              onClick={() => router.push('/calls')}
              className="w-full btn-transition"
            >
              View Recent Calls
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Schedule</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Select Client</p>
                <p className="text-sm text-gray-600">Choose from your existing clients or add a new one</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Choose Service</p>
                <p className="text-sm text-gray-600">Select the service type and duration will be auto-calculated</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Set Date & Time</p>
                <p className="text-sm text-gray-600">Pick a convenient time for both you and the client</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Location</p>
                <p className="text-sm text-gray-600">Include address details for easy navigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && tenantId && (
        <ScheduleAppointmentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAppointmentScheduled={handleAppointmentScheduled}
          tenantId={tenantId}
        />
      )}
    </ResponsiveLayout>
  )
}
