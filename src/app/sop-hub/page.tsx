import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { SOPHub } from '@/components/sop/SOPHub'
import { cookies } from 'next/headers'

export default async function SOPHubPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ResponsiveLayout activeTab="more" title="SOP Hub" showBackButton={true}>
      <div className="mb-4">
        <p className="text-gray-600">Learn how to use CRAVAB effectively</p>
      </div>
      <SOPHub />
    </ResponsiveLayout>
  )
}
