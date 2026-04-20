/**
 * Webhook function handlers - refactored from main webhook route
 */

import { createServiceClient } from '@/lib/supabase/service'
import { databaseOptimizer } from '@/lib/performance/database-optimizer'
import { inputValidator } from '@/lib/security/input-validation'
import { createValidationError, createNotFoundError, createInternalError } from '@/lib/errors/standard-errors'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'

export class WebhookHandlers {
  private supabase = createServiceClient()

  /**
   * Check service area
   */
  async checkServiceArea(tenantId: string, parameters: any) {
    const { checkServiceArea } = await import('@/lib/service-area')
    return await checkServiceArea(tenantId, parameters.address, parameters.latitude, parameters.longitude)
  }

  /**
   * Get business hours
   */
  async getBusinessHours(tenantId: string, parameters: any) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .select('business_hours, timezone')
      .eq('id', tenantId)
      .single()

    if (error) throw createNotFoundError('Tenant')
    if (!tenant) throw createNotFoundError('Tenant')

    return {
      business_hours: tenant.business_hours || {},
      timezone: tenant.timezone || 'America/Chicago'
    }
  }

  /**
   * Get services
   */
  async getServices(tenantId: string, parameters: any) {
    const { data: services, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')

    if (error) throw createInternalError('Failed to fetch services')

    return { services: services || [] }
  }

  /**
   * Lookup client
   */
  async lookupClient(tenantId: string, parameters: any) {
    if (!parameters.phone) {
      throw createValidationError('Phone number is required')
    }

    const sanitizedPhone = inputValidator.sanitizeString(parameters.phone)
    
    const { data: clients, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('phone', sanitizedPhone)
      .limit(1)

    if (error) throw createInternalError('Failed to lookup client')

    return { 
      client: clients?.[0] || null,
      clients: clients || []
    }
  }

  /**
   * Create client
   */
  async createClient(tenantId: string, parameters: any) {
    // Validate required fields
    if (!parameters.first_name || !parameters.last_name || !parameters.phone) {
      throw createValidationError('First name, last name, and phone are required')
    }

    // Sanitize input
    const sanitizedData = {
      tenant_id: tenantId,
      first_name: inputValidator.sanitizeString(parameters.first_name),
      last_name: inputValidator.sanitizeString(parameters.last_name),
      phone: inputValidator.sanitizeString(parameters.phone),
      email: parameters.email ? inputValidator.sanitizeString(parameters.email) : null,
      address: parameters.address ? inputValidator.sanitizeString(parameters.address) : null,
      status: 'active' as const
    }

    const { data: client, error } = await this.supabase
      .from('clients')
      .insert(sanitizedData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Duplicate key error
        throw createValidationError('Client with this phone number already exists')
      }
      throw createInternalError('Failed to create client')
    }

    // Invalidate all cache layers for clients
    if (client && 'id' in client) {
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'clients',
        specificId: client.id as string,
        warmCache: true
      })
    }

    return { client }
  }

  /**
   * Book appointment
   */
  async bookAppointment(tenantId: string, parameters: any) {
    // Validate required fields
    if (!parameters.client_id || !parameters.starts_at) {
      throw createValidationError('Client ID and start time are required')
    }

    // Get client details
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', parameters.client_id)
      .eq('tenant_id', tenantId)
      .single()

    if (clientError || !client) {
      throw createNotFoundError('Client')
    }

    // Create appointment
    const appointmentData = {
      tenant_id: tenantId,
      client_id: parameters.client_id,
      service_id: parameters.service_id || null,
      title: `Service Appointment for ${(client as any).first_name} ${(client as any).last_name}`,
      description: parameters.notes || 'Appointment booked via VAPI',
      starts_at: parameters.starts_at,
      ends_at: parameters.ends_at || new Date(new Date(parameters.starts_at).getTime() + 60 * 60000).toISOString(),
      duration_minutes: parameters.duration_minutes || 60,
      status: 'scheduled' as const,
      notes: parameters.notes || null,
      priority: 'normal' as const,
      created_by: 'system' // Default system user for VAPI bookings
    }

    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        clients (
          first_name,
          last_name,
          phone,
          email
        ),
        services (
          name,
          description,
          base_price,
          hourly_rate
        )
      `)
      .single()

    if (error) throw createInternalError('Failed to create appointment')

    // Invalidate all cache layers for appointments
    if (appointment && 'id' in appointment) {
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: appointment.id as string,
        warmCache: true
      })
    }

    return { 
      appointment,
      message: `Appointment scheduled for ${appointment && 'starts_at' in appointment ? new Date((appointment as any).starts_at).toLocaleDateString() : 'unknown date'}`
    }
  }

  /**
   * Get availability
   */
  async getAvailability(tenantId: string, parameters: any) {
    const date = parameters.date || new Date().toISOString().split('T')[0]
    
    // Get business hours
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('business_hours, timezone')
      .eq('id', tenantId)
      .single()

    // Get existing appointments for the date
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('starts_at, ends_at, duration_minutes')
      .eq('tenant_id', tenantId)
      .gte('starts_at', `${date}T00:00:00`)
      .lt('starts_at', `${date}T23:59:59`)

    // Simple availability calculation
    const availableSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00'
    ]

    return {
      date,
      available_slots: availableSlots,
      business_hours: tenant?.business_hours || {},
      timezone: tenant?.timezone || 'America/Chicago'
    }
  }

  /**
   * Get pricing
   */
  async getPricing(tenantId: string, parameters: any) {
    if (!parameters.service_id) {
      throw createValidationError('Service ID is required')
    }

    const { data: service, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('id', parameters.service_id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !service) {
      throw createNotFoundError('Service')
    }

    return {
      service: {
        name: (service as any)?.name || 'Unknown Service',
        base_price: (service as any)?.base_price || 0,
        hourly_rate: (service as any)?.hourly_rate || 0,
        duration_minutes: (service as any)?.duration_minutes || 60,
        category: (service as any)?.category || 'General'
      }
    }
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(tenantId: string, parameters: any) {
    if (!parameters.appointment_id || !parameters.new_starts_at) {
      throw createValidationError('Appointment ID and new start time are required')
    }

    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .update({
        starts_at: parameters.new_starts_at,
        ends_at: parameters.new_ends_at || new Date(new Date(parameters.new_starts_at).getTime() + 60 * 60000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', parameters.appointment_id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw createInternalError('Failed to reschedule appointment')

    // Invalidate all cache layers for appointments
    if (appointment && 'id' in appointment) {
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: appointment.id as string,
        warmCache: true
      })
    }

    return { 
      appointment,
      message: 'Appointment rescheduled successfully'
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(tenantId: string, parameters: any) {
    if (!parameters.appointment_id) {
      throw createValidationError('Appointment ID is required')
    }

    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', parameters.appointment_id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw createInternalError('Failed to cancel appointment')

    // Invalidate all cache layers for appointments
    if (appointment && 'id' in appointment) {
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: appointment.id as string,
        warmCache: true
      })
    }

    return { 
      appointment,
      message: 'Appointment cancelled successfully'
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(tenantId: string, parameters: any) {
    if (!parameters.appointment_id) {
      throw createValidationError('Appointment ID is required')
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (parameters.notes) updateData.notes = inputValidator.sanitizeString(parameters.notes)
    if (parameters.priority) updateData.priority = parameters.priority
    if (parameters.status) updateData.status = parameters.status

    const { data: appointment, error } = await this.supabase
      .from('appointments')
      .update(updateData)
      .eq('id', parameters.appointment_id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw createInternalError('Failed to update appointment')

    // Invalidate all cache layers for appointments
    if (appointment && 'id' in appointment) {
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: appointment.id as string,
        warmCache: true
      })
    }

    return { 
      appointment,
      message: 'Appointment updated successfully'
    }
  }

  /**
   * Create quote
   */
  async createQuote(tenantId: string, parameters: any) {
    if (!parameters.client_id || !parameters.service_id) {
      throw createValidationError('Client ID and Service ID are required')
    }

    // Get service details
    const { data: service, error: serviceError } = await this.supabase
      .from('services')
      .select('*')
      .eq('id', parameters.service_id)
      .eq('tenant_id', tenantId)
      .single()

    if (serviceError || !service) {
      throw createNotFoundError('Service')
    }

    // Create quote (simplified - you might want a separate quotes table)
    const quote = {
      client_id: parameters.client_id,
      service_id: parameters.service_id,
      amount: (service as any)?.base_price || (service as any)?.hourly_rate || 0,
      description: (service as any)?.description || 'Service quote',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    return {
      quote,
      message: `Quote created for ${(service as any)?.name || 'Service'} - $${quote.amount}`
    }
  }

  /**
   * End call
   */
  async endCall(tenantId: string, parameters: any) {
    if (!parameters.call_id) {
      throw createValidationError('Call ID is required')
    }

    const { data: call, error } = await this.supabase
      .from('calls')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', parameters.call_id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw createInternalError('Failed to end call')

    // Invalidate all cache layers for calls
    if (call && 'id' in call) {
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'calls',
        specificId: call.id as string,
        warmCache: true
      })
    }

    return {
      call,
      message: 'Call ended successfully'
    }
  }
}

export const webhookHandlers = new WebhookHandlers()
