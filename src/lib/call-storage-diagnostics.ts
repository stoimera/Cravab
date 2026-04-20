import { logger } from '@/lib/logger'
/**
 * Call Storage Diagnostics
 * Tools to diagnose and fix call storage issues
 */

import { createClient } from '@/lib/supabase/client'

export interface CallStorageDiagnostic {
  totalCalls: number
  callsWithTranscripts: number
  callsWithValidTimestamps: number
  duplicateCalls: number
  recentCalls: number
  issues: string[]
  recommendations: string[]
}

export class CallStorageDiagnostics {
  private supabase = createClient()

  /**
   * Run comprehensive call storage diagnostics
   */
  async runDiagnostics(tenantId: string): Promise<CallStorageDiagnostic> {
    const diagnostic: CallStorageDiagnostic = {
      totalCalls: 0,
      callsWithTranscripts: 0,
      callsWithValidTimestamps: 0,
      duplicateCalls: 0,
      recentCalls: 0,
      issues: [],
      recommendations: []
    }

    try {
      // Get all calls for tenant
      const { data: calls, error } = await this.supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) {
        diagnostic.issues.push(`Database error: ${error.message}`)
        return diagnostic
      }

      diagnostic.totalCalls = calls?.length || 0

      if (diagnostic.totalCalls === 0) {
        diagnostic.issues.push('No calls found in database')
        diagnostic.recommendations.push('Check if VAPI webhooks are being received')
        return diagnostic
      }

      // Check for calls with transcripts
      const callsWithTranscripts = calls?.filter((call: any) =>
        call.transcript && call.transcript.trim() !== '' && call.transcript !== '[No transcript available]'
      ) || []
      diagnostic.callsWithTranscripts = callsWithTranscripts.length

      // Check for calls with valid timestamps
      const now = new Date()
      const callsWithValidTimestamps = calls?.filter((call: any) => 
        call.started_at && call.ended_at && 
        new Date(call.started_at) <= now && 
        new Date(call.ended_at) <= now
      ) || []
      diagnostic.callsWithValidTimestamps = callsWithValidTimestamps.length

      // Check for duplicate calls (same vapi_call_id)
      const vapiCallIds = calls?.map((call: any) => call.vapi_call_id).filter(Boolean) || []
      const uniqueVapiCallIds = new Set(vapiCallIds)
      diagnostic.duplicateCalls = vapiCallIds.length - uniqueVapiCallIds.size

      // Check recent calls (last 24 hours)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const recentCalls = calls?.filter((call: any) =>
        new Date(call.created_at) > oneDayAgo
      ) || []
      diagnostic.recentCalls = recentCalls.length

      // Identify issues
      if (diagnostic.callsWithTranscripts < diagnostic.totalCalls * 0.8) {
        diagnostic.issues.push(`${diagnostic.totalCalls - diagnostic.callsWithTranscripts} calls missing transcripts`)
      }

      if (diagnostic.callsWithValidTimestamps < diagnostic.totalCalls * 0.9) {
        diagnostic.issues.push(`${diagnostic.totalCalls - diagnostic.callsWithValidTimestamps} calls have invalid timestamps`)
      }

      if (diagnostic.duplicateCalls > 0) {
        diagnostic.issues.push(`${diagnostic.duplicateCalls} duplicate calls found`)
      }

      if (diagnostic.recentCalls === 0 && diagnostic.totalCalls > 0) {
        diagnostic.issues.push('No recent calls found (last 24 hours)')
      }

