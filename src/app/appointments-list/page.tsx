import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { AppointmentsListView } from '@/components/appointments/AppointmentsListView'
import { cookies } from 'next/headers'

export default async function AppointmentsListPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get tenant ID from user metadata or use user ID as fallback
  const tenantId = user.user_metadata?.tenant_id || user.id

  return (
    <ResponsiveLayout activeTab="more" title="Appointments" showBackButton={true}>
      <AppointmentsListView tenantId={tenantId} />
    </ResponsiveLayout>
  )
}
