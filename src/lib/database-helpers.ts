import { createClient as createSupabaseClient } from '@supabase/supabase-js'
// Dynamic import to avoid module load time environment variable check
import { Database } from '../types/database-comprehensive'
import { 
  CreateClient, 
  CreateCall, 
  CreateAppointment,
  CreateService,
  CreateNotification
} from './schemas'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey)
// Use service client for tenant operations to bypass RLS (lazy initialization)
let _supabaseService: any = null
export const getSupabaseService = async () => {
  if (!_supabaseService) {
    const { createServiceClient } = await import('./supabase/service')
    _supabaseService = createServiceClient()
  }
  return _supabaseService
}

// Tenant helpers
export const tenantHelpers = {
  async getById(id: string) {
    const supabaseService = await getSupabaseService()
    const { data, error } = await supabaseService
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async validateExists(id: string): Promise<boolean> {
    const supabaseService = await getSupabaseService()
    const { data, error } = await supabaseService
      .from('tenants')
      .select('id')
      .eq('id', id)
      .single()
    
    return !error && !!data
  },

  async create(tenant: { name: string }) {
    const supabaseService = await getSupabaseService()
    const { data, error } = await supabaseService
      .from('tenants')
      .insert(tenant)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: { name?: string }) {
    const supabaseService = await getSupabaseService()
    const { data, error } = await supabaseService
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Client helpers
export const clientHelpers = {
  async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(client: Omit<CreateClient, 'tenant_id'>, tenantId: string) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...client, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateClient>) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Call helpers
export const callHelpers = {
  async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(call: Omit<CreateCall, 'tenant_id'>, tenantId: string) {
    const { data, error } = await supabase
      .from('calls')
      .insert({ ...call, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateCall>) {
    const { data, error } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Appointment helpers
export const appointmentHelpers = {
  async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(appointment: Omit<CreateAppointment, 'tenant_id'>, tenantId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appointment, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateAppointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Service helpers
export const serviceHelpers = {
  async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(service: Omit<CreateService, 'tenant_id'>, tenantId: string) {
    const { data, error } = await supabase
      .from('services')
      .insert({ ...service, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateService>) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Find best matching service for a client request
   * Includes fallback to general service if no specific service matches
   */
  async findBestMatch(tenantId: string, clientRequest: string, supabaseClient?: any) {
    const { findServiceMatch } = await import('./services/service-matcher')
    
    // Get tenant's active services
    const tenantServices = await this.getByTenant(tenantId)
    
    // Use provided supabase client or get service client
    const client = supabaseClient || await getSupabaseService()
    
    // Find best match (includes general service fallback)
    return findServiceMatch(clientRequest, tenantServices as any, tenantId, client)
  },

  /**
   * Get all available service keywords for a tenant
   * Includes both tenant services and general service keywords
   */
  async getServiceKeywords(tenantId: string) {
    const { getServiceKeywords } = await import('./services/service-matcher')
    
    // Get tenant's active services
    const tenantServices = await this.getByTenant(tenantId)
    
    // Get all available keywords
    return getServiceKeywords(tenantServices as any)
  },

  /**
   * Check if a service is the general service
   */
  isGeneralService(serviceId: string): boolean {
    return serviceId.startsWith('general-service-')
  }
}

// Notification helpers
export const notificationHelpers = {
  async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(notification: Omit<CreateNotification, 'tenant_id'>, tenantId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ ...notification, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateNotification>) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}