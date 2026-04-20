// Custom hooks for API calls with state management
// Provides loading states, error handling, and data management

import { useState, useCallback, useEffect } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  status: number | null
}

interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    status: null,
  })

  const execute = useCallback(async (method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET', data?: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      let response: ApiResponse<T>
      
      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(endpoint)
          break
        case 'POST':
          response = await apiClient.post<T>(endpoint, data)
          break
        case 'PUT':
          response = await apiClient.put<T>(endpoint, data)
          break
        case 'DELETE':
          response = await apiClient.delete<T>(endpoint)
          break
        case 'PATCH':
          response = await apiClient.patch<T>(endpoint, data)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      if (response.error) {
        throw new Error(response.error)
      }

      setState({
        data: response.data,
        loading: false,
        error: null,
        status: response.status,
      })

      onSuccess?.(response.data)
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        status: null,
      })

      onError?.(errorMessage)
      throw error
    }
  }, [endpoint, onSuccess, onError])

  const get = useCallback(() => execute('GET'), [execute])
  const post = useCallback((data?: any) => execute('POST', data), [execute])
  const put = useCallback((data?: any) => execute('PUT', data), [execute])
  const del = useCallback(() => execute('DELETE'), [execute])
  const patch = useCallback((data?: any) => execute('PATCH', data), [execute])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: null,
    })
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      get()
    }
  }, [immediate, get])

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    patch,
    reset,
  }
}

// Hook for specific API patterns
export function useCompanySettings() {
  return useApi('/api/company/settings', { immediate: true })
}

export function useClients() {
  return useApi('/api/clients', { immediate: true })
}

export function useCalls() {
  return useApi('/api/calls', { immediate: true })
}

export function useAppointments() {
  return useApi('/api/appointments', { immediate: true })
}

export function useServices() {
  return useApi('/api/services', { immediate: true })
}

// Hook for health monitoring
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    try {
      const response = await apiClient.healthCheck()
      const healthy = response.data?.status === 'healthy'
      setIsHealthy(healthy)
      setLastCheck(new Date())
      return healthy
    } catch (error) {
      setIsHealthy(false)
      setLastCheck(new Date())
      return false
    }
  }, [])

  // Check health every 30 seconds
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    isHealthy,
    lastCheck,
    checkHealth,
  }
}

// Hook for integration testing
export function useIntegrationTest() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runTest = useCallback(async () => {
    setIsRunning(true)
    try {
      const response = await apiClient.integrationTest()
      setTestResults(response.data)
      return response.data
    } catch (error) {
      throw error
    } finally {
      setIsRunning(false)
    }
  }, [])

  return {
    testResults,
    isRunning,
    runTest,
  }
}
