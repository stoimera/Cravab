import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { tenantResolutionService } from '@/lib/tenant-resolution'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Get tenant resolution statistics
    const stats = await tenantResolutionService.getResolutionStats()
    
    // Get recent calls with tenant resolution details
    const { data: recentCalls, error: callsError } = await supabase
      .from('calls')
      .select(`
        id,
        tenant_id,
        from_number,
        to_number,
        created_at,
        tenants!inner(name)
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(50)

    if (callsError) {
      logger.error('Error fetching recent calls:', callsError)
    }

    // Get tenant resolution issues (calls with potential problems)
    const { data: problemCalls, error: problemError } = await supabase
      .from('calls')
      .select(`
        id,
        tenant_id,
        from_number,
        to_number,
        created_at,
        metadata
      `)
      .eq('tenant_id', '796d86e7-4c10-44d7-9ba6-58ff4ac0ecba') // Hardcoded tenant ID

    if (problemError) {
      logger.error('Error fetching problem calls:', problemError)
    }

    return createSuccessResponse({
      stats,
      recentCalls: recentCalls || [],
      problemCalls: problemCalls || [],
      summary: {
        totalCalls: recentCalls?.length || 0,
        problemCallsCount: problemCalls?.length || 0,
        hasIssues: (problemCalls?.length || 0) > 0,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Error getting tenant resolution stats:', error)
    return createErrorResponse('Failed to get tenant resolution statistics', 500)
  }
}
