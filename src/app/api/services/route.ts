import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult
    const { searchParams } = new URL(request.url)
    const clientRequest = searchParams.get('match')

    // If match parameter is provided, use service matching
    if (clientRequest) {
      try {
        const { serviceHelpers } = await import('@/lib/database-helpers')
        const match = await serviceHelpers.findBestMatch(tenantId, clientRequest)
        
        return NextResponse.json({ 
          match,
          services: [match.service] // Return matched service in services array format
        })
      } catch (error) {
        // Service matching error
        // Fall back to regular service listing if matching fails
      }
    }

    // Otherwise, return all services using direct Supabase query
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      // Database error
      return createErrorResponse('Failed to fetch services', 500, { tenantId, error: error.message })
    }

    return createSuccessResponse({ services: data || [] })
  } catch (error) {
    // API error
    return createErrorResponse('Failed to fetch services', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('🚀 POST /api/services - Starting service creation')
    
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      logger.debug('❌ POST /api/services - Authentication failed:', authResult.response)
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult
    const body = await request.json()
    
    logger.debug('🚀 POST /api/services - Request body:', body)
    logger.debug('🚀 POST /api/services - Tenant ID:', tenantId)

    const insertData = {
      ...body,
      tenant_id: tenantId
    }
    
    logger.debug('🚀 POST /api/services - Insert data:', insertData)

    const { data, error } = await supabase
      .from('services')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error('❌ POST /api/services - Database error:', error)
      // Database error
      return createErrorResponse('Failed to create service', 500, { 
        tenantId, 
        error: error.message,
        details: error.details,
        hint: error.hint
      })
    }
    
    logger.debug('✅ POST /api/services - Service created successfully:', data)
    return createSuccessResponse({ service: data }, 201)
  } catch (error) {
    logger.error('❌ POST /api/services - API error:', error)
    // API error
    return createErrorResponse('Failed to create service', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}