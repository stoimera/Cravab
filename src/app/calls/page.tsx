'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { PageTransition } from '@/components/ui/PageTransition'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'
import dynamic from 'next/dynamic'

// Lazy load heavy call components
const CallSummaryDashboard = dynamic(() => import('@/components/calls/CallSummaryDashboard').then(mod => ({ default: mod.CallSummaryDashboard })), {
  loading: () => <div className="p-4">Loading call dashboard...</div>
})

const CallDrawer = dynamic(() => import('@/components/calls/CallDrawer').then(mod => ({ default: mod.CallDrawer })), {
  loading: () => <div className="p-4">Loading call drawer...</div>
})

const CallNotificationManager = dynamic(() => import('@/components/calls/CallNotificationManager').then(mod => ({ default: mod.CallNotificationManager })), {
  loading: () => <div className="p-4">Loading notifications...</div>
})
import { useRealtimeCalls } from '@/hooks/useRealtimeCalls'
import { useSelection } from '@/hooks/useSelection'
import { SelectionToolbar } from '@/components/ui/SelectionToolbar'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQueryClient } from '@tanstack/react-query'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'
import { toast } from 'sonner'
import { Database } from '@/types/database-comprehensive'

// Use proper types from database schema
type User = Database['public']['Tables']['users']['Row']

interface Call {
  id: string
  time: string
  caller: string
  phone: string
  line: 'treated' | 'holdout'
  disposition: 'answered' | 'missed' | 'voicemail' | 'busy'
  duration: number
  booking: boolean
  csat: number | null
  recordingUrl?: string
  transcript?: string
  aiHandled?: boolean
  escalated?: boolean
  revenue?: number
  call_type?: string
  status?: string
  timeline?: Array<{
    time: string
    action: string
    description: string
    type: 'ring' | 'consent' | 'agent' | 'escalation' | 'booking' | 'end'
  }>
  auditTrail?: Array<{
    time: string
    user: string
    action: string
    details: string
  }>
}

function CallsPageContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [tenantId, setTenantId] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('worker')
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  // Manual refresh function for calls
  const refreshCalls = async () => {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['calls', { tenantId }] })
    
    // Invalidate simplified cache layers
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'calls',
      warmCache: true
    })
  }

  // Use real-time calls hook only when user is loaded
  const { calls: realtimeCalls, loading: callsLoading, error } = useRealtimeCalls({
    tenantId: tenantId,
    enabled: !!user && !!tenantId, // Only enable when user and tenantId are loaded
    onNewCall: (call) => {
      // Show notification for new calls
      if ((window as unknown as { addCallNotification?: (call: any) => void }).addCallNotification) {
        (window as unknown as { addCallNotification: (call: any) => void }).addCallNotification(call)
      }
    },
    onCallUpdate: (call) => {
      // Handle call updates
    }
  })


  // Selection functionality for PWA users
  const {
    selectedItems,
    isSelectionMode,
    selectedCount,
    totalItems,
    isSelectionEnabled,
    longPressDuration,
    toggleItem,
    enterSelectionMode,
    exitSelectionMode,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isSelected,
    getSelectedItems
  } = useSelection(realtimeCalls || [], 'id', {
    enablePWAOnly: true,
    longPressDuration: 1500 // 1.5 seconds
  })

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedCount === 0) return

    try {
      const selectedCalls = getSelectedItems(realtimeCalls || [], 'id')
      const callIds = selectedCalls.map(call => call.id)

      // Delete selected calls
      const { error } = await supabase
        .from('calls')
        .delete()
        .in('id', callIds)

      if (error) throw error

      toast.success(`Deleted ${selectedCount} calls`)
      exitSelectionMode()
      refreshCalls()
    } catch (error) {
      toast.error('Failed to delete calls')
    }
  }

  const handleBulkExport = () => {
    const selectedCalls = getSelectedItems(realtimeCalls || [], 'id')
    const csvData = selectedCalls.map((call: any) => ({
      'Call ID': call.id,
      'Caller': call.caller,
      'Phone': call.phone,
      'Time': call.time,
      'Duration': call.duration,
      'Status': call.status || 'Unknown'
    }))

    // Convert to CSV and download
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calls-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${selectedCount} calls`)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (!user) {
        redirect('/auth/login')
        return
      }
      
      setUser(user)
      
      // Fetch tenant_id and role from public.users table (source of truth)
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, role')
          .eq('id', user.id)
          .single()
        
        let resolvedTenantId = ''
        
        if (userData) {
          if (userData.tenant_id) {
            // Use database value as source of truth
            resolvedTenantId = userData.tenant_id
            // Update user_metadata for VAPI compatibility
            user.user_metadata = { ...user.user_metadata, tenant_id: userData.tenant_id }
          } else if (user.user_metadata?.tenant_id) {
            // Fallback to metadata if database doesn't have it
            resolvedTenantId = user.user_metadata.tenant_id
          } else {
            // Last resort fallback
            resolvedTenantId = user?.id || 'default-user'
            user.user_metadata = { ...user.user_metadata, tenant_id: resolvedTenantId }
          }
          
          setTenantId(resolvedTenantId)
          const dbUser = userData as User
          setUserRole(dbUser.role || 'worker')
        } else {
          // Fallback if database doesn't have user record
          resolvedTenantId = user.user_metadata?.tenant_id || user?.id || 'default-user'
          setTenantId(resolvedTenantId)
          user.user_metadata = { ...user.user_metadata, tenant_id: resolvedTenantId }
          setUserRole('worker')
        }
      } catch (error) {
        // Fallback on error
        const fallbackTenantId = user.user_metadata?.tenant_id || user?.id || 'default-user'
        setTenantId(fallbackTenantId)
        user.user_metadata = { ...user.user_metadata, tenant_id: fallbackTenantId }
        setUserRole('worker')
      }
      
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading || !user || !tenantId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedCount}
        totalCount={totalItems}
        onClear={exitSelectionMode}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        isVisible={isSelectionMode}
      />

      <ResponsiveLayout 
        title="Calls"
        tabs={
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 h-9 bg-gray-100 p-1 w-full max-w-xs">
                <TabsTrigger 
                  value="all" 
                  className="h-7 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-colors duration-200 px-2 flex items-center justify-center"
                  style={{ 
                    height: '28px', 
                    minHeight: '28px', 
                    maxHeight: '28px',
                    backgroundColor: activeTab === 'all' ? 'white' : 'transparent'
                  }}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="follow-up" 
                  className="h-7 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-colors duration-200 px-2 flex items-center justify-center"
                  style={{ 
                    height: '28px', 
                    minHeight: '28px', 
                    maxHeight: '28px',
                    backgroundColor: activeTab === 'follow-up' ? 'white' : 'transparent'
                  }}
                >
                  <span className="hidden sm:inline">Follow-up Required</span>
                  <span className="sm:hidden">Follow-up</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      >
        <PageTransition>
          <div className="p-6">
            <CallSummaryDashboard 
              tenantId={tenantId || ''}
              activeTab={activeTab}
              calls={realtimeCalls}
              loading={callsLoading}
              userRole={userRole}
              // Selection props
              isSelectionEnabled={isSelectionEnabled}
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              onLongPress={enterSelectionMode}
              onToggleSelection={toggleItem}
              isSelected={isSelected}
              longPressDuration={longPressDuration}
            />
          </div>
        </PageTransition>
      </ResponsiveLayout>

      {/* Call Drawer */}
      <CallDrawer
        call={selectedCall}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedCall(null)
        }}
      />

      {/* Notification Manager */}
      <CallNotificationManager 
        tenantId={tenantId || ''} 
        onViewCall={(call) => {
          setSelectedCall(call)
          setIsDrawerOpen(true)
        }}
      />

      <BottomNav activeTab="calls" />
    </div>
  )
}

export default function CallsPage() {
  return (
    <PageErrorBoundary pageName="Calls">
      <CallsPageContent />
    </PageErrorBoundary>
  )
}