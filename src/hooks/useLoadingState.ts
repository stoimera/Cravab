/**
 * Custom hook for managing loading states
 */

import { useState, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  error: string | null
  data: any
}

interface UseLoadingStateOptions {
  initialData?: any
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: options.initialData || null
  })

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }))
  }, [])

  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error
    setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [options.onError])

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data, isLoading: false, error: null }))
    
    if (options.onSuccess) {
      options.onSuccess(data)
    }
  }, [options.onSuccess])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: options.initialData || null
    })
  }, [options.initialData])

  const execute = useCallback(async (asyncFunction: () => Promise<any>) => {
    setLoading(true)
    try {
      const result = await asyncFunction()
      setData(result)
      return result
    } catch (error) {
      setError(error as Error)
      throw error
    }
  }, [setLoading, setData, setError])

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
    execute
  }
}
