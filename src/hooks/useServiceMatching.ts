import { useState, useCallback } from 'react'
import { ServiceMatch } from '@/lib/services/service-matcher'
import { logger } from '@/lib/logger'

interface UseServiceMatchingReturn {
  findServiceMatch: (clientRequest: string) => Promise<ServiceMatch | null>
  isLoading: boolean
  error: string | null
  lastMatch: ServiceMatch | null
}

/**
 * Hook for matching client requests to services
 * Includes fallback to general service if no specific service matches
 */
export function useServiceMatching(tenantId: string): UseServiceMatchingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMatch, setLastMatch] = useState<ServiceMatch | null>(null)

  const findServiceMatch = useCallback(async (clientRequest: string): Promise<ServiceMatch | null> => {
    if (!tenantId || !clientRequest.trim()) {
      setError('Missing tenantId or client request')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/services/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          clientRequest: clientRequest.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to match service')
      }

      const match = data.match as ServiceMatch
      setLastMatch(match)
      return match

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logger.error('Service matching error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  return {
    findServiceMatch,
    isLoading,
    error,
    lastMatch
  }
}

/**
 * Hook for getting all available service keywords
 */
export function useServiceKeywords(tenantId: string) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeywords = useCallback(async () => {
    if (!tenantId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/services/match?tenantId=${encodeURIComponent(tenantId)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get service keywords')
      }

      setKeywords(data.keywords || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logger.error('Service keywords error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  return {
    keywords,
    isLoading,
    error,
    fetchKeywords
  }
}
