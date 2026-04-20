'use client'

import { useEffect, useState, useMemo } from 'react'
import { AppointmentCard } from './AppointmentCard'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedListItem } from '@/components/ui/AnimatedList'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { useAppointments } from '@/hooks/useQueries'
import { isSameDay, isAfter, isBefore, startOfDay } from 'date-fns'
import { Database } from '@/types/database-comprehensive'

// Use proper types from database schema
type Appointment = Database['public']['Tables']['appointments']['Row']

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
  status: 'scheduled' | 'completed' | 'cancelled'
  priority: 'normal' | 'high' | 'emergency'
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  coordinates: Record<string, unknown> | null
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

interface AppointmentsListProps {
  tenantId: string
  selectedDate?: Date
  onAppointmentClick?: (appointment: AppointmentListItem) => void
  onAddAppointment?: () => void
  onEditAppointment?: (appointment: AppointmentListItem) => void
  onDeleteAppointment?: (appointment: AppointmentListItem) => void
  userRole?: string
  // Selection props
  isSelectionEnabled?: boolean
  isSelectionMode?: boolean
  selectedItems?: Set<string>
  onLongPress?: () => void
  onToggleSelection?: (id: string) => void
  isSelected?: (id: string) => boolean
  longPressDuration?: number
}

function AppointmentsListContent({ 
  tenantId, 
  selectedDate = new Date(),
  onAppointmentClick, 
  onAddAppointment, 
  onEditAppointment, 
  onDeleteAppointment, 
  userRole,
  // Selection props
  isSelectionEnabled = false,
  isSelectionMode = false,
  selectedItems = new Set(),
  onLongPress,
  onToggleSelection,
  isSelected,
  longPressDuration = 1500
}: AppointmentsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const appointmentsPerPage = 10

  // Use React Query hook for data fetching with real-time updates
  const { 
    data: appointments = [], 
    isLoading: loading, 
    error: appointmentsError,
    refetch: refetchAppointments
  } = useAppointments(tenantId)

  // Sort appointments based on selected date
  const sortedAppointments = useMemo(() => {
    if (!appointments.length) return []

    const selectedDateStart = startOfDay(selectedDate)
    
    return [...appointments].sort((a: any, b: any) => {
      const aDate = new Date(a.starts_at)
      const bDate = new Date(b.starts_at)
      
      // Check if appointments are on the selected date
      const aIsOnSelectedDate = isSameDay(aDate, selectedDateStart)
      const bIsOnSelectedDate = isSameDay(bDate, selectedDateStart)
      
      // Check if appointments are after the selected date
      const aIsAfterSelectedDate = isAfter(aDate, selectedDateStart)
      const bIsAfterSelectedDate = isAfter(bDate, selectedDateStart)
      
      // Check if appointments are before the selected date
      const aIsBeforeSelectedDate = isBefore(aDate, selectedDateStart)
      const bIsBeforeSelectedDate = isBefore(bDate, selectedDateStart)
      
      // Priority 1: Appointments on the selected date (sorted by time)
      if (aIsOnSelectedDate && !bIsOnSelectedDate) return -1
      if (!aIsOnSelectedDate && bIsOnSelectedDate) return 1
      
      // Priority 2: Appointments after the selected date (sorted by time)
      if (aIsAfterSelectedDate && !bIsAfterSelectedDate) return -1
      if (!aIsAfterSelectedDate && bIsAfterSelectedDate) return 1
      
      // Priority 3: Appointments before the selected date (sorted by time, most recent first)
      if (aIsBeforeSelectedDate && !bIsBeforeSelectedDate) return 1
      if (!aIsBeforeSelectedDate && bIsBeforeSelectedDate) return -1
      
      // Within the same priority group, sort by start time
      return aDate.getTime() - bDate.getTime()
    })
  }, [appointments, selectedDate])

  // Calculate total pages when sorted appointments change
  useEffect(() => {
    const pages = Math.ceil(sortedAppointments.length / appointmentsPerPage)
    setTotalPages(pages)
    
    // Reset to page 1 if current page is beyond total pages
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1)
    }
  }, [sortedAppointments.length, currentPage])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} className="h-24" />
        ))}
      </div>
    )
  }

  // Pagination logic
  const getCurrentPageAppointments = () => {
    const startIndex = (currentPage - 1) * appointmentsPerPage
    const endIndex = startIndex + appointmentsPerPage
    return sortedAppointments.slice(startIndex, endIndex)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Smart pagination logic (same as clients page)
  const getPaginationItems = () => {
    const items: (number | string)[] = []
    const totalPagesNum = totalPages
    
    if (totalPagesNum <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPagesNum; i++) {
        items.push(i)
      }
    } else {
      // Smart pagination for more than 7 pages
      const current = currentPage
      
      if (current <= 4) {
        // Show: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) {
          items.push(i)
        }
        items.push('...')
        items.push(totalPagesNum)
      } else if (current >= totalPagesNum - 3) {
        // Show: 1, ..., last-4, last-3, last-2, last-1, last
        items.push(1)
        items.push('...')
        for (let i = totalPagesNum - 4; i <= totalPagesNum; i++) {
          items.push(i)
        }
      } else {
        // Show: 1, ..., current, current+1, ..., last
        items.push(1)
        items.push('...')
        items.push(current, current + 1)
        items.push('...')
        items.push(totalPagesNum)
      }
    }
    
    return items
  }

  if (sortedAppointments.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-8 w-8 text-gray-400" />}
        title="No appointments"
        description="Schedule your first appointment to get started"
        actionLabel="Create Appointment"
        onAction={onAddAppointment || (() => {})}
      />
    )
  }

  const currentPageAppointments = getCurrentPageAppointments()

  return (
    <div className="pb-24 mb-6 sm:mb-8">
      {/* Appointment Cards */}
      <div className="space-y-4">
        {currentPageAppointments.map((appointment: any, index) => (
          <AnimatedListItem 
            key={appointment.id} 
            index={index}
            animationType="fade"
            staggerDelay={index * 50}
            enableSwipeToDelete={false}
            onDelete={() => {}}
            isDeleting={false}
          >
            <AppointmentCard
              appointment={appointment as unknown as AppointmentListItem}
              onClick={() => onAppointmentClick?.(appointment as unknown as AppointmentListItem)}
              onEdit={() => onEditAppointment?.(appointment as unknown as AppointmentListItem)}
              onDelete={() => onDeleteAppointment?.(appointment as unknown as AppointmentListItem)}
              userRole={userRole}
              // Selection props
              isSelectionEnabled={isSelectionEnabled}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected ? isSelected(appointment.id) : false}
              onLongPress={isSelectionEnabled ? onLongPress : undefined}
              onToggleSelection={isSelectionMode && onToggleSelection ? () => onToggleSelection(appointment.id) : undefined}
              longPressDuration={longPressDuration}
            />
          </AnimatedListItem>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          {/* Pagination Buttons */}
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {getPaginationItems().map((item, index) => (
                item === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(item as number)}
                    className={`w-8 h-8 p-0 ${
                      currentPage === item 
                        ? 'bg-gray-100 text-gray-900 border-gray-300' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {item}
                  </Button>
                )
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  )
}

export function AppointmentsList(props: AppointmentsListProps) {
  return (
    <APIErrorBoundary context="appointments list">
      <AppointmentsListContent {...props} />
    </APIErrorBoundary>
  )
}