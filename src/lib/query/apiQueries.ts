import { logger } from '@/lib/logger'
/**
 * API Query Functions
 * Centralized data fetching functions with caching and error handling
 */

import { createClient } from '@/lib/supabase/client'
import { queryKeys } from './queryKeys'

// Base API client with error handling
class ApiQueryClient {
  private get supabase() {
    return createClient()
  }

  // Generic fetch function with error handling
  private async fetchWithErrorHandling<T>(
    queryFn: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await queryFn()
    } catch (error) {
      logger.error(`${errorMessage}:`, error)
      throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Clients
  async getClients(tenantId: string, filters?: any) {
    return this.fetchWithErrorHandling(
      async () => {
        let query = this.supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
      },
      'Failed to fetch clients'
    )
  }

  async getClient(tenantId: string, clientId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const { data, error } = await this.supabase
          .from('clients')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('id', clientId)
          .single()

        if (error) throw error
        return data
      },
      'Failed to fetch client'
    )
  }

  // Appointments
  async getAppointments(tenantId: string, filters?: any) {
    return this.fetchWithErrorHandling(
      async () => {
        let query = this.supabase
          .from('appointments')
          .select(`
            *,
            clients (
              id,
              first_name,
              last_name,
              phone,
              email,
              address
            ),
            services (
              id,
              name,
              description,
              category,
              base_price,
              hourly_rate,
              estimated_duration_minutes,
              is_emergency_service,
              requires_equipment
            ),
            users (
              id,
              first_name,
              last_name,
              email,
              role
            )
          `)
          .eq('tenant_id', tenantId)
          .order('starts_at', { ascending: false })

        // Apply filters
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        if (filters?.dateFrom) {
          query = query.gte('starts_at', filters.dateFrom)
        }

        if (filters?.dateTo) {
          query = query.lte('starts_at', filters.dateTo)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
      },
      'Failed to fetch appointments'
    )
  }

  async getAppointment(tenantId: string, appointmentId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const { data, error } = await this.supabase
          .from('appointments')
          .select(`
            *,
            clients (
              id,
              first_name,
              last_name,
              phone,
              email,
              address
            )
          `)
          .eq('tenant_id', tenantId)
          .eq('id', appointmentId)
          .single()

        if (error) throw error
        return data
      },
      'Failed to fetch appointment'
    )
  }

  // Calls
  async getCalls(tenantId: string, filters?: any) {
    return this.fetchWithErrorHandling(
      async () => {
        let query = this.supabase
          .from('calls')
          .select(`
            *,
            clients (
              id,
              first_name,
              last_name,
              phone,
              email
            )
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        if (filters?.priority) {
          query = query.eq('priority', filters.priority)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
      },
      'Failed to fetch calls'
    )
  }

  async getCall(tenantId: string, callId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const { data, error } = await this.supabase
          .from('calls')
          .select(`
            *,
            clients (
              id,
              first_name,
              last_name,
              phone,
              email
            )
          `)
          .eq('tenant_id', tenantId)
          .eq('id', callId)
          .single()

        if (error) throw error
        return data
      },
      'Failed to fetch call'
    )
  }

  // Users
  async getUsers(tenantId: string, filters?: any) {
    return this.fetchWithErrorHandling(
      async () => {
        const response = await fetch(`/api/company/users?tenant_id=${tenantId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        
        const data = await response.json()
        return data.users || []
      },
      'Failed to fetch users'
    )
  }

  async getUser(tenantId: string, userId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const { data, error } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .eq('tenant_id', tenantId)
          .single()

        if (error) throw error
        return data
      },
      'Failed to fetch user'
    )
  }

  // Services
  async getServices(tenantId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const { data, error } = await this.supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name', { ascending: true })

        if (error) throw error
        return data || []
      },
      'Failed to fetch services'
    )
  }

  // Documents
  async getDocuments(tenantId: string, filters?: any) {
    return this.fetchWithErrorHandling(
      async () => {
        let query = this.supabase
          .from('documents')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.category) {
          query = query.eq('category', filters.category)
        }

        if (filters?.clientId) {
          query = query.eq('client_id', filters.clientId)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
      },
      'Failed to fetch documents'
    )
  }

  // Reports
  async getReportsData(tenantId: string, period: string = '30d') {
    return this.fetchWithErrorHandling(
      async () => {
        const response = await fetch(`/api/reports?period=${period}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.json()
      },
      'Failed to fetch reports data'
    )
  }

  // Company Settings
  async getCompanySettings(tenantId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const response = await fetch('/api/company/settings')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.json()
      },
      'Failed to fetch company settings'
    )
  }

  // Business Hours
  async getBusinessHours(tenantId: string) {
    return this.fetchWithErrorHandling(
      async () => {
        const { data, error } = await this.supabase
          .from('tenants')
          .select('business_hours')
          .eq('id', tenantId)
          .single()

        if (error) throw error
        return (data as any)?.business_hours || null
      },
      'Failed to fetch business hours'
    )
  }
}

// Export singleton instance
export const apiQueryClient = new ApiQueryClient()

// Export individual query functions for use in components
export const queries = {
  // Clients
  getClients: (tenantId: string, filters?: any) => ({
    queryKey: queryKeys.clients.list(tenantId, filters),
    queryFn: () => apiQueryClient.getClients(tenantId, filters),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  getClient: (tenantId: string, clientId: string) => ({
    queryKey: queryKeys.clients.detail(tenantId, clientId),
    queryFn: () => apiQueryClient.getClient(tenantId, clientId),
    enabled: !!tenantId && tenantId.trim() !== '' && !!clientId,
  }),

  // Appointments
  getAppointments: (tenantId: string, filters?: any) => ({
    queryKey: queryKeys.appointments.list(tenantId, filters),
    queryFn: () => apiQueryClient.getAppointments(tenantId, filters),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  getAppointment: (tenantId: string, appointmentId: string) => ({
    queryKey: queryKeys.appointments.detail(tenantId, appointmentId),
    queryFn: () => apiQueryClient.getAppointment(tenantId, appointmentId),
    enabled: !!tenantId && tenantId.trim() !== '' && !!appointmentId,
  }),

  // Calls
  getCalls: (tenantId: string, filters?: any) => ({
    queryKey: queryKeys.calls.list(tenantId, filters),
    queryFn: () => apiQueryClient.getCalls(tenantId, filters),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  getCall: (tenantId: string, callId: string) => ({
    queryKey: queryKeys.calls.detail(tenantId, callId),
    queryFn: () => apiQueryClient.getCall(tenantId, callId),
    enabled: !!tenantId && tenantId.trim() !== '' && !!callId,
  }),

  // Users
  getUsers: (tenantId: string, filters?: any) => ({
    queryKey: queryKeys.users.list(tenantId),
    queryFn: () => apiQueryClient.getUsers(tenantId, filters),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  getUser: (tenantId: string, userId: string) => ({
    queryKey: queryKeys.users.detail(tenantId, userId),
    queryFn: () => apiQueryClient.getUser(tenantId, userId),
    enabled: !!tenantId && tenantId.trim() !== '' && !!userId,
  }),

  // Services
  getServices: (tenantId: string) => ({
    queryKey: queryKeys.services.list(tenantId),
    queryFn: () => apiQueryClient.getServices(tenantId),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  // Documents
  getDocuments: (tenantId: string, filters?: any) => ({
    queryKey: queryKeys.documents.list(tenantId, filters),
    queryFn: () => apiQueryClient.getDocuments(tenantId, filters),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  // Reports
  getReportsData: (tenantId: string, period: string = '30d') => ({
    queryKey: queryKeys.reports.dashboard(tenantId, period),
    queryFn: () => apiQueryClient.getReportsData(tenantId, period),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  // Company
  getCompanySettings: (tenantId: string) => ({
    queryKey: queryKeys.company.settings(tenantId),
    queryFn: () => apiQueryClient.getCompanySettings(tenantId),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),

  getBusinessHours: (tenantId: string) => ({
    queryKey: queryKeys.company.businessHours(tenantId),
    queryFn: () => apiQueryClient.getBusinessHours(tenantId),
    enabled: !!tenantId && tenantId.trim() !== '',
  }),
}
