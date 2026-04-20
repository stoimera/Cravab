// Centralized API Client for Cravab
// Provides consistent API configuration, error handling, and request management

import { createClient } from '@/lib/supabase/client'
import { getApiUrl } from '@/lib/url-helper'

interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  status: number
}

interface ApiRequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

class ApiClient {
  private baseURL: string
  private defaultTimeout: number
  private defaultRetries: number
  private defaultRetryDelay: number

  constructor() {
    // For frontend API calls, always use localhost to avoid CORS issues
    // The ngrok URL is only needed for webhook testing (external calls to our API)
    this.baseURL = getApiUrl()
    this.defaultTimeout = 10000 // 10 seconds
    this.defaultRetries = 3
    this.defaultRetryDelay = 1000 // 1 second
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  private async makeRequest<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options

    const url = `${this.baseURL}${endpoint}`
    const authHeaders = await this.getAuthHeaders()

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        ...authHeaders,
        ...fetchOptions.headers,
      },
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorData: any = {}
          try {
            errorData = await response.json()
          } catch {
            // If response is not JSON, use status text
            errorData = { message: response.statusText }
          }
          
          throw new Error(
            errorData.message || 
            errorData.error || 
            `HTTP ${response.status}: ${response.statusText}`
          )
        }

        const data = await response.json().catch(() => null)

        return {
          data,
          error: null,
          status: response.status,
        }
      } catch (error) {
        lastError = error as Error

        // Handle specific error types
        if (error instanceof Error) {
          // Network errors and timeouts are handled silently
        }

        // Don't retry on certain errors
        if (
          error instanceof Error &&
          (error.name === 'AbortError' || 
           error.message.includes('401') || 
           error.message.includes('403') ||
           error.message.includes('404'))
        ) {
          break
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        }
      }
    }

    return {
      data: null,
      error: lastError?.message || 'Request failed after all retries',
      status: 0,
    }
  }

  // GET request
  async get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  // POST request
  async post<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // PATCH request
  async patch<T = unknown>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/api/health')
  }

  // Integration test
  async integrationTest(): Promise<ApiResponse<{ success: boolean; results: unknown[] }>> {
    return this.get('/api/integration-test')
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export individual methods for convenience
export const { get, post, put, delete: del, patch, healthCheck, integrationTest } = apiClient

// Export types
export type { ApiResponse, ApiRequestOptions }
