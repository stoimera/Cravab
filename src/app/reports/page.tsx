import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { ReportsDashboard } from '@/components/reports/ReportsDashboard'
import { PageTransition } from '@/components/ui/PageTransition'
import { cookies } from 'next/headers'

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get tenant ID from user metadata or use user ID as fallback
  const tenantId = user.user_metadata?.tenant_id || user.id

  return (
    <ResponsiveLayout activeTab="reports" title="Reports">
      <PageTransition>
        <div className="p-6">
          <ReportsDashboard tenantId={tenantId} />
        </div>
      </PageTransition>
    </ResponsiveLayout>
  )
}