'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ClientData {
  first_name: string
  last_name: string
  phone: string
  email?: string
  tenant_id: string
}

interface UseAutoCreateClientProps {
  tenantId: string
}

export function useAutoCreateClient({ tenantId }: UseAutoCreateClientProps) {
  const supabase = createClient()

  const normalizePhone = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Handle US numbers
    if (digits.length === 10) {
      return `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    } else if (digits.startsWith('+')) {
      return phone
    } else {
      return `+1${digits}`
    }
  }

  const createClientFunction = useCallback(async (clientData: ClientData) => {
    try {
      // Validate tenant exists first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', tenantId)
        .single()
      
      if (tenantError || !tenant) {
        throw new Error('Invalid tenant configuration')
      }
      
      const normalizedPhone = normalizePhone(clientData.phone)
      
      // Check if client already exists with this phone number
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('tenant_id', tenantId)
        .eq('phone', normalizedPhone)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingClient) {
        // Client already exists
        return existingClient
      }

      // Create new client
      const { data: newClient, error: createError } = await (supabase as any)
        .from('clients')
        .insert({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: normalizedPhone,
          email: clientData.email || null,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      // New client created
      return newClient
    } catch (error) {
      // Error creating client
      throw error
    }
  }, [tenantId, supabase])

  const autoCreateFromCall = useCallback(async (callData: {
    caller: string
    phone: string
    email?: string
  }) => {
    try {
      const clientData: ClientData = {
        first_name: 'Unknown',
        last_name: 'Caller',
        phone: callData.phone,
        email: callData.email,
        tenant_id: tenantId
      }

      return await createClientFunction(clientData)
    } catch (error) {
      // Error auto-creating client from call
      throw error
    }
  }, [tenantId, createClientFunction])

  const mergeClients = useCallback(async (primaryClientId: string, secondaryClientId: string) => {
    try {
      // Get both clients
      const { data: primaryClient, error: primaryError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', primaryClientId)
        .single()

      const { data: secondaryClient, error: secondaryError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', secondaryClientId)
        .single()

      if (primaryError || secondaryError) {
        throw new Error('Failed to fetch clients for merge')
      }

      // Merge data (prefer primary client data, but use secondary if primary is missing)
      const mergedData = {
        first_name: (primaryClient as any).first_name || (secondaryClient as any).first_name, 
        last_name: (primaryClient as any).last_name || (secondaryClient as any).last_name,    
        phone: (primaryClient as any).phone || (secondaryClient as any).phone,
        email: (primaryClient as any).email || (secondaryClient as any).email,
        updated_at: new Date().toISOString()
      }

      // Update primary client with merged data
      const { data: updatedClient, error: updateError } = await (supabase as any)
        .from('clients')
        .update(mergedData)
        .eq('id', primaryClientId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update all related records to point to primary client
      const { error: updateCallsError } = await (supabase as any)
        .from('calls')
        .update({ client_id: primaryClientId })
        .eq('client_id', secondaryClientId)

      if (updateCallsError) {
        // Failed to update calls for merged client
      }

      const { error: updateAppointmentsError } = await (supabase as any)
        .from('appointments')
        .update({ client_id: primaryClientId })
        .eq('client_id', secondaryClientId)

      if (updateAppointmentsError) {
        // Failed to update appointments for merged client
      }

      // Delete secondary client
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', secondaryClientId)

      if (deleteError) {
        // Failed to delete secondary client
      }

      // Clients merged successfully
      return updatedClient
    } catch (error) {
      // Error merging clients
      throw error
    }
  }, [supabase])

  return {
    createClient: createClientFunction,
    autoCreateFromCall,
    mergeClients,
    normalizePhone
  }
}
