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

    // Fetch clients data
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        tenant_id,
        first_name,
        last_name,
        phone,
        email,
        address,
        status,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantId)
      .order('first_name', { ascending: true })

    if (error) {
      logger.error('Error fetching clients:', error)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Address',
      'Status',
      'Created At',
      'Updated At'
    ]

    const csvRows = clients.map((client: any) => [
      client.id,
      client.first_name || '',
      client.last_name || '',
      client.phone || '',
      client.email || '',
      client.address || '',
      client.status || '',
      client.created_at || '',
      client.updated_at || ''
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
        'Content-Disposition': `attachment; filename="clients-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    logger.error('Error in clients export API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
