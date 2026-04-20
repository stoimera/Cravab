'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ClientsList } from '@/components/clients/ClientsList'
import { AddClientModal } from '@/components/clients/AddClientModal'
import { BottomNav } from '@/components/layout/BottomNav'
import { useSelection } from '@/hooks/useSelection'
import { SelectionToolbar } from '@/components/ui/SelectionToolbar'
import { User } from '@supabase/supabase-js'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { PageTransition } from '@/components/ui/PageTransition'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'
import { toast } from 'sonner'

function ClientsPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const supabase = createClient()

  // Memoized callback to prevent infinite re-renders
  const handleClientsLoaded = useCallback((loadedClients: any[]) => {
    setClients(loadedClients)
  }, [])

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
  } = useSelection(clients, 'id', {
    enablePWAOnly: true,
    longPressDuration: 1500 // 1.5 seconds
  })

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedCount === 0) return

    try {
      const selectedClients = getSelectedItems(clients, 'id')
      const clientIds = selectedClients.map(client => client.id)

      // Delete selected clients
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', clientIds)

      if (error) throw error

      toast.success(`Deleted ${selectedCount} clients`)
      exitSelectionMode()
    } catch (error) {
      toast.error('Failed to delete clients')
    }
  }

  const handleBulkExport = () => {
    const selectedClients = getSelectedItems(clients, 'id')
    const csvData = selectedClients.map(client => ({
      'Client ID': client.id,
      'Name': `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      'Email': client.email || '',
      'Phone': client.phone || '',
      'Address': client.address || '',
      'City': client.city || '',
      'State': client.state || '',
      'Zip': client.zip_code || '',
      'Status': client.status || 'Active'
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
    a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${selectedCount} clients`)
  }

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
      } else {
        // Last resort fallback
        resolvedTenantId = user?.id || 'default-user'
        user.user_metadata = { ...user.user_metadata, tenant_id: resolvedTenantId }
      }
      
      setTenantId(resolvedTenantId)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading) {
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
        activeTab="clients" 
        title="Clients"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-transparent border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Client</span>
              <span className="sm:hidden">Add Client</span>
            </button>
            <button 
              onClick={() => window.open('/api/clients/export', '_blank')}
              className="bg-transparent border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        }
      >
        <PageTransition>
          <div className="p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search clients by name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            
            {/* Clients List */}
            <ClientsList 
              tenantId={tenantId} 
              onAddClient={() => setIsAddModalOpen(true)}
              searchQuery={searchQuery}
              // Selection props
              isSelectionEnabled={isSelectionEnabled}
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              onLongPress={enterSelectionMode}
              onToggleSelection={toggleItem}
              isSelected={isSelected}
              longPressDuration={longPressDuration}
              onClientsLoaded={handleClientsLoaded}
            />
          </div>
        </PageTransition>
      
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={() => {}}
        tenantId={user?.user_metadata?.tenant_id || user?.id || ''}
      />
      </ResponsiveLayout>
    </div>
  )
}

export default function ClientsPage() {
  return (
    <PageErrorBoundary pageName="Clients">
      <ClientsPageContent />
    </PageErrorBoundary>
  )
}
