import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database, Appointment } from '../types/database-comprehensive'
import { 
  CreateClient, 
  CreateCall, 
  CreateAppointment, 
  CreateNotification,
  UpdateClient,
  UpdateCall,
  UpdateAppointment,
  UpdateNotification
} from './schemas'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey)

// Database service class
export class DatabaseService {
  // Tenant operations
  static async getTenant(id: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(`Failed to get tenant: ${error.message}`)
    return data
  }

  static async createTenant(tenant: { name: string }) {
    const { data, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create tenant: ${error.message}`)
    return data
  }

  static async updateTenant(id: string, updates: { name?: string }) {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update tenant: ${error.message}`)
    return data
  }

  // Client operations
  static async getClients(tenantId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('first_name', { ascending: true })
    
    if (error) throw new Error(`Failed to get clients: ${error.message}`)
    return data
  }

  static async getClient(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(`Failed to get client: ${error.message}`)
    return data
  }

  static async createClient(client: CreateClient, tenantId: string) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...client, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create client: ${error.message}`)
    return data
  }

  static async updateClient(id: string, updates: UpdateClient, tenantId?: string) {
    // Update the client directly (same as client details page)
    let query = supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
    
    // Add tenant filtering if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    const { data, error } = await query.select()
    
    if (error) {
      throw new Error(`Failed to update client: ${error.message}`)
    }
    
    // If no rows were updated, fetch the current client to return
    if (!data || data.length === 0) {
      let fetchQuery = supabase
        .from('clients')
        .select('*')
        .eq('id', id)
      
      // Add tenant filtering if provided
      if (tenantId) {
        fetchQuery = fetchQuery.eq('tenant_id', tenantId)
      }
      
      const { data: currentClients, error: fetchError } = await fetchQuery
      
      if (fetchError) {
        throw new Error(`Failed to fetch client: ${fetchError.message}`)
      }
      
      if (!currentClients || currentClients.length === 0) {
        throw new Error('Client not found')
      }
      
      return currentClients[0]
    }
    
    return data[0]
  }

  static async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(`Failed to delete client: ${error.message}`)
  }

  // Call operations (Vapi-compatible)
  static async getCalls(tenantId: string) {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`Failed to get calls: ${error.message}`)
    return data
  }

  static async getCall(id: string) {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw new Error(`Failed to get call: ${error.message}`)
    return data
  }

  static async createCall(call: CreateCall, tenantId: string) {
    const { data, error } = await supabase
      .from('calls')
      .insert({ ...call, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create call: ${error.message}`)
    return data
  }

  static async updateCall(id: string, updates: UpdateCall) {
    const { data, error } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update call: ${error.message}`)
    return data
  }

  // Appointment operations
  static async getAppointments(tenantId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone,
          email,
          address
        ),
        services (
          name,
          base_price,
          hourly_rate,
          duration_minutes
        )
      `)
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: true })
    
    if (error) throw new Error(`Failed to get appointments: ${error.message}`)
    return data
  }

  static async getAppointment(id: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone,
          email,
          address
        ),
        services (
          name,
          base_price,
          hourly_rate,
          duration_minutes
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw new Error(`Failed to get appointment: ${error.message}`)
    return data
  }

  static async createAppointment(appointment: CreateAppointment, tenantId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appointment, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create appointment: ${error.message}`)
    return data
  }

  static async updateAppointment(id: string, updates: UpdateAppointment) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update appointment: ${error.message}`)
    return data
  }

  static async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(`Failed to delete appointment: ${error.message}`)
  }

  static async getAppointmentsByDateRange(tenantId: string, startDate: string, endDate: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone,
          email,
          address
        ),
        services (
          name,
          base_price,
          hourly_rate,
          duration_minutes
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('starts_at', startDate)
      .lte('starts_at', endDate)
      .order('starts_at', { ascending: true })
    
    if (error) throw new Error(`Failed to get appointments by date range: ${error.message}`)
    return data as unknown as Appointment[]
  }

  // Vapi-specific operations
  // Provider keys and agents are now stored directly in tenants table
  // Use the provider-keys API route instead

  static async getNotifications(tenantId: string, userId?: string) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(`Failed to get notifications: ${error.message}`)
    return data
  }

  static async createNotification(notification: CreateNotification, tenantId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ ...notification, tenant_id: tenantId })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create notification: ${error.message}`)
    return data
  }

  static async updateNotification(id: string, updates: UpdateNotification) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update notification: ${error.message}`)
    return data
  }

  // Search and filter methods
  static async searchClients(tenantId: string, query: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('first_name', { ascending: true })
    
    if (error) throw new Error(`Failed to search clients: ${error.message}`)
    return data
  }

  static async getUpcomingAppointments(tenantId: string, days: number = 7) {
    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    
    return this.getAppointmentsByDateRange(tenantId, startDate, endDate)
  }

  static async getTodaysAppointments(tenantId: string) {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    
    return this.getAppointmentsByDateRange(tenantId, startOfDay, endOfDay)
  }
}

// Export individual helpers for backward compatibility
export const {
  getTenant,
  createTenant,
  updateTenant,
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getCalls,
  getCall,
  createCall,
  updateCall,
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByDateRange,
  // Provider keys and agents are now handled via API routes
  getNotifications,
  createNotification,
  updateNotification,
  searchClients,
  getUpcomingAppointments,
  getTodaysAppointments
} = DatabaseService