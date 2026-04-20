/**
 * Storage Example Component
 * Demonstrates how to use the new global storage system
 */

'use client'

import { useClients, useAppointments, useCalls, useRealtimeUpdates, useOfflineSupport } from '@/hooks/useQueries'
import { useAuth } from '@/components/providers'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff, Database, Clock } from 'lucide-react'

export function StorageExample() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheStats, setCacheStats] = useState<any>(null)

  const tenantId = user?.user_metadata?.tenant_id || user?.id || ''

  // Use the new query hooks
  const { 
    data: clients, 
    isLoading: clientsLoading, 
    error: clientsError,
    refetch: refetchClients 
  } = useClients(tenantId)

  const { 
    data: appointments, 
    isLoading: appointmentsLoading,
    refetch: refetchAppointments 
  } = useAppointments(tenantId)

  const { 
    data: calls, 
    isLoading: callsLoading,
    refetch: refetchCalls 
  } = useCalls(tenantId)

  // Enable real-time updates and offline support
  useRealtimeUpdates(tenantId)
  useOfflineSupport()

  // Monitor online/offline status
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

  // Get cache statistics (this would be implemented in your cache manager)
  useEffect(() => {
    const getStats = async () => {
      // This would call your cache manager's getStats method
      setCacheStats({
        clients: Array.isArray(clients) ? clients.length : 0,
        appointments: Array.isArray(appointments) ? appointments.length : 0,
        calls: Array.isArray(calls) ? calls.length : 0,
        online: isOnline
      })
    }

    getStats()
  }, [clients, appointments, calls, isOnline])

  const handleRefresh = () => {
    refetchClients()
    refetchAppointments()
    refetchCalls()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Global Storage System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh All
            </Button>
          </div>

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cacheStats.clients}</div>
                <div className="text-sm text-gray-500">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{cacheStats.appointments}</div>
                <div className="text-sm text-gray-500">Appointments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{cacheStats.calls}</div>
                <div className="text-sm text-gray-500">Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {cacheStats.online ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500">Status</div>
              </div>
            </div>
          )}

          {/* Data Loading States */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Loading States:</span>
            </div>
            <div className="flex gap-4 text-sm">
              <Badge variant={clientsLoading ? 'secondary' : 'outline'}>
                Clients {clientsLoading ? 'Loading...' : 'Ready'}
              </Badge>
              <Badge variant={appointmentsLoading ? 'secondary' : 'outline'}>
                Appointments {appointmentsLoading ? 'Loading...' : 'Ready'}
              </Badge>
              <Badge variant={callsLoading ? 'secondary' : 'outline'}>
                Calls {callsLoading ? 'Loading...' : 'Ready'}
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {clientsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Error loading clients: {clientsError.message}
              </p>
            </div>
          )}

          {/* Data Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Clients</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(clients) ? clients.slice(0, 3).map((client: any) => (
                  <div key={client.id} className="text-sm py-1">
                    {client.first_name} {client.last_name}
                  </div>
                )) : <div className="text-sm text-gray-500">No clients</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(appointments) ? appointments.slice(0, 3).map((appointment: any) => (
                  <div key={appointment.id} className="text-sm py-1">
                    {new Date(appointment.starts_at).toLocaleDateString()}
                  </div>
                )) : <div className="text-sm text-gray-500">No appointments</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(calls) ? calls.slice(0, 3).map((call: any) => (
                  <div key={call.id} className="text-sm py-1">
                    {call.status} - {new Date(call.created_at).toLocaleTimeString()}
                  </div>
                )) : <div className="text-sm text-gray-500">No calls</div>}
              </CardContent>
            </Card>
          </div>

          {/* Features Demo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Storage Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ TanStack Query for client-side caching</li>
              <li>✅ Application-level cache for webhook context</li>
              <li>✅ PWA offline storage with IndexedDB</li>
              <li>✅ Real-time updates with Supabase subscriptions</li>
              <li>✅ Automatic retry and error handling</li>
              <li>✅ Tenant isolation and RLS compliance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
