'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { ClientCard } from './ClientCard'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Client } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { useClients } from '@/hooks/useQueries'
import { useAuth } from '@/components/providers'
import { AnimatedListItem } from '@/components/ui/AnimatedList'

interface ClientsListProps {
  tenantId: string
  onAddClient?: () => void
  searchQuery?: string
  // Selection props
  isSelectionEnabled?: boolean
  isSelectionMode?: boolean
  selectedItems?: Set<string>
  onLongPress?: () => void
  onToggleSelection?: (id: string) => void
  isSelected?: (id: string) => boolean
  longPressDuration?: number
  onClientsLoaded?: (clients: any[]) => void
}

export function ClientsList({ 
  tenantId, 
  onAddClient, 
  searchQuery = '',
  isSelectionEnabled = false,
  isSelectionMode = false,
  selectedItems = new Set(),
  onLongPress,
  onToggleSelection,
  isSelected,
  longPressDuration = 1500,
  onClientsLoaded
}: ClientsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth()
  const clientsPerPage = 10
  const hasNotifiedParent = useRef(false)

  // Fetch clients data with proper error handling
  const { 
    data: clients = [], 
    isLoading, 
    error,
    refetch
  } = useClients(tenantId)

  // Notify parent of clients data (only once when data is loaded)
  useEffect(() => {
    if (clients && clients.length > 0 && onClientsLoaded && !hasNotifiedParent.current) {
      onClientsLoaded(clients)
      hasNotifiedParent.current = true
    }
  }, [clients, onClientsLoaded])

  // React Query automatically handles cache invalidation and refetching

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    
    const query = searchQuery.toLowerCase()
    return (clients as Client[]).filter((client: Client) => {
      const searchableFields = [
        client.first_name,
        client.last_name,
        client.email,
        client.phone,
        client.address,
        client.city,
        client.state,
        client.zip_code,
        client.notes
      ].filter(Boolean).join(' ').toLowerCase()
      
      return searchableFields.includes(query)
    })
  }, [clients, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage)
  const startIndex = (currentPage - 1) * clientsPerPage
  const endIndex = startIndex + clientsPerPage
  const currentPageClients = filteredClients.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} className="h-20" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading clients</div>
        <div className="text-sm text-gray-600 mb-4">{error.message}</div>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </div>
    )
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-gray-400" />}
        title="No clients yet"
        description="Add your first client to get started"
        actionLabel="Add Client"
        onAction={onAddClient || (() => {})}
      />
    )
  }

  // No search results
  if (filteredClients.length === 0 && searchQuery.trim()) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-gray-400" />}
        title="No clients found"
        description={`No clients match "${searchQuery}"`}
        actionLabel="Clear Search"
        onAction={() => window.location.reload()}
      />
    )
  }

  // Pagination handlers
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

  // Smart pagination logic
  const getPaginationItems = () => {
    const items = []
    const maxVisiblePages = 3 // Show current page + next page + last page
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      // Always show first page
      items.push(1)
      
      if (currentPage <= 3) {
        // Show: 1, 2, 3, ..., last
        items.push(2, 3)
        items.push('...')
        items.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Show: 1, ..., last-2, last-1, last
        items.push('...')
        items.push(totalPages - 2, totalPages - 1, totalPages)
      } else {
        // Show: 1, ..., current, current+1, ..., last
        items.push('...')
        items.push(currentPage, currentPage + 1)
        items.push('...')
        items.push(totalPages)
      }
    }
    
    return items
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Client Cards */}
      <div className="space-y-4">
        {(currentPageClients as Client[]).map((client: Client, index: number) => (
          <AnimatedListItem 
            key={client.id} 
            index={index}
            animationType="fade"
            staggerDelay={index * 50}
            enableSwipeToDelete={false}
            onDelete={() => {}}
            isDeleting={false}
          >
            <ClientCard 
              client={client} 
              // Selection props
              isSelectionEnabled={isSelectionEnabled}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected ? isSelected(client.id) : false}
              onLongPress={isSelectionEnabled ? onLongPress : undefined}
              onToggleSelection={isSelectionMode && onToggleSelection ? () => onToggleSelection(client.id) : undefined}
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
          
          {/* Pagination Info - Now below the controls */}
          <div className="text-center text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} clients
            {searchQuery.trim() && ` (filtered from ${clients.length} total)`}
          </div>
        </div>
      )}
    </div>
  )
}