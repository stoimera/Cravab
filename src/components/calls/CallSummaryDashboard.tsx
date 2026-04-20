'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  CheckCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CallDetailsModal } from './CallDetailsModal'
import { CallbackScheduler } from './CallbackScheduler'
import { ServiceConfirmationModal } from './ServiceConfirmationModal'
import { LongPressCard } from '@/components/mobile/LongPressCard'
import { APIErrorBoundary } from '@/components/APIErrorBoundary'
import { toast } from 'sonner'
import { useMobileAnimation } from '@/lib/animations/MobileAnimationManager'
import { getCallDisplayName } from '@/lib/call-utils'

interface CallSummary {
  id: string
  vapi_call_id: string | null
  from_number: string | null
  to_number?: string | null
  direction?: 'inbound' | 'outbound'
  status: string
  duration_seconds: number | null
  recording_url?: string | null
  transcript: string | null
  ai_summary: string | null
  ai_sentiment: string | null
  ai_intent: string | null
  follow_up_required: boolean | null
  follow_up_notes: string | null
  metadata?: any
  created_at: string
  updated_at: string
  clients?: {
    first_name: string
    last_name: string
    phone: string
    email: string | null
  } | null
  appointments?: any[]
}

interface CallSummaryDashboardProps {
  tenantId: string
  activeTab?: string
  calls?: any[]
  loading?: boolean
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


export function CallSummaryDashboard({ 
  tenantId, 
  activeTab: externalActiveTab = 'all', 
  calls: externalCalls, 
  loading: externalLoading,
  userRole,
  isSelectionEnabled = false,
  isSelectionMode = false,
  selectedItems = new Set(),
  onLongPress,
  onToggleSelection,
  isSelected,
  longPressDuration = 1500
}: CallSummaryDashboardProps) {
  const [calls, setCalls] = useState<CallSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<CallSummary | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCallbackScheduler, setShowCallbackScheduler] = useState(false)
  const [showServiceConfirmation, setShowServiceConfirmation] = useState(false)
  const [activeTab, setActiveTab] = useState(externalActiveTab)
  const [clientLookupCache, setClientLookupCache] = useState<Map<string, { first_name: string; last_name: string } | null>>(new Map())
  const lookedUpNumbersRef = useRef<Set<string>>(new Set())
  
  const supabase = createClient()

  // Lookup clients by phone number for calls without client data
  useEffect(() => {
    const lookupClients = async () => {
      if (!calls.length || !tenantId) return

      const phoneNumbersToLookup = calls
        .filter(call => {
          // Only lookup if no client is joined AND we haven't looked up this number yet
          return call.from_number && !call.clients && !lookedUpNumbersRef.current.has(call.from_number)
        })
        .map(call => call.from_number!)
        .filter((phone, index, self) => self.indexOf(phone) === index) // Unique numbers

      if (phoneNumbersToLookup.length === 0) return

      // Mark these numbers as being looked up
      phoneNumbersToLookup.forEach(phone => lookedUpNumbersRef.current.add(phone))

      try {
        const { data: clients, error } = await supabase
          .from('clients')
          .select('phone, first_name, last_name')
          .eq('tenant_id', tenantId)
          .in('phone', phoneNumbersToLookup)

        if (error) throw error

        setClientLookupCache(prevCache => {
          const newCache = new Map(prevCache)
          clients?.forEach(client => {
            if (client.phone) {
              newCache.set(client.phone, {
                first_name: client.first_name || '',
                last_name: client.last_name || ''
              })
            }
          })

          // Also cache null for numbers that weren't found
          phoneNumbersToLookup.forEach(phone => {
            if (!newCache.has(phone)) {
              newCache.set(phone, null)
            }
          })

          return newCache
        })
      } catch (error) {
        logger.error('Error looking up clients:', error)
        // Remove from ref on error so we can retry
        phoneNumbersToLookup.forEach(phone => lookedUpNumbersRef.current.delete(phone))
      }
    }

    lookupClients()
  }, [calls, tenantId, supabase])

