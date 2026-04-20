'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/components/providers'
import { apiClient } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database-comprehensive'
// Dynamic import to avoid module load time environment variable check

// Use proper types from database schema
type Tenant = Database['public']['Tables']['tenants']['Row']

interface Company {
  id: string
  name: string
  slug: string
  timezone: string
  business_hours: any
  service_area: string
  service_radius_miles: number
  base_address: string
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  subscription_active: boolean
  subscription_plan: 'basic' | 'professional' | 'enterprise'
}

interface AppState {
  // Company data
  company: Company | null
  companyLoading: boolean
  companyError: string | null

  // Tenant data
  tenantId: string | null

  // App status
  isOnline: boolean
  lastSync: Date | null

  // Actions
  refreshCompany: () => Promise<void>
  updateCompany: (updates: Partial<Company>) => Promise<void>
  setOnlineStatus: (status: boolean) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Alias for backwards compatibility
export const useAppContext = useApp

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  // State
  const [company, setCompany] = useState<Company | null>(null)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadCompany = useCallback(async () => {
    if (!user) {
      return
    }

    setCompanyLoading(true)
    setCompanyError(null)

    try {
      // Verify user is still authenticated before making API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setCompany(null)
        setCompanyError('Please log in to view company data')
        return
      }

      // Check if we're online before making API calls
      if (!navigator.onLine) {
        setCompanyError('You are offline. Please check your internet connection.')
        return
      }

      // Use standardized tenant resolution
      const { getTenantIdForClient } = await import('@/lib/tenant-utils')
      const resolvedTenantId = await getTenantIdForClient(user)
      
      if (!resolvedTenantId) {
        setCompanyError('User not associated with a company. Please contact support.')
        setCompanyLoading(false)
        return
      }

      // Set tenant ID in global state
      setTenantId(resolvedTenantId)

      // Try to load company settings with better error handling
      let response = await apiClient.get(`/api/company-settings-simple?tenant_id=${resolvedTenantId}`)
      
      // Handle network errors specifically
      if (response.error && response.error.includes('Failed to fetch')) {
        // Network error loading company settings
        setCompanyError('Network error. Please check your internet connection and try again.')
        return
      }
      
      // If user not found in database, try to fix it
      if (response.error && (response.error.includes('User not associated with a company') || response.error.includes('User not found'))) {
        const fixResponse = await apiClient.post('/api/fix-user')
        
        if (fixResponse.error) {
          // Failed to fix user account
          setCompanyError('Failed to set up user account. Please contact support.')
          return
        }
        
        // Retry loading company settings
        response = await apiClient.get(`/api/company-settings-simple?tenant_id=${resolvedTenantId}`)
      }
      
      if (response.error) {
        // Company settings error
        
        // Handle specific error cases
        if (response.error === 'Unauthorized' || response.error.includes('401')) {
          setCompany(null)
          setCompanyError('Please log in to view company data')
          return
        }
        
        // If it's still a user-related error after trying to fix, show a helpful message
        if (response.error.includes('User not associated with a company') || response.error.includes('User not found')) {
          setCompanyError('Account setup incomplete. Please refresh the page or contact support.')
          return
        }
        
        // For other errors, show the error but don't crash
        setCompanyError(`Failed to load company data: ${response.error}`)
        return
      }

      const companyData = response.data as { company?: Company }
      setCompany(companyData?.company || null)
      setLastSync(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load company data'
      setCompanyError(errorMessage)
      // Error loading company
      
      // Handle specific error types
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setCompanyError('Network error. Please check your internet connection and try again.')
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        setCompany(null)
        setCompanyError('Please log in to view company data')
      } else {
        setCompanyError(`Failed to load company data: ${errorMessage}`)
      }
    } finally {
      setCompanyLoading(false)
    }
  }, [user])

  // Load company data when user changes
  useEffect(() => {
    if (user && !authLoading) {
      loadCompany()
    } else if (!user && !authLoading) {
      setCompany(null)
      setCompanyError(null)
      setTenantId(null)
    }
  }, [user, authLoading, loadCompany])

  const refreshCompany = async () => {
    await loadCompany()
  }

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return

    try {
      const response = await apiClient.put('/api/company/settings', updates)
      
      if (response.error) {
        throw new Error(response.error)
      }

      setCompany(prev => prev ? { ...prev, ...updates } : null)
      setLastSync(new Date())
    } catch (error) {
      // Error updating company
      throw error
    }
  }

  const setOnlineStatus = (status: boolean) => {
    setIsOnline(status)
  }

  const value: AppState = {
    company,
    companyLoading,
    companyError,
    tenantId,
    isOnline,
    lastSync,
    refreshCompany,
    updateCompany,
    setOnlineStatus,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
