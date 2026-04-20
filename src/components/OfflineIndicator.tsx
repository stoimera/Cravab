'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useOfflineQueue } from '@/lib/offline/offline-queue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function OfflineIndicator() {
  const { status, forceSync, clearQueue } = useOfflineQueue()
  const [showDetails, setShowDetails] = useState(false)

  // Don't show if online and no pending actions
  if (status.isOnline && status.queueSize === 0) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white shadow-lg border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {status.isOnline ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Wifi className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <WifiOff className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {status.isOnline ? 'Syncing...' : 'You\'re offline'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="h-6 w-6 p-0"
                    >
                      {showDetails ? '−' : '+'}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600">
                    {status.isOnline 
                      ? `${status.queueSize} items syncing...`
                      : `${status.queueSize} items queued for sync`
                    }
                  </p>
                  
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 space-y-2"
                    >
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Pending actions:</span>
                          <span className="font-medium">{status.pendingActions}</span>
                        </div>
                        {status.failedActions > 0 && (
                          <div className="flex items-center justify-between text-red-600">
                            <span>Failed actions:</span>
                            <span className="font-medium">{status.failedActions}</span>
                          </div>
                        )}
                        {status.lastSync && (
                          <div className="flex items-center justify-between">
                            <span>Last sync:</span>
                            <span className="font-medium">
                              {new Date(status.lastSync).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {status.isOnline && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={forceSync}
                            className="flex-1"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Sync Now
                          </Button>
                        )}
                        {status.queueSize > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearQueue}
                            className="flex-1"
                          >
                            Clear Queue
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Offline banner for when user is offline
export function OfflineBanner() {
  const { status } = useOfflineQueue()
  
  if (status.isOnline) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white"
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            You're offline. Changes will sync when you're back online.
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Sync status indicator for header
export function SyncStatusIndicator() {
  const { status } = useOfflineQueue()
  
  if (status.isOnline && status.queueSize === 0) return null

  return (
    <div className="flex items-center gap-2">
      {status.isOnline ? (
        <div className="flex items-center gap-1 text-green-600">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span className="text-xs">Syncing</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <WifiOff className="w-3 h-3" />
          <span className="text-xs">Offline</span>
        </div>
      )}
      {status.queueSize > 0 && (
        <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
          {status.queueSize}
        </div>
      )}
    </div>
  )
}