  // Use external calls data if provided, otherwise fetch from database
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('calls')
          .select(`
            id,
            vapi_call_id,
            from_number,
            status,
            duration_seconds,
            transcript,
            ai_summary,
            ai_sentiment,
            ai_intent,
            follow_up_required,
            follow_up_notes,
            created_at,
            updated_at,
            clients (
              first_name,
              last_name,
              phone,
              email
            )
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setCalls(data || [])
      } catch (error) {
        logger.error('Error fetching calls:', error)
      } finally {
        setLoading(false)
      }
    }

    if (externalCalls && externalLoading !== undefined) {
      // Use external data
      setCalls(externalCalls as CallSummary[])
      setLoading(externalLoading)
    } else {
      // Fetch from database
      fetchCalls()
    }
  }, [tenantId, externalCalls, externalLoading, supabase])

  // Separate fetchCalls function for external use
  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('calls')
        .select(`
          id,
          vapi_call_id,
          from_number,
          status,
          duration_seconds,
          transcript,
          ai_summary,
          ai_sentiment,
          ai_intent,
          follow_up_required,
          follow_up_notes,
          created_at,
          updated_at,
          clients (
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setCalls(data || [])
    } catch (error) {
      // Silently handle fetch errors
    } finally {
      setLoading(false)
    }
  }, [supabase, tenantId])

  // Update activeTab when external prop changes
  useEffect(() => {
    setActiveTab(externalActiveTab)
  }, [externalActiveTab])

  const getFilteredCalls = () => {
    switch (activeTab) {
      case 'follow-up':
        return calls.filter(call => call.follow_up_required)
      default:
        return calls
    }
  }

  const getCallStats = () => {
    const total = calls.length
    const followUpRequired = calls.filter(c => c.follow_up_required).length
    const positiveSentiment = calls.filter(c => c.ai_sentiment === 'positive').length

    return { total, followUpRequired, positiveSentiment }
  }

  const handleViewDetails = (call: CallSummary) => {
    setSelectedCall(call)
    setShowDetailsModal(true)
  }

  const handleScheduleCallback = (call: CallSummary) => {
    setSelectedCall(call)
    setShowCallbackScheduler(true)
  }

  const handleServiceConfirmation = (call: CallSummary) => {
    setSelectedCall(call)
    setShowServiceConfirmation(true)
  }

  const handleCreateAppointment = async (callId: string) => {
    // TODO: Implement appointment creation
  }

  const handleMarkFollowUpComplete = async (callId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}/follow-up`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          follow_up_required: false,
          follow_up_completed_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update follow-up')
      }

      // Show success notification
      toast.success('Follow-up marked as complete')
      
      // Update the specific call in state instead of refetching all
      setCalls(prev => prev.map(call => 
        call.id === callId 
          ? { ...call, follow_up_required: false, follow_up_completed_at: new Date().toISOString() }
          : call
      ))
    } catch (error) {
      toast.error('Failed to mark follow-up as complete')
    }
  }

  const stats = getCallStats()
  const filteredCalls = getFilteredCalls()
  const { shouldAnimate } = useMobileAnimation()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'started':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      case 'failed':
      case 'busy':
      case 'no_answer':
        return 'bg-red-100 text-red-800 border border-red-300'
      case 'ringing':
        return 'bg-gray-100 text-gray-800 border border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  const handleClick = (call: CallSummary) => {
    handleViewDetails(call)
  }

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1
    },
    whileHover: shouldAnimate() ? { 
      y: -2,
      scale: 1.02,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    } : {},
    whileTap: shouldAnimate() ? { 
      scale: 0.98
    } : {}
  }

  if (loading) {
    return <div className="p-6">Loading call summaries...</div>
  }

  return (
    <APIErrorBoundary context="call summaries">
      <div className="space-y-4">
          {filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No calls found in this category</p>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <LongPressCard
                key={call.id}
                onLongPress={isSelectionEnabled ? onLongPress : undefined}
                onSelect={isSelectionMode && onToggleSelection ? () => onToggleSelection(call.id) : undefined}
                onDeselect={isSelectionMode && onToggleSelection ? () => onToggleSelection(call.id) : undefined}
                isSelected={isSelectionMode && isSelected ? isSelected(call.id) : false}
                duration={longPressDuration}
                showSelectionUI={isSelectionMode}
                className="mb-3"
                // Action modal props
                cardType="call"
                onAction={(action) => {
                  switch (action) {
                    case 'view':
                      // Open call details modal
                      setSelectedCall(call)
                      setShowDetailsModal(true)
                      break
                    case 'edit':
                      // TODO: Implement edit functionality
                      break
                    case 'export':
                      // TODO: Implement export functionality
                      break
                    case 'delete':
                      // TODO: Implement delete functionality
                      break
                  }
                }}
                showActionModal={false} // Only open on long press, not regular click
                userRole={userRole}
              >
                <motion.div 
                  className="bg-white rounded-lg p-3 sm:p-4 hover:bg-gray-50 cursor-pointer border border-gray-200 shadow-sm"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="whileHover"
                  whileTap="whileTap"
                  transition={{
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  style={{ willChange: 'transform, opacity' }}
                  onClick={() => handleClick(call)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header with caller name and status */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const displayInfo = getCallDisplayName(call, clientLookupCache)
                            
                            return (
                              <>
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                  {displayInfo.name}
                                </h3>
                                {displayInfo.showPhone && call.from_number && (
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    {call.from_number}
                                  </p>
                                )}
                              </>
                            )
                          })()}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <Badge className={`${getStatusColor(call.status)} text-xs px-2 py-1`}>
                            {call.status.replace('_', ' ')}
                          </Badge>
                          {call.duration_seconds && (
                            <p className="text-xs text-gray-500">
                              {Math.round(call.duration_seconds / 60)}m
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        {call.ai_sentiment && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            call.ai_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            call.ai_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {call.ai_sentiment}
                          </span>
                        )}
                        {call.follow_up_required && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            Follow-up Required
                          </span>
                        )}
                      </div>

                      {/* AI Summary */}
                      {call.ai_summary && (
                        <div className="mb-2">
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                            {call.ai_summary}
                          </p>
                        </div>
                      )}

                      {/* Follow-up Notes */}
                      {call.follow_up_notes && (
                        <div className="mb-2">
                          <p className="text-xs sm:text-sm text-orange-600 leading-relaxed line-clamp-2">
                            {call.follow_up_notes}
                          </p>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                          <span className="truncate">
                            {(() => {
                              const dateToUse = call.created_at || call.updated_at;
                              if (dateToUse) {
                                try {
                                  return formatDistanceToNow(new Date(dateToUse), { addSuffix: true });
                                } catch (error) {
                                  return 'Invalid date';
                                }
                              }
                              return 'Unknown time';
                            })()}
                          </span>
                        </div>
                        {call.duration_seconds && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <span>{Math.round(call.duration_seconds / 60)} min duration</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons - positioned outside clickable content area */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(call)
                          }}
                          className="flex-1 h-8 text-xs px-3 border-gray-200"
                        >
                          View Details
                        </Button>

                        {call.follow_up_required && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkFollowUpComplete(call.id)
                            }}
                            className="flex-1 h-8 text-xs px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </LongPressCard>
            ))
          )}
      </div>

      {/* Modals */}
      {selectedCall && (
        <>
          <CallDetailsModal
            call={selectedCall}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
          />

          <CallbackScheduler
            call={selectedCall}
            tenantId={tenantId}
            isOpen={showCallbackScheduler}
            onClose={() => setShowCallbackScheduler(false)}
            onScheduled={() => {
              setShowCallbackScheduler(false)
              fetchCalls()
            }}
          />

          <ServiceConfirmationModal
            call={selectedCall}
            tenantId={tenantId}
            isOpen={showServiceConfirmation}
            onClose={() => setShowServiceConfirmation(false)}
            onConfirmed={() => {
              setShowServiceConfirmation(false)
              fetchCalls()
            }}
          />
        </>
      )}
    </APIErrorBoundary>
  )
}
