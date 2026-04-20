import { logger } from '@/lib/logger'
/**
 * Custom Hooks for Data Fetching
 * PWA-optimized hooks with offline support and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries } from '@/lib/query/apiQueries'
import { queryKeys } from '@/lib/query/queryKeys'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'
// Dynamic import to avoid module-level environment variable loading
import { useEffect, useState } from 'react'

// Clients Hooks
export function useClients(tenantId: string, filters?: any) {
  return useQuery({
    ...queries.getClients(tenantId, filters),
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5 minutes)
    gcTime: 3 * 60 * 1000, // 3 minutes (reduced from 10 minutes)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

export function useClient(tenantId: string, clientId: string) {
  return useQuery({
    ...queries.getClient(tenantId, clientId),
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 10 minutes)
    gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 30 minutes)
    enabled: Boolean(tenantId) && Boolean(clientId), // Simple, reactive enabled condition
  })
}

// Appointments Hooks
export function useAppointments(tenantId: string, filters?: any) {
  return useQuery({
    ...queries.getAppointments(tenantId, filters),
    staleTime: 30 * 1000, // 30 seconds (reduced from 2 minutes for real-time updates)
    gcTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 minutes)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

export function useAppointment(tenantId: string, appointmentId: string) {
  return useQuery({
    ...queries.getAppointment(tenantId, appointmentId),
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5 minutes)
    gcTime: 3 * 60 * 1000, // 3 minutes (reduced from 15 minutes)
    enabled: Boolean(tenantId) && Boolean(appointmentId), // Simple, reactive enabled condition
  })
}

// Calls Hooks
export function useCalls(tenantId: string, filters?: any) {
  return useQuery({
    ...queries.getCalls(tenantId, filters),
    staleTime: 10 * 1000, // 10 seconds (reduced from 30 seconds for more real-time)
    gcTime: 1 * 60 * 1000, // 1 minute (reduced from 2 minutes)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

export function useCall(tenantId: string, callId: string) {
  return useQuery({
    ...queries.getCall(tenantId, callId),
    staleTime: 10 * 1000, // 10 seconds (reduced from 30 seconds for very fresh data)
    gcTime: 1 * 60 * 1000, // 1 minute (reduced from 2 minutes)
    enabled: Boolean(tenantId) && Boolean(callId), // Simple, reactive enabled condition
  })
}

// Services Hooks
export function useServices(tenantId: string) {
  return useQuery({
    ...queries.getServices(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 30 minutes)
    gcTime: 15 * 60 * 1000, // 15 minutes (reduced from 1 hour)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

// Documents Hooks
export function useDocuments(tenantId: string, filters?: any) {
  return useQuery({
    ...queries.getDocuments(tenantId, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 10 minutes)
    gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 30 minutes)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

// Reports Hooks
export function useReportsData(tenantId: string, period: string = '30d') {
  return useQuery({
    ...queries.getReportsData(tenantId, period),
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 minutes)
    gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 15 minutes)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

// Company Hooks
export function useCompanySettings(tenantId: string) {
  return useQuery({
    ...queries.getCompanySettings(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 15 minutes)
    gcTime: 15 * 60 * 1000, // 15 minutes (reduced from 1 hour)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

export function useBusinessHours(tenantId: string) {
  return useQuery({
    ...queries.getBusinessHours(tenantId),
    staleTime: 10 * 60 * 1000, // 10 minutes (reduced from 30 minutes)
    gcTime: 30 * 60 * 1000, // 30 minutes (reduced from 2 hours)
    enabled: Boolean(tenantId), // Simple, reactive enabled condition
  })
}

// Mutation Hooks
export function useCreateClient(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientData: any) => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...clientData, tenant_id: tenantId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate all cache layers for clients
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'clients',
        specificId: data.id,
        warmCache: true
      })
    },
  })
}

export function useUpdateClient(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: any }) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update client')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Update the specific client in React Query cache
      queryClient.setQueryData(
        queryKeys.clients.detail(tenantId, data.id),
        data
      )
      
      // Invalidate the clients list query to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.list(tenantId)
      })
      
      // Also invalidate all clients queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.all
      })
      
      // Invalidate all cache layers for clients
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'clients',
        specificId: data.id,
        warmCache: true
      })
    },
  })
}

export function useDeleteClient(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('tenant_id', tenantId)

      if (error) throw error
    },
    onSuccess: async (_, clientId) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Remove from React Query cache
      queryClient.removeQueries({ queryKey: queryKeys.clients.detail(tenantId, clientId) })
      
      // Invalidate clients list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.list(tenantId)
      })
      
      // Also invalidate all clients queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.all
      })
      
      // Invalidate all cache layers for clients
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'clients',
        specificId: clientId,
        warmCache: true
      })
    },
  })
}

// Appointment Mutation Hooks
export function useUpdateAppointmentStatus(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ appointmentId, newStatus }: { appointmentId: string; newStatus: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' }) => {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointmentId,
          status: newStatus
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update appointment status'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate appointments list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.list(tenantId)
      })
      
      // Invalidate all appointments queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all
      })
      
      // Invalidate all cache layers for appointments
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: data.id,
        warmCache: true
      })
    },
  })
}

export function useUpdateAppointment(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ appointmentId, updatedData }: { appointmentId: string; updatedData: any }) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          updatedData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update appointment')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Update the specific appointment in React Query cache
      queryClient.setQueryData(
        queryKeys.appointments.detail(tenantId, data.appointment.id),
        data.appointment
      )
      
      // Invalidate appointments list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.list(tenantId)
      })
      
      // Also invalidate all appointments queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all
      })
      
      // Invalidate all cache layers for appointments
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: data.appointment.id,
        warmCache: true
      })
    },
  })
}

export function useCreateAppointment(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create appointment'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // If response is not valid JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate appointments list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.list(tenantId)
      })
      
      // Also invalidate all appointments queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all
      })
      
      // Invalidate all cache layers for appointments
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: data.id,
        warmCache: true
      })
    },
  })
}

export function useDeleteAppointment(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('tenant_id', tenantId)

      if (error) throw error
    },
    onSuccess: async (_, appointmentId) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Remove from React Query cache
      queryClient.removeQueries({ queryKey: queryKeys.appointments.detail(tenantId, appointmentId) })
      
      // Invalidate appointments list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.list(tenantId)
      })
      
      // Also invalidate all appointments queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all
      })
      
      // Invalidate all cache layers for appointments
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'appointments',
        specificId: appointmentId,
        warmCache: true
      })
    },
  })
}

// Services Mutation Hooks
export function useCreateService(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create service')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate services list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.list(tenantId)
      })
      
      // Also invalidate all services queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.all
      })
      
      // Invalidate all cache layers for services
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'services',
        specificId: data.service.id,
        warmCache: true
      })
    },
  })
}

export function useUpdateService(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ serviceId, serviceData }: { serviceId: string; serviceData: any }) => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          serviceData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update service')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Update the specific service in React Query cache
      queryClient.setQueryData(
        queryKeys.services.detail(tenantId, data.service.id),
        data.service
      )
      
      // Invalidate services list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.list(tenantId)
      })
      
      // Also invalidate all services queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.all
      })
      
      // Invalidate all cache layers for services
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'services',
        specificId: data.service.id,
        warmCache: true
      })
    },
  })
}

export function useDeleteService(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete service')
      }
    },
    onSuccess: async (_, serviceId) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Remove from React Query cache
      queryClient.removeQueries({ queryKey: queryKeys.services.detail(tenantId, serviceId) })
      
      // Invalidate services list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.list(tenantId)
      })
      
      // Also invalidate all services queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.all
      })
      
      // Invalidate all cache layers for services
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'services',
        specificId: serviceId,
        warmCache: true
      })
    },
  })
}

// Users Hooks
export function useUsers(tenantId: string, filters?: any) {
  return useQuery({
    ...queries.getUsers(tenantId, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(tenantId),
  })
}

export function useUser(tenantId: string, userId: string) {
  return useQuery({
    ...queries.getUser(tenantId, userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(tenantId) && Boolean(userId),
  })
}

// Users Mutation Hooks
export function useCreateUser(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/company/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate users list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.list(tenantId)
      })
      
      // Also invalidate all users queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all
      })
      
      // Invalidate all cache layers for users
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'users',
        specificId: data.employee.id,
        warmCache: true
      })
    },
  })
}

export function useUpdateUser(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: any }) => {
      const response = await fetch(`/api/company/employees/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Update the specific user in React Query cache
      queryClient.setQueryData(
        queryKeys.users.detail(tenantId, data.employee.id),
        data.user
      )
      
      // Invalidate users list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.list(tenantId)
      })
      
      // Also invalidate all users queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all
      })
      
      // Invalidate all cache layers for users
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'users',
        specificId: data.employee.id,
        warmCache: true
      })
    },
  })
}

export function useDeleteUser(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/company/employees/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
    },
    onSuccess: async (_, userId) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Remove from React Query cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(tenantId, userId) })
      
      // Invalidate users list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.list(tenantId)
      })
      
      // Also invalidate all users queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all
      })
      
      // Invalidate all cache layers for users
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'users',
        specificId: userId,
        warmCache: true
      })
    },
  })
}

// Call Follow-up Mutation Hook
export function useUpdateCallFollowUp(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ callId, followUpData }: { callId: string; followUpData: any }) => {
      const response = await fetch(`/api/calls/${callId}/follow-up`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(followUpData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update call follow-up')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Update the specific call in React Query cache
      queryClient.setQueryData(
        queryKeys.calls.detail(tenantId, data.id),
        data
      )
      
      // Invalidate calls list queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.calls.list(tenantId)
      })
      
      // Also invalidate all calls queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: queryKeys.calls.all
      })
      
      // Invalidate all cache layers for calls
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'calls',
        specificId: data.id,
        warmCache: true
      })
    },
  })
}

// Real-time Updates Hook
export function useRealtimeUpdates(tenantId: string) {
  const queryClient = useQueryClient()
  const [supabase, setSupabase] = useState<any>(null)
  
  useEffect(() => {
    const initSupabase = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      setSupabase(createClient())
    }
    initSupabase()
  }, [])

  useEffect(() => {
    if (!tenantId || !supabase || tenantId.trim() === '') return

    // Set query client for cache invalidation service
    simplifiedCacheManager.setQueryClient(queryClient)

    // Subscribe to clients changes
    let clientsSubscription: any = null
    try {
      clientsSubscription = supabase
        .channel('clients-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clients',
            filter: `tenant_id=eq.${tenantId}`,
          },
          async (payload: any) => {
            try {
              // Invalidate all cache layers for clients
              await simplifiedCacheManager.invalidateData({
                tenantId,
                dataType: 'clients',
                specificId: payload.new?.id || payload.old?.id,
                warmCache: true
              })
            } catch (error) {
              logger.error('Error in clients subscription:', error)
            }
          }
        )
        .subscribe()
    } catch (error) {
      logger.error('Error setting up clients subscription:', error)
    }

    // Subscribe to appointments changes
    let appointmentsSubscription: any = null
    try {
      appointmentsSubscription = supabase
        .channel('appointments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `tenant_id=eq.${tenantId}`,
          },
          async (payload: any) => {
            try {
              // Invalidate all cache layers for appointments
              await simplifiedCacheManager.invalidateData({
                tenantId,
                dataType: 'appointments',
                specificId: payload.new?.id || payload.old?.id,
                warmCache: true
              })
            } catch (error) {
              logger.error('Error in appointments subscription:', error)
            }
          }
        )
        .subscribe()
    } catch (error) {
      logger.error('Error setting up appointments subscription:', error)
    }

    // Subscribe to calls changes
    let callsSubscription: any = null
    try {
      callsSubscription = supabase
        .channel('calls-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calls',
            filter: `tenant_id=eq.${tenantId}`,
          },
          async (payload: any) => {
            try {
              // Invalidate all cache layers for calls
              await simplifiedCacheManager.invalidateData({
                tenantId,
                dataType: 'calls',
                specificId: payload.new?.id || payload.old?.id,
                warmCache: true
              })
            } catch (error) {
              logger.error('Error in calls subscription:', error)
            }
          }
        )
        .subscribe()
    } catch (error) {
      logger.error('Error setting up calls subscription:', error)
    }

    return () => {
      try {
        clientsSubscription?.unsubscribe()
        appointmentsSubscription?.unsubscribe()
        callsSubscription?.unsubscribe()
      } catch (error) {
        logger.error('Error unsubscribing from real-time updates:', error)
      }
    }
  }, [tenantId, queryClient, supabase])
}

// Settings Mutation Hooks
export function useUpdateUserSettings(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user settings')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate user settings queries
      queryClient.invalidateQueries({
        queryKey: ['user-settings']
      })
      
      // Invalidate all cache layers for user settings
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'user-settings',
        warmCache: true
      })
    },
  })
}

export function useUpdateCompanySettings(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update company settings')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate company settings queries
      queryClient.invalidateQueries({
        queryKey: ['company-settings']
      })
      
      // Invalidate all cache layers for company settings
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'company-settings',
        warmCache: true
      })
    },
  })
}

export function useUpdateNotificationSettings(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update notification settings')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate notification settings queries
      queryClient.invalidateQueries({
        queryKey: ['notification-settings']
      })
      
      // Invalidate all cache layers for notification settings
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'notification-settings',
        warmCache: true
      })
    },
  })
}

// Service Area Mutation Hooks
export function useCreateServiceArea(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serviceAreaData: any) => {
      const response = await fetch('/api/service-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...serviceAreaData,
          tenant_id: tenantId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create service area')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate service areas queries
      queryClient.invalidateQueries({
        queryKey: ['service-areas']
      })
      
      // Invalidate all cache layers for service areas
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'service-areas',
        specificId: data.serviceArea?.id,
        warmCache: true
      })
    },
  })
}

export function useUpdateServiceArea(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ serviceAreaId, serviceAreaData }: { serviceAreaId: string; serviceAreaData: any }) => {
      const response = await fetch(`/api/service-areas/${serviceAreaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceAreaData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update service area')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate service areas queries
      queryClient.invalidateQueries({
        queryKey: ['service-areas']
      })
      
      // Invalidate all cache layers for service areas
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'service-areas',
        specificId: data.serviceArea?.id,
        warmCache: true
      })
    },
  })
}

export function useDeleteServiceArea(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serviceAreaId: string) => {
      const response = await fetch(`/api/service-areas/${serviceAreaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete service area')
      }
    },
    onSuccess: async (_, serviceAreaId) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Remove from React Query cache
      queryClient.removeQueries({ queryKey: ['service-areas', serviceAreaId] })
      
      // Invalidate service areas queries
      queryClient.invalidateQueries({
        queryKey: ['service-areas']
      })
      
      // Invalidate all cache layers for service areas
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'service-areas',
        specificId: serviceAreaId,
        warmCache: true
      })
    },
  })
}

// VAPI Integration Mutation Hooks
export function useSaveVapiApiKey(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch('/api/provider-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          provider: 'vapi',
          api_key: apiKey
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save API key')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate VAPI configuration queries
      queryClient.invalidateQueries({
        queryKey: ['vapi-config']
      })
      
      // Invalidate all cache layers for VAPI configuration
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'vapi-config',
        warmCache: true
      })
    },
  })
}

export function useCreateVapiAssistant(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assistantData: any) => {
      const response = await fetch('/api/vapi/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assistantData,
          tenant_id: tenantId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assistant')
      }

      return await response.json()
    },
    onSuccess: async (data: any) => {
      // Set query client for cache invalidation service
      simplifiedCacheManager.setQueryClient(queryClient)
      
      // Invalidate VAPI configuration queries
      queryClient.invalidateQueries({
        queryKey: ['vapi-config']
      })
      
      // Invalidate all cache layers for VAPI configuration
      await simplifiedCacheManager.invalidateData({
        tenantId,
        dataType: 'vapi-config',
        warmCache: true
      })
    },
  })
}

// Offline Support Hook
export function useOfflineSupport() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleOnline = () => {
      queryClient.invalidateQueries()
    }

    const handleOffline = () => {
      // App is offline, queries will use cached data
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])
}
