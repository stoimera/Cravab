import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { JarvisPageClient } from '@/components/jarvis/JarvisPageClient'
import { BottomNav } from '@/components/layout/BottomNav'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function JarvisPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Header with Back Button */}
      <div className="w-full px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground font-inter">
            Jarvis AI
          </h1>
          <Link 
            href="/more" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
      </div>
      
      {/* Chat Interface */}
      <JarvisPageClient />
      
      {/* Bottom Navigation */}
      <BottomNav activeTab="more" />
    </div>
  )
}
