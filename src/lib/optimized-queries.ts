import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

/**
 * Optimized query functions for appointment updates
 * Implements performance considerations and best practices
 */

export class OptimizedAppointmentQueries {
  private supabase = createClient()

  /**
   * Batch update appointment with related data
   * Uses parallel execution for maximum performance
   */
  async updateAppointmentWithRelated(
    appointmentId: string,
    tenantId: string,
    updatedData: {
      title?: string
      description?: string
      address?: string
      city?: string
      state?: string
      zip_code?: string
      clientName?: string
      clientPhone?: string
      serviceDescription?: string
    }
  ) {
    try {
      // 1. Get appointment details first (single query)
      const { data: appointment, error: fetchError } = await this.supabase
        .from('appointments')
        .select('client_id, service_id')
        .eq('id', appointmentId)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError || !appointment) {
        throw new Error('Appointment not found')
      }

      // 2. Prepare all updates (conditional based on data changes)
      const updates = []

      // Always update appointment
      updates.push(
        (this.supabase as any)
          .from('appointments')
          .update({
            title: updatedData.title,
            description: updatedData.description,
            address: updatedData.address,
            city: updatedData.city,
            state: updatedData.state,
            zip_code: updatedData.zip_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId)
          .eq('tenant_id', tenantId)
      )

      // Update client only if client data changed
      if (updatedData.clientName || updatedData.clientPhone) {
        const nameParts = updatedData.clientName?.trim().split(' ') || []
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        updates.push(
          (this.supabase as any)
            .from('clients')
            .update({
              first_name: firstName,
              last_name: lastName,
              phone: updatedData.clientPhone,
              updated_at: new Date().toISOString()
            })
            .eq('id', (appointment as any).client_id)
            .eq('tenant_id', tenantId)
        )
      }

      // Update service only if service description changed
      if (updatedData.serviceDescription && (appointment as any).service_id) {
        updates.push(
          (this.supabase as any)
            .from('services')
            .update({
              description: updatedData.serviceDescription,
              updated_at: new Date().toISOString()
            })
            .eq('id', (appointment as any).service_id)
            .eq('tenant_id', tenantId)
        )
      }

      // 3. Execute all updates in parallel (performance optimization)
      const results = await Promise.all(updates)
      
      // 4. Check for errors
      for (const result of results) {
        if (result.error) {
          throw result.error
        }
      }

      return {
        success: true,
        updatedFields: Object.keys(updatedData).filter(key => updatedData[key as keyof typeof updatedData])
      }

    } catch (error) {
      logger.error('Error in batch update:', error)
      throw error
    }
  }

  /**
   * Get appointment with optimized joins
   * Uses single query with proper joins instead of multiple queries
   */
  async getAppointmentWithDetails(appointmentId: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          email,
          address
        ),
        services:service_id (
          id,
          name,
          description,
          category,
          base_price,
          hourly_rate,
          estimated_duration_minutes
        )
      `)
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Batch update multiple appointments
   * For bulk operations
   */
  async batchUpdateAppointments(
    updates: Array<{
      appointmentId: string
      tenantId: string
      updatedData: any
    }>
  ) {
    try {
      // Process updates in batches of 10 for optimal performance
      const batchSize = 10
      const results = []

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        
        const batchPromises = batch.map(update => 
          this.updateAppointmentWithRelated(
            update.appointmentId,
            update.tenantId,
            update.updatedData
          )
        )

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      return results
    } catch (error) {
      logger.error('Error in batch update:', error)
      throw error
    }
  }

  /**
   * Get appointments with pagination and filtering
   * Optimized for large datasets
   */
  async getAppointmentsPaginated(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string
      clientId?: string
      serviceId?: string
      startDate?: string
      endDate?: string
    } = {}
  ) {
    let query = this.supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        services:service_id (
          id,
          name,
          category
        )
      `)
      .eq('tenant_id', tenantId)

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status as 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show')
    }
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId)
    }
    if (filters.serviceId) {
      query = query.eq('service_id', filters.serviceId)
    }
    if (filters.startDate) {
      query = query.gte('starts_at', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('starts_at', filters.endDate)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .order('starts_at', { ascending: true })

    if (error) {
      throw error
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  }
}

// Export singleton instance
export const optimizedQueries = new OptimizedAppointmentQueries()
