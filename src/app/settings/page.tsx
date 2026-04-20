'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { UserManagement } from '@/components/settings/UserManagement'
import { Card, CardContent } from '@/components/ui/card'
import { PageTransition } from '@/components/ui/PageTransition'
import { FloatingCard } from '@/components/ui/AnimatedCard'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  MessageSquare,
  MapPin
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'

function SettingsPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('company')
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null)
  const [companyProfile, setCompanyProfile] = useState<Record<string, unknown> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/auth/login')
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setProfileLoading(true)
        try {
          // Fetch user profile from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*, tenant_id')
            .eq('id', user.id)
            .single()
          
          // User data processed
          
          // Type assertion to fix TypeScript inference issue
          const userRecord = userData as Record<string, unknown> | null
          
          if (userRecord && userRecord.tenant_id) {
            setUserProfile(userRecord)
            
            // Fetch tenant profile
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenants')
              .select('*')
              .eq('id', userRecord.tenant_id as string)
              .single()
            
            // Tenant data processed
            
            if (tenantData) {
              setCompanyProfile(tenantData)
            }
          } else {
            // No user data found in users table
          }
        } catch (error) {
          // Error fetching profile data
        } finally {
          setProfileLoading(false)
        }
      }
    }
    
    fetchUserProfile()
  }, [user, supabase])

  if (loading || profileLoading) {
    return (
      <ResponsiveLayout activeTab="more" title="Settings">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-inter">Loading settings...</p>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  
  const tenantId = (userProfile?.tenant_id as string) || ''
  const userRole = userProfile?.role || 'worker'
  

  return (
    <ResponsiveLayout 
      activeTab="more" 
      title="Settings" 
      showBackButton={true}
      actions={
        <Badge className="bg-primary/10 text-primary border-primary/20">
          {(userRole as string).charAt(0).toUpperCase() + (userRole as string).slice(1)}
        </Badge>
      }
    >
      <PageTransition>
        <div className="p-6 pb-24 sm:pb-20 safe-area-pb">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto sm:h-12">
              <TabsTrigger 
                value="company" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 text-muted-foreground h-12 sm:h-10 flex-col sm:flex-row gap-1 sm:gap-2"
              >
                <span className="text-xs sm:text-sm">Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 text-muted-foreground h-12 sm:h-10 flex-col sm:flex-row gap-1 sm:gap-2"
              >
                <span className="text-xs sm:text-sm">Users</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-6">
              <SettingsForm />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <UserManagement tenantId={tenantId} currentUserRole={userRole as "manager" | "worker" | "owner"} />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </ResponsiveLayout>
  )
}

export default function SettingsPage() {
  return (
    <PageErrorBoundary pageName="Settings">
      <SettingsPageContent />
    </PageErrorBoundary>
  )
}
