import { createServiceClient } from '@/lib/supabase/service'

export interface TenantResolutionResult {
  tenantId: string
  source: 'metadata' | 'client_phone' | 'user_phone' | 'to_number' | 'fallback'
  confidence: 'high' | 'medium' | 'low'
  details?: string
}

export interface CallData {
  from_number?: string
  to_number?: string
  metadata?: {
    tenant_id?: string
    [key: string]: any
  }
  customer?: {
    number?: string
  }
  assistant?: {
    number?: string
  }
}

export class TenantResolutionService {
  private static instance: TenantResolutionService
  private supabase = createServiceClient()

  static getInstance(): TenantResolutionService {
    if (!TenantResolutionService.instance) {
      TenantResolutionService.instance = new TenantResolutionService()
    }
    return TenantResolutionService.instance
  }

  /**
   * Resolve tenant ID from call data with multiple fallback strategies
   * This ensures consistent tenant resolution across all webhook scenarios
   */
  async resolveTenantFromCall(callData: CallData, webhookTenantId?: string): Promise<TenantResolutionResult> {

    // Strategy 1: Use tenant_id from call metadata (highest confidence)
    if (callData.metadata?.tenant_id) {
      const isValid = await this.validateTenantId(callData.metadata.tenant_id)
      if (isValid) {
        return {
          tenantId: callData.metadata.tenant_id,
          source: 'metadata',
          confidence: 'high',
          details: 'Tenant ID from call metadata'
        }
      }
    }

    // Strategy 2: Use webhook tenant ID if provided
    if (webhookTenantId) {
      const isValid = await this.validateTenantId(webhookTenantId)
      if (isValid) {
        return {
          tenantId: webhookTenantId,
          source: 'metadata',
          confidence: 'high',
          details: 'Tenant ID from webhook context'
        }
      }
    }

    // Strategy 3: Look up by from_number in clients table
    const fromNumber = callData.from_number || callData.customer?.number
    if (fromNumber) {
      const result = await this.resolveByClientPhone(fromNumber)
      if (result) {
        return result
      }
    }

    // Strategy 4: Look up by from_number in users table
    if (fromNumber) {
      const result = await this.resolveByUserPhone(fromNumber)
      if (result) {
        return result
      }
    }

    // Strategy 5: Look up by to_number in tenants table
    const toNumber = callData.to_number || callData.assistant?.number
    if (toNumber) {
      const result = await this.resolveByToNumber(toNumber)
      if (result) {
        return result
      }
    }

    // Strategy 6: Fallback to tenant resolution strategy
    const fallbackResult = await this.resolveFallbackTenant()
    return fallbackResult
  }

  /**
   * Resolve tenant ID for a specific user (for API calls)
   */
  async resolveTenantForUser(userId: string): Promise<TenantResolutionResult> {

    // Get user data
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('tenant_id, phone')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new Error(`User not found: ${userError?.message || 'Unknown error'}`)
    }

    if (userData.tenant_id) {
      const isValid = await this.validateTenantId(userData.tenant_id)
      if (isValid) {
        return {
          tenantId: userData.tenant_id,
          source: 'metadata',
          confidence: 'high',
          details: 'User tenant from database'
        }
      }
    }

    // Fallback to general resolution
    return this.resolveFallbackTenant()
  }

  private async validateTenantId(tenantId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('id', tenantId)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }

  private async resolveByClientPhone(phoneNumber: string): Promise<TenantResolutionResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('tenant_id')
        .eq('phone', phoneNumber)
        .limit(1)
        .single()

      if (error || !data) return null

      return {
        tenantId: data.tenant_id,
        source: 'client_phone',
        confidence: 'high',
        details: `Found tenant via client phone: ${phoneNumber}`
      }
    } catch (error) {
      return null
    }
  }

  private async resolveByUserPhone(phoneNumber: string): Promise<TenantResolutionResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('tenant_id')
        .eq('phone', phoneNumber)
        .limit(1)
        .single()

      if (error || !data) return null

      return {
        tenantId: data.tenant_id,
        source: 'user_phone',
        confidence: 'high',
        details: `Found tenant via user phone: ${phoneNumber}`
      }
    } catch (error) {
      return null
    }
  }

  private async resolveByToNumber(toNumber: string): Promise<TenantResolutionResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('twilio_phone_number', toNumber)
        .limit(1)
        .single()

      if (error || !data) return null

      return {
        tenantId: data.id,
        source: 'to_number',
        confidence: 'high',
        details: `Found tenant via to_number: ${toNumber}`
      }
    } catch (error) {
      return null
    }
  }

  private async resolveFallbackTenant(): Promise<TenantResolutionResult> {
    try {
      // Get all active tenants
      const { data: tenants, error } = await this.supabase
        .from('tenants')
        .select('id, name, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error || !tenants || tenants.length === 0) {
        throw new Error('No active tenants found in database')
      }

      // For single tenant, use it directly
      if (tenants.length === 1) {
        return {
          tenantId: tenants[0].id,
          source: 'fallback',
          confidence: 'medium',
          details: `Single tenant fallback: ${tenants[0].name}`
        }
      }

      // For multiple tenants, use the first one (oldest)
      // In the future, this could be enhanced with more sophisticated logic
      return {
        tenantId: tenants[0].id,
        source: 'fallback',
        confidence: 'low',
        details: `Multiple tenant fallback (using oldest): ${tenants[0].name}`
      }
    } catch (error) {
      throw new Error(`Failed to resolve fallback tenant: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get tenant resolution statistics for monitoring
   */
  async getResolutionStats(): Promise<{
    totalTenants: number
    activeTenants: number
    tenantDistribution: Array<{ tenantId: string; name: string; callCount: number }>
  }> {
    try {
      // Get tenant stats
      const { data: tenants, error: tenantsError } = await this.supabase
        .from('tenants')
        .select('id, name, status')

      if (tenantsError) throw tenantsError

      const activeTenants = tenants?.filter(t => t.status === 'active') || []
      const totalTenants = tenants?.length || 0

      // Get call distribution by tenant
      const { data: callStats, error: callsError } = await this.supabase
        .from('calls')
        .select('tenant_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (callsError) throw callsError

      const tenantDistribution = activeTenants.map(tenant => ({
        tenantId: tenant.id,
        name: tenant.name,
        callCount: callStats?.filter(c => c.tenant_id === tenant.id).length || 0
      }))

      return {
        totalTenants,
        activeTenants: activeTenants.length,
        tenantDistribution
      }
    } catch (error) {
      throw error
    }
  }
}

// Export singleton instance
export const tenantResolutionService = TenantResolutionService.getInstance()
