'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ServicesList, ServicesListRef } from '@/components/services/ServicesList'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { User } from '@supabase/supabase-js'
import { CreateService } from '@/lib/schemas'

export default function ServicesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const servicesListRef = useRef<ServicesListRef>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        redirect('/auth/login')
        return
      }
      
      setUser(user)
      
      // Fetch tenant_id from public.users table (source of truth)
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
      
      let resolvedTenantId = ''
      
      if (userData?.tenant_id) {
        // Use database value as source of truth
        resolvedTenantId = userData.tenant_id
        // Update user_metadata for VAPI compatibility
        user.user_metadata = { ...user.user_metadata, tenant_id: userData.tenant_id }
      } else if (user.user_metadata?.tenant_id) {
        // Fallback to metadata if database doesn't have it
        resolvedTenantId = user.user_metadata.tenant_id
      }
      
      setTenantId(resolvedTenantId)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    redirect('/auth/login')
  }

  const handleAddService = () => {
    servicesListRef.current?.openAddService()
  }

  return (
    <ResponsiveLayout 
      activeTab="more" 
      title="Services" 
      showBackButton={true}
      addButton={{
        label: "Add Service",
        onClick: handleAddService
      }}
    >
      <ServicesList ref={servicesListRef} tenantId={tenantId} />
    </ResponsiveLayout>
  )
}
