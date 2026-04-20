'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// Import calendar components directly for instant loading
import { AppointmentsList } from '@/components/appointments/AppointmentsList'
import EnhancedCalendar from '@/components/appointments/EnhancedCalendar'

// Keep modals as dynamic since they're only loaded when needed
const AppointmentDetailModal = dynamic(() => import('@/components/appointments/AppointmentDetailModal').then(mod => ({ default: mod.AppointmentDetailModal })), {
  loading: () => <div className="p-4">Loading appointment details...</div>
})

const AddAppointmentModal = dynamic(() => import('@/components/appointments/AddAppointmentModal').then(mod => ({ default: mod.AddAppointmentModal })), {
  loading: () => <div className="p-4">Loading add appointment...</div>
})

const EditAppointmentModal = dynamic(() => import('@/components/appointments/EditAppointmentModal').then(mod => ({ default: mod.EditAppointmentModal })), {
  loading: () => <div className="p-4">Loading edit appointment...</div>
})
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { DatePicker } from '@/components/appointments/DatePicker'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { AppointmentWithClient } from '@/types/database-comprehensive'
import { useSelection } from '@/hooks/useSelection'
import { SelectionToolbar } from '@/components/ui/SelectionToolbar'
import { toast } from 'sonner'
import { 
  getTimeInTenantTimezone, 
  getDateInTenantTimezone 
} from '@/lib/timezone-utils'
import { useTenantTimezone } from '@/hooks/useTenantTimezone'
import { useAppointments, useRealtimeUpdates, useUpdateAppointmentStatus, useUpdateAppointment, useCreateAppointment, useDeleteAppointment } from '@/hooks/useQueries'
import { Calendar, List } from 'lucide-react'
import { Database } from '@/types/database-comprehensive'

// Use proper types from database schema
type User = Database['public']['Tables']['users']['Row']

// Define a specific type for this component's data structure
type AppointmentListItem = {
  id: string
  tenant_id: string
  client_id: string
  service_id: string | null
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  priority: 'normal' | 'high' | 'emergency'
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  coordinates: any
  eta_minutes: number | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  clients: {
    first_name: string
    last_name: string
    phone: string
    email: string | null
    address: string | null
  } | null
  services: {
    id: string
    name: string
    description: string | null
    category: string | null
    base_price: number | null
    hourly_rate: number | null
    estimated_duration_minutes: number | null
    is_emergency_service: boolean | null
    requires_equipment: boolean | null
  } | null
  users: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    role: string
  } | null
}

// Simple type for calendar display
type CalendarAppointment = {
  id: string
  title: string
  startTime: string
  endTime: string
  date: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  clientName?: string
  serviceName?: string
}

function AppointmentsPageContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [tenantId, setTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('worker')
  const [roleLoading, setRoleLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [enhancedAppointments, setEnhancedAppointments] = useState<AppointmentListItem[]>([])
  const [calendarAppointments, setCalendarAppointments] = useState<CalendarAppointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentListItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentListItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const supabase = createClient()
  const { timezone: tenantTimezone } = useTenantTimezone(tenantId)
  
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
  } = useSelection(enhancedAppointments, 'id', {
    enablePWAOnly: true,
    longPressDuration: 1500 // 1.5 seconds
  })
  
  // Use React Query hooks for data fetching with real-time updates
  const { 
    data: appointments = [], 
    isLoading: appointmentsLoading, 
    error: appointmentsError,
    refetch: refetchAppointments
  } = useAppointments(tenantId)
  
  // Enable real-time updates for appointments
  useRealtimeUpdates(tenantId)
  
  // Mutation hooks for appointment operations
  const updateAppointmentStatus = useUpdateAppointmentStatus(tenantId)
  const updateAppointment = useUpdateAppointment(tenantId)
  const createAppointment = useCreateAppointment(tenantId)
  const deleteAppointment = useDeleteAppointment(tenantId)

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
        setUserRole(userData.role || 'worker')
        setRoleLoading(false)
      } else {
        // Fallback if database doesn't have user record
        resolvedTenantId = user.user_metadata?.tenant_id || user?.id || 'default-user'
        setTenantId(resolvedTenantId)
        user.user_metadata = { ...user.user_metadata, tenant_id: resolvedTenantId }
        setUserRole('worker')
        setRoleLoading(false)
      }
      
      setLoading(false)
    }
    getUser()
  }, [supabase])

  // Fetch user role (kept for backward compatibility, but already fetched above)
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && !userRole) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (userData && !error) {
            const dbUser = userData as User
            setUserRole(dbUser.role)
          } else {
            setUserRole('worker') // Default fallback
          }
        } catch (err) {
          setUserRole('worker') // Default fallback
        }
      } else {
        setUserRole('worker') // No user - default to worker
      }
      setRoleLoading(false)
    }
    fetchUserRole()
  }, [user, supabase])
  
  // Update loading state based on appointments loading
  useEffect(() => {
    if (user && !appointmentsLoading) {
      setLoading(false)
    }
  }, [user, appointmentsLoading])

  // Update enhanced appointments when appointments change
  useEffect(() => {
    if (appointments.length > 0 && tenantTimezone) {
      const enhanced = appointments.map((apt: any) => ({
        id: apt.id,
        tenant_id: apt.tenant_id,
        client_id: apt.client_id,
        service_id: apt.service_id,
        title: apt.title || 'Untitled Appointment',
        description: apt.description || null,
        starts_at: apt.starts_at,
        ends_at: apt.ends_at,
        duration_minutes: apt.duration_minutes || 60,
        status: (apt.status === 'confirmed' || apt.status === 'in_progress' || apt.status === 'no_show') 
          ? 'scheduled' 
          : apt.status as 'scheduled' | 'completed' | 'cancelled',
        priority: apt.priority as 'normal' | 'high' | 'emergency',
        address: apt.address || null,
        city: apt.city || null,
        state: apt.state || null,
        zip_code: apt.zip_code || null,
        coordinates: apt.coordinates || null,
        eta_minutes: apt.eta_minutes || null,
        notes: apt.notes || null,
        created_by: apt.created_by || '',
        created_at: apt.created_at || '',
        updated_at: apt.updated_at || '',
        updated_by: apt.updated_at || '',
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        reminder_sent: false,
        confirmation_sent: false,
        metadata: {},
        clients: apt.clients || null,
        services: apt.services || null,
        users: apt.users || null,
        // Additional fields for display
        startTime: apt.starts_at ? getTimeInTenantTimezone(apt.starts_at, tenantTimezone) : '09:00',
        endTime: apt.ends_at ? getTimeInTenantTimezone(apt.ends_at, tenantTimezone) : '10:00',
        date: apt.starts_at ? getDateInTenantTimezone(apt.starts_at, tenantTimezone) : new Date().toISOString().split('T')[0],
        clientName: apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : undefined,
        serviceName: apt.services?.name
      }))
      
      const calendar = appointments.map((apt: any) => ({
        id: apt.id,
        title: apt.title || 'Untitled Appointment',
        startTime: apt.starts_at ? getTimeInTenantTimezone(apt.starts_at, tenantTimezone) : '09:00',
        endTime: apt.ends_at ? getTimeInTenantTimezone(apt.ends_at, tenantTimezone) : '10:00',
        date: apt.starts_at ? getDateInTenantTimezone(apt.starts_at, tenantTimezone) : new Date().toISOString().split('T')[0],
        status: (apt.status === 'confirmed' || apt.status === 'in_progress' || apt.status === 'no_show') 
          ? 'scheduled' 
          : apt.status as 'scheduled' | 'completed' | 'cancelled',
        clientName: apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : undefined,
        serviceName: apt.services?.name
      }))
      
      setEnhancedAppointments(enhanced)
      setCalendarAppointments(calendar)
    }
  }, [appointments, tenantTimezone])

  const handleAppointmentClick = (appointment: AppointmentListItem) => {
    setSelectedAppointment(appointment)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setSelectedAppointment(null)
  }

  const handleStatusChange = async (
    appointmentId: string, 
    newStatus: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    try {
      await updateAppointmentStatus.mutateAsync({
        appointmentId,
        newStatus
      })
      
      // Refetch appointments to update the UI instantly
      refetchAppointments()
      
      toast.success('Appointment marked as complete')
    } catch (error) {
      toast.error('Failed to update appointment status')
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteAppointment.mutateAsync(appointmentId)
      toast.success('Appointment deleted successfully')
    } catch (error) {
      toast.error('Failed to delete appointment')
    }
  }

  // Bulk actions for selected appointments
  const handleBulkDelete = async () => {
    if (selectedCount === 0) return

    try {
      const selectedAppointments = getSelectedItems(enhancedAppointments, 'id')
      const appointmentIds = selectedAppointments.map(appointment => appointment.id)

      // Delete selected appointments
      const { error } = await supabase
        .from('appointments')
        .delete()
        .in('id', appointmentIds)

      if (error) throw error

      toast.success(`Deleted ${selectedCount} appointments`)
      exitSelectionMode()
      refetchAppointments()
    } catch (error) {
      toast.error('Failed to delete appointments')
    }
  }

  const handleBulkExport = () => {
    const selectedAppointments = getSelectedItems(enhancedAppointments, 'id')
    
    // Create CSV data
    const csvData = selectedAppointments.map(appointment => ({
      'Appointment ID': appointment.id,
      'Title': appointment.title || 'Untitled',
      'Client': appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : 'No client',
      'Service': appointment.services?.name || 'No service',
      'Start Time': appointment.starts_at,
      'End Time': appointment.ends_at,
      'Status': appointment.status,
      'Address': appointment.address || 'No address',
      'Notes': appointment.notes || 'No notes'
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0]) as Array<keyof typeof csvData[0]>
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `appointments-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${selectedCount} appointments`)
    exitSelectionMode()
  }

  const handleEditAppointment = (appointment: AppointmentListItem) => {
    setSelectedAppointment(appointment)
    setIsEditModalOpen(true)
  }

  const handleAppointmentUpdated = (updatedAppointment: AppointmentListItem) => {
    // Update the appointment in the local state
    setEnhancedAppointments(prev => 
      prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
    )
    
    // Update calendar appointments if needed
    setCalendarAppointments(prev => 
      prev.map(apt => apt.id === updatedAppointment.id ? {
        ...apt,
        title: updatedAppointment.title,
        status: updatedAppointment.status
      } : apt)
    )
    
    // Close the edit modal
    setIsEditModalOpen(false)
    setSelectedAppointment(null)
  }

  const handleDeleteAppointmentFromList = (appointment: AppointmentListItem) => {
    setAppointmentToDelete(appointment)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return

    try {
      await handleDeleteAppointment(appointmentToDelete.id)
      setIsDeleteModalOpen(false)
      setAppointmentToDelete(null)
      toast.success('Appointment deleted successfully')
    } catch (error) {
      toast.error('Failed to delete appointment')
    }
  }

  const handleSaveAppointment = async (appointmentId: string, updatedData: any) => {
    try {
      await updateAppointment.mutateAsync({
        appointmentId,
        updatedData
      })
      // Cache invalidation is handled automatically by the mutation hook
    } catch (error) {
      throw error
    }
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    )
  }

  // Create tabs component for header
  const tabsComponent = (
    <div className="flex items-center gap-2">
      <div className="bg-gray-100 rounded-lg p-1 flex">
        <button
          onClick={() => setView('list')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
            view === 'list'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <List className="h-4 w-4" />
          List
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
            view === 'calendar'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </button>
      </div>
    </div>
  )

  return (
    <ResponsiveLayout 
      activeTab="appointments" 
      title="Appointments"
      tabs={tabsComponent}
    >
      <div className="p-6">
          {/* Date Picker and Add Button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <DatePicker
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                  }
                }}
                placeholder="Today"
              />
            </div>
            <div className="flex-shrink-0">
              <AnimatedButton
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                animationType="bounce"
                className="px-3 sm:px-4 py-2 bg-white text-black text-xs sm:text-sm font-medium rounded-lg border border-gray-200 flex items-center gap-1 sm:gap-2 hover:bg-gray-50 whitespace-nowrap"
              >
                <span className="text-sm sm:text-lg">+</span>
                <span className="hidden xs:inline">Add Appointment</span>
                <span className="xs:hidden">Add</span>
              </AnimatedButton>
            </div>
          </div>

          {/* Content based on view */}
          {view === 'calendar' ? (
              <div className="w-full">
                {appointmentsLoading ? (
                  <div className="w-full space-y-6 p-4">
                    <div className="flex justify-center mb-6">
                      <div className="h-12 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                    </div>
                    <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                ) : (
                  <EnhancedCalendar
                    appointments={calendarAppointments}
                    tenantId={tenantId}
                    onAppointmentClick={(appointment: any) => {
                  // Find the full appointment data from enhancedAppointments
                  const fullAppointment = enhancedAppointments.find(apt => apt.id === appointment.id)
                  
                  if (fullAppointment) {
                    // Use the full appointment data with all details
                    handleAppointmentClick(fullAppointment)
                  } else {
                    // Fallback: if appointment not found, create a minimal version
                    // This should rarely happen, but provides a safety net
                    const convertedAppointment: AppointmentListItem = {
                      id: appointment.id,
                      tenant_id: tenantId || '',
                      client_id: '',
                      service_id: null,
                      title: appointment.title,
                      description: null,
                      starts_at: new Date(`${appointment.date}T${appointment.startTime}`).toISOString(),
                      ends_at: new Date(`${appointment.date}T${appointment.endTime}`).toISOString(),
                      duration_minutes: 60,
                      status: appointment.status as 'scheduled' | 'completed' | 'cancelled',
                      priority: 'normal',
                      address: null,
                      city: null,
                      state: null,
                      zip_code: null,
                      coordinates: null,
                      eta_minutes: null,
                      notes: null,
                      created_by: '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      clients: appointment.clientName ? {
                        first_name: appointment.clientName.split(' ')[0] || '',
                        last_name: appointment.clientName.split(' ').slice(1).join(' ') || '',
                        phone: '',
                        email: null,
                        address: null
                      } : null,
                      services: appointment.serviceName ? {
                        id: '',
                        name: appointment.serviceName,
                        description: null,
                        category: null,
                        base_price: null,
                        hourly_rate: null,
                        estimated_duration_minutes: null,
                        is_emergency_service: null,
                        requires_equipment: null
                      } : null,
                      users: null
                    }
                    handleAppointmentClick(convertedAppointment)
                  }
                }}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                />
                )}
              </div>
            ) : (
            <AppointmentsList 
              tenantId={tenantId}
              selectedDate={selectedDate}
              onAppointmentClick={handleAppointmentClick}
              onAddAppointment={() => setIsAddModalOpen(true)}
              onEditAppointment={handleEditAppointment}
              onDeleteAppointment={handleDeleteAppointmentFromList}
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
            )}

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

          {/* Modals */}
          {selectedAppointment && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            isOpen={isDetailModalOpen}
            onClose={handleCloseModal}
            onStatusChange={handleStatusChange}
            onSave={handleSaveAppointment}
          />
          )}

          <AddAppointmentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAppointmentAdded={() => {
              setIsAddModalOpen(false)
              refetchAppointments()
            }}
            tenantId={tenantId}
          />

          <EditAppointmentModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedAppointment(null)
            }}
            appointment={selectedAppointment}
            onAppointmentUpdated={handleAppointmentUpdated}
            tenantId={tenantId}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setAppointmentToDelete(null)
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Appointment"
            description="Are you sure you want to delete this appointment? This action cannot be undone."
            itemName={appointmentToDelete?.title || 'Appointment'}
            itemType="appointment"
          />
        </div>
      
      <BottomNav activeTab="appointments" />
    </ResponsiveLayout>
  )
}

export default function AppointmentsPage() {
  return (
    <PageErrorBoundary pageName="Appointments">
      <AppointmentsPageContent />
    </PageErrorBoundary>
  )
}