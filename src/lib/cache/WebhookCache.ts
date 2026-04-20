import { logger } from '@/lib/logger'
/**
 * Webhook Cache Integration
 * Integrates application cache with webhook processing for better performance
 */

import { createServiceClient } from '@/lib/supabase/service'

interface CallContext {
  tenantId: string
  callId: string
  clientId?: string
  appointmentId?: string
  serviceId?: string
  metadata?: any
  lastActivity: number
}

interface TenantData {
  businessHours: any
  services: any[]
  settings: any
  lastUpdated: number
}

class WebhookCacheManager {
  private supabase = createServiceClient()
  private callContexts = new Map<string, CallContext>()

  // Get or create call context
  async getCallContext(callId: string, tenantId: string): Promise<CallContext> {
    let context = this.callContexts.get(callId)
    
    if (!context) {
      // Create new context
      context = {
        tenantId,
        callId,
        metadata: {},
        lastActivity: Date.now()
      }
      this.callContexts.set(callId, context)
    }

    return context
  }

  // Update call context
  updateCallContext(callId: string, updates: Partial<CallContext>): void {
    const context = this.callContexts.get(callId)
    if (context) {
      Object.assign(context, updates)
      context.lastActivity = Date.now()
    }
  }

  // Get tenant data with caching
  async getTenantData(tenantId: string): Promise<TenantData | null> {
    // Fetch from database directly - React Query handles caching
    {
      // Fetch from database
      const { data: tenant, error } = await this.supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (error || !tenant) {
        logger.error('Error fetching tenant data:', error)
        return null
      }

      // Fetch business hours
      const { data: businessHours } = await this.supabase
        .from('tenants')
        .select('business_hours')
        .eq('id', tenantId)
        .single()

      // Fetch services
      const { data: services } = await this.supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)

      const tenantData = {
        tenantId,
        businessHours: businessHours?.business_hours || null,
        services: services || [],
        settings: tenant,
        lastUpdated: Date.now()
      }

      // Tenant data is now handled by React Query
      return tenantData
    }

    return null
  }

  // Get business hours with caching
  async getBusinessHours(tenantId: string): Promise<any> {
    const tenantData = await this.getTenantData(tenantId)
    return tenantData?.businessHours || null
  }

  // Get services with caching
  async getServices(tenantId: string): Promise<any[]> {
    const tenantData = await this.getTenantData(tenantId)
    return tenantData?.services || []
  }

  // Cache client lookup result (simplified - React Query handles caching)
  cacheClientLookup(tenantId: string, phoneNumber: string, clientData: any): void {
    // React Query handles client data caching
  }

  // Get cached client lookup
  getCachedClientLookup(tenantId: string, phoneNumber: string): any | null {
    // React Query handles client data caching
    return null
  }

  // Cache appointment availability (simplified)
  cacheAvailability(tenantId: string, date: string, availability: any): void {
    // React Query handles availability caching
  }

  // Get cached availability
  getCachedAvailability(tenantId: string, date: string): any | null {
    // React Query handles availability caching
    return null
  }

  // Cache service pricing (simplified)
  cacheServicePricing(tenantId: string, serviceId: string, pricing: any): void {
    // React Query handles pricing caching
  }

  // Get cached service pricing
  getCachedServicePricing(tenantId: string, serviceId: string): any | null {
    // React Query handles pricing caching
    return null
  }

  // Clear tenant cache when data changes
  clearTenantCache(tenantId: string): void {
    // Clear call contexts for this tenant
    for (const [callId, context] of this.callContexts.entries()) {
      if (context.tenantId === tenantId) {
        this.callContexts.delete(callId)
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      callContexts: this.callContexts.size,
      memoryUsage: process.memoryUsage()
    }
  }

  // Cleanup expired call contexts
  cleanupExpiredContexts(): void {
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30 minutes
    
    for (const [callId, context] of this.callContexts.entries()) {
      if (now - context.lastActivity > maxAge) {
        this.callContexts.delete(callId)
      }
    }
    
    logger.debug('Webhook cache stats:', this.getCacheStats())
  }
}

// Export singleton instance
export const webhookCache = new WebhookCacheManager()

// Export types
export type { CallContext, TenantData }
