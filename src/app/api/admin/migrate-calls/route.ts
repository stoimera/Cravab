import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

const HARDCODED_TENANT_ID = '796d86e7-4c10-44d7-9ba6-58ff4ac0ecba'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Looking for calls with hardcoded tenant_id
    
    // Find all calls with the hardcoded tenant_id
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('tenant_id', HARDCODED_TENANT_ID)
    
    if (callsError) {
      logger.error('Error fetching calls:', callsError)
      return createErrorResponse('Failed to fetch calls', 500)
    }
    
    // Found calls with hardcoded tenant_id
    
    if (calls.length === 0) {
      return createSuccessResponse({
        message: 'No calls found with hardcoded tenant_id. Migration not needed.',
        migrated: 0,
        skipped: 0
      })
    }
    
    // Get all available tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
    
    if (tenantsError) {
      logger.error('Error fetching tenants:', tenantsError)
      return createErrorResponse('Failed to fetch tenants', 500)
    }
    
    // Found tenants in database
    
    if (tenants.length === 0) {
      return createErrorResponse('No tenants found in database. Cannot migrate calls.', 400)
    }
    
    // If there's only one tenant, use that one
    if (tenants.length === 1) {
      const targetTenantId = tenants[0].id
      // Using single tenant
      
      // Update all calls to use this tenant
      const { error: updateError } = await supabase
        .from('calls')
        .update({ tenant_id: targetTenantId })
        .eq('tenant_id', HARDCODED_TENANT_ID)
      
      if (updateError) {
        logger.error('Error updating calls:', updateError)
        return createErrorResponse('Failed to update calls', 500)
      }
      
      return createSuccessResponse({
        message: `Successfully migrated ${calls.length} calls to tenant: ${tenants[0].name}`,
        migrated: calls.length,
        skipped: 0,
        targetTenant: tenants[0].name
      })
    }
    
    // Multiple tenants - try to match calls to tenants based on phone numbers
    
    let migratedCount = 0
    let skippedCount = 0
    const migrationResults = []
    
    for (const call of calls) {
      // Processing call
      
      let targetTenantId = null
      let matchMethod = ''
      
      // Try to find tenant by from_number in clients table
      if ((call as any).from_number) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('tenant_id')
          .eq('phone', (call as any).from_number)
          .limit(1)
          .single()
        
        if (clientData) {
          targetTenantId = clientData.tenant_id
          matchMethod = 'client_phone'
          // Found tenant via client phone
        }
      }
      
      // Try to find tenant by from_number in users table
      if (!targetTenantId && (call as any).from_number) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('phone', (call as any).from_number)
          .limit(1)
          .single()
        
        if (userData) {
          targetTenantId = userData.tenant_id
          matchMethod = 'user_phone'
          // Found tenant via user phone
        }
      }
      
      // Try to find tenant by to_number in tenants table
      if (!targetTenantId && (call as any).to_number) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('id')
          .eq('twilio_phone_number', (call as any).to_number)
          .limit(1)
          .single()
        
        if (tenantData) {
          targetTenantId = tenantData.id
          matchMethod = 'to_number'
          // Found tenant via to_number
        }
      }
      
      // If still no tenant found, use the first available tenant
      if (!targetTenantId) {
        targetTenantId = tenants[0].id
        matchMethod = 'fallback'
        // No specific tenant found, using first available
      }
      
      // Update the call
      const { error: updateError } = await supabase
        .from('calls')
        .update({ tenant_id: targetTenantId })
        .eq('id', (call as any).id)
      
      if (updateError) {
        logger.error(`  ❌ Error updating call ${(call as any).id}:`, updateError)
        skippedCount++
        migrationResults.push({
          callId: (call as any).id,
          fromNumber: (call as any).from_number,
          toNumber: (call as any).to_number,
          status: 'failed',
          error: updateError.message
        })
      } else {
        // Updated call successfully
        migratedCount++
        migrationResults.push({
          callId: (call as any).id,
          fromNumber: (call as any).from_number,
          toNumber: (call as any).to_number,
          status: 'migrated',
          targetTenantId,
          matchMethod
        })
      }
    }
    
    // Migration completed
    
    return createSuccessResponse({
      message: 'Migration completed',
      migrated: migratedCount,
      skipped: skippedCount,
      results: migrationResults
    })
    
  } catch (error) {
    logger.error('Migration failed:', error)
    return createErrorResponse('Migration failed', 500)
  }
}