      // Generate recommendations
      if (diagnostic.issues.length === 0) {
        diagnostic.recommendations.push('Call storage appears to be working correctly')
      } else {
        if (diagnostic.callsWithTranscripts < diagnostic.totalCalls * 0.8) {
          diagnostic.recommendations.push('Check VAPI webhook transcript handling')
        }
        if (diagnostic.duplicateCalls > 0) {
          diagnostic.recommendations.push('Remove duplicate call storage in webhook handler')
        }
        if (diagnostic.recentCalls === 0) {
          diagnostic.recommendations.push('Check if VAPI webhooks are being received recently')
        }
      }

    } catch (error) {
      diagnostic.issues.push(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return diagnostic
  }

  /**
   * Clean up duplicate calls
   */
  async cleanupDuplicates(tenantId: string): Promise<{ removed: number; errors: string[] }> {
    const result = { removed: 0, errors: [] as string[] }

    try {
      // Find duplicate calls by vapi_call_id
      const { data: calls, error: fetchError } = await this.supabase
        .from('calls')
        .select('id, vapi_call_id, created_at')
        .eq('tenant_id', tenantId)
        .not('vapi_call_id', 'is', null)
        .order('created_at', { ascending: false })

      if (fetchError) {
        result.errors.push(`Error fetching calls: ${fetchError.message}`)
        return result
      }

      // Group by vapi_call_id
      const callGroups = new Map<string, any[]>()
      calls?.forEach((call: any) => {
        if (call.vapi_call_id) {
          if (!callGroups.has(call.vapi_call_id)) {
            callGroups.set(call.vapi_call_id, [])
          }
          callGroups.get(call.vapi_call_id)!.push(call)
        }
      })

      // Remove duplicates (keep the most recent)
      for (const [vapiCallId, callGroup] of callGroups) {
        if (callGroup.length > 1) {
          // Sort by created_at descending, keep the first (most recent)
          callGroup.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          
          // Remove all but the first
          const toRemove = callGroup.slice(1)
          for (const callToRemove of toRemove) {
            const { error: deleteError } = await this.supabase
              .from('calls')
              .delete()
              .eq('id', callToRemove.id)

            if (deleteError) {
              result.errors.push(`Error removing duplicate call ${callToRemove.id}: ${deleteError.message}`)
            } else {
              result.removed++
            }
          }
        }
      }

    } catch (error) {
      result.errors.push(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Get call storage statistics
   */
  async getStorageStats(tenantId: string): Promise<{
    totalCalls: number
    callsByStatus: Record<string, number>
    callsByDay: Record<string, number>
    averageCallDuration: number
    callsWithTranscripts: number
    callsWithoutTranscripts: number
  }> {
    const stats = {
      totalCalls: 0,
      callsByStatus: {} as Record<string, number>,
      callsByDay: {} as Record<string, number>,
      averageCallDuration: 0,
      callsWithTranscripts: 0,
      callsWithoutTranscripts: 0
    }

    try {
      const { data: calls, error } = await this.supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', tenantId)

      if (error) {
        logger.error('Error fetching call stats:', error)
        return stats
      }

      stats.totalCalls = calls?.length || 0

      // Group by status
      calls?.forEach((call: any) => {
        stats.callsByStatus[call.status] = (stats.callsByStatus[call.status] || 0) + 1
      })

      // Group by day
      calls?.forEach((call: any) => {
        const day = new Date(call.created_at).toISOString().split('T')[0]
        stats.callsByDay[day] = (stats.callsByDay[day] || 0) + 1
      })

      // Calculate average duration
      const callsWithDuration = calls?.filter((call: any) => call.duration_seconds && call.duration_seconds > 0) || []
      if (callsWithDuration.length > 0) {
        const totalDuration = callsWithDuration.reduce((sum: number, call: any) => sum + (call.duration_seconds || 0), 0)
        stats.averageCallDuration = totalDuration / callsWithDuration.length
      }

      // Count calls with/without transcripts
      stats.callsWithTranscripts = calls?.filter((call: any) => 
        call.transcript && call.transcript.trim() !== '' && call.transcript !== '[No transcript available]'
      ).length || 0
      stats.callsWithoutTranscripts = stats.totalCalls - stats.callsWithTranscripts

    } catch (error) {
      logger.error('Error calculating call stats:', error)
    }

    return stats
  }
}

export const callStorageDiagnostics = new CallStorageDiagnostics()
