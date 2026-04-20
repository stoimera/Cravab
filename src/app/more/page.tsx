import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MoreMenu } from '@/components/more/MoreMenu'
import { BottomNav } from '@/components/layout/BottomNav'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { PageTransition } from '@/components/ui/PageTransition'
import { cookies } from 'next/headers'

export default async function MorePage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ResponsiveLayout activeTab="more" title="More">
      <PageTransition>
        <div className="p-6">
          <MoreMenu />
        </div>
      </PageTransition>
    </ResponsiveLayout>
  )
}
