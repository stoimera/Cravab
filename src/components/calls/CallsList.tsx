'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CallCard } from './CallCard'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone } from 'lucide-react'
import { CallWithClient } from '@/types/database-comprehensive'
import { useCalls } from '@/hooks/useQueries'
import { useAppContext } from '@/contexts/AppContext'

type Call = CallWithClient

interface CallsListProps {
  tenantId: string
  statusFilter?: string
}

export function CallsList({ tenantId, statusFilter = 'all' }: CallsListProps) {
  const [error, setError] = useState('')
  
  // Use React Query for data fetching
  const { data: allCalls = [], isLoading: loading, error: queryError, refetch } = useCalls(tenantId)
  
  // Type assertion to ensure proper typing
  const typedCalls = allCalls as Call[]
  
  // Handle query errors
  useEffect(() => {
    if (queryError) {
      // Check if it's an RLS policy error (infinite recursion, etc.)
      if (queryError.message?.includes('infinite recursion') || queryError.message?.includes('42P17')) {
        // RLS policy error detected, showing empty state instead of error
        setError('')
        return
      }
      
      // For other errors, show the error message
      setError(`Failed to load calls: ${queryError.message}`)
    } else {
      setError('')
    }
  }, [queryError])

  const filteredCalls = typedCalls.filter((call: Call) => {
    switch (statusFilter) {
      case 'completed':
        return call.status === 'completed'
      case 'in_progress':
        return call.status === 'in_progress'
      case 'failed':
        return call.status === 'failed' || call.status === 'busy' || call.status === 'no_answer'
      case 'with_transcript':
        return call.transcript && call.transcript.length > 0
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} className="h-24" />
        ))}
      </div>
    )
  }


  return (
    <div className="space-y-4">
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <Phone className="h-5 w-5" />
            <span className="font-medium">Error loading calls</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button 
            onClick={() => {
              setError('')
              refetch()
            }}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Calls List or Empty State */}
      {!error && filteredCalls.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {allCalls.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
              <p className="text-gray-600">Your incoming calls will appear here</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
              <p className="text-gray-600">Try changing the filter to see more calls</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call) => (
            <CallCard key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  )
}
