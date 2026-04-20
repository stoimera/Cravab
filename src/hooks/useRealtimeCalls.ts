'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAutoCreateClient } from './useAutoCreateClient'
import { useQueryClient } from '@tanstack/react-query'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'

// Use raw database format for compatibility with CallSummaryDashboard
interface Call {
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
}

interface UseRealtimeCallsProps {
  tenantId: string
  enabled?: boolean
  onCallUpdate?: (call: Call) => void
  onNewCall?: (call: Call) => void
}

export function useRealtimeCalls({ tenantId, enabled = true, onCallUpdate, onNewCall }: UseRealtimeCallsProps) {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { autoCreateFromCall } = useAutoCreateClient({ tenantId })

  // Fetch initial calls
  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // If not enabled or no tenantId, return empty array
      if (!enabled || !tenantId) {
        setCalls([])
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      
      // Return raw data for CallSummaryDashboard compatibility
      setCalls((data as Call[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calls')
      setCalls([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [enabled, tenantId, supabase])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enabled || !tenantId) return

    fetchCalls()

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Subscribe to call changes
    const callsSubscription = supabase
      .channel('calls_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenantId}`
        },
        async (payload) => {
          
          // Set query client for cache invalidation service
          simplifiedCacheManager.setQueryClient(queryClient)
          
          const callData = payload.new || payload.old
          if (!callData) return

          // Use raw data format for compatibility
          const formattedCall: Call = callData as Call

          if (payload.eventType === 'INSERT') {
            setCalls(prev => [formattedCall, ...prev])
            onNewCall?.(formattedCall)
            
            // Invalidate React Query cache immediately
            queryClient.invalidateQueries({ queryKey: ['calls', { tenantId }] })
            
            // Invalidate all cache layers
            await simplifiedCacheManager.invalidateData({
              tenantId,
              dataType: 'calls',
              specificId: formattedCall.id,
              warmCache: true
            })
            
            // Auto-create client for new callers
            try {
              await autoCreateFromCall({
                caller: 'Unknown Caller', // We'll need to get this from client data
                phone: formattedCall.from_number || formattedCall.to_number || 'Unknown',
                email: undefined // Could be extracted from call data if available
              })
            } catch (error) {
              // Silently handle auto-create client errors
            }
          } else if (payload.eventType === 'UPDATE') {
            setCalls(prev => 
              prev.map(call => call.id === formattedCall.id ? formattedCall : call)
            )
            onCallUpdate?.(formattedCall)
            
            // Invalidate React Query cache for updates
            queryClient.invalidateQueries({ queryKey: ['calls', { tenantId }] })
            
            // Invalidate all cache layers
            await simplifiedCacheManager.invalidateData({
              tenantId,
              dataType: 'calls',
              specificId: formattedCall.id,
              warmCache: true
            })
          } else if (payload.eventType === 'DELETE') {
            setCalls(prev => prev.filter(call => call.id !== (callData as any).id))
            
            // Invalidate React Query cache for deletions
            queryClient.invalidateQueries({ queryKey: ['calls', { tenantId }] })
            
            // Invalidate all cache layers
            await simplifiedCacheManager.invalidateData({
              tenantId,
              dataType: 'calls',
              specificId: (callData as any).id,
              warmCache: true
            })
          }
        }
      )
      .subscribe()

    // Subscribe to recording processing updates
    const recordingSubscription = supabase
      .channel('recording_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          if ((payload.new as any).recording_url && !(payload.old as any).recording_url) {
            // Update the specific call with recording URL
            setCalls(prev => 
              prev.map(call => 
                call.id === (payload.new as any).id 
                  ? { ...call, recording_url: (payload.new as any).recording_url }
                  : call
              )
            )
          }
        }
      )
      .subscribe()

    // Subscribe to transcript processing updates
    const transcriptSubscription = supabase
      .channel('transcript_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          if ((payload.new as any).transcript && !(payload.old as any).transcript) {
            // Update the specific call with transcript
            setCalls(prev => 
              prev.map(call => 
                call.id === (payload.new as any).id 
                  ? { ...call, transcript: (payload.new as any).transcript }
                  : call
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      callsSubscription.unsubscribe()
      recordingSubscription.unsubscribe()
      transcriptSubscription.unsubscribe()
    }
  }, [enabled, tenantId, fetchCalls])

  return {
    calls,
    loading,
    error,
    refetch: fetchCalls
  }
}
