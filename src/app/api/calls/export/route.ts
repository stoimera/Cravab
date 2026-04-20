import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { tenantId, supabase } = authResult

    // Fetch calls data with client information
    const { data: calls, error } = await supabase
      .from('calls')
      .select(`
        id,
        tenant_id,
        client_id,
        from_number,
        to_number,
        status,
        direction,
        duration_seconds,
        transcript,
        recording_url,
        metadata,
        created_at,
        updated_at,
        clients (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching calls:', error)
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      )
    }

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Client Name',
      'Client Phone',
      'Phone Number',
      'Status',
      'Call Type',
      'Duration (seconds)',
      'Revenue',
      'AI Sentiment',
      'AI Intent',
      'Transcript',
      'Follow Up Required',
      'Follow Up Notes',
      'Action Items',
      'Started At',
      'Ended At',
      'Created At'
    ]

    const csvRows = calls.map((call: any) => [
      call.id,
      call.clients ? `${call.clients.first_name || ''} ${call.clients.last_name || ''}`.trim() : '',
      call.clients?.phone || '',
      call.from_number || '',
      call.status || '',
      call.direction || '',
      call.duration_seconds ? `${call.duration_seconds}s` : '',
      '',
      '', // AI sentiment - not in new schema
      '', // AI intent - not in new schema
      call.transcript || '',
      '', // Follow up required - not in new schema
      '', // Follow up notes - not in new schema
      '', // AI summary - not in new schema
      call.created_at || '',
      call.created_at || '',
      call.created_at || ''
    ])

    // Escape CSV values
    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map((row: any) => row.map(escapeCsvValue).join(','))
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="calls-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    logger.error('Error in calls export API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
