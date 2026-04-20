'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Bell, Phone, AlertTriangle, CheckCircle, X, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface CallNotificationManagerProps {
  tenantId: string
  onViewCall?: (call: any) => void
}

interface CallNotification {
  id: string // Call ID (for display and linking)
  notificationId?: string // Notification ID (for deletion from notifications table)
  from_number: string | null
  status: string
  ai_summary: string | null
  follow_up_required: boolean | null
  created_at: string
  read?: boolean
  clients?: {
    first_name: string
    last_name: string
  } | null
}

export function CallNotificationManager({ tenantId, onViewCall }: CallNotificationManagerProps) {
  const [notifications, setNotifications] = useState<CallNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isCleared, setIsCleared] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null)
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Load dismissed notifications from localStorage on mount
  useEffect(() => {
    const savedDismissed = localStorage.getItem(`dismissed-notifications-${tenantId}`)
    if (savedDismissed) {
      try {
        const dismissedArray = JSON.parse(savedDismissed)
        setDismissedNotifications(new Set(dismissedArray))
      } catch (error) {
        // Silently handle localStorage errors
      }
    }
  }, [tenantId])
  
  // Save dismissed notifications to localStorage
  const saveDismissedNotifications = (dismissed: Set<string>) => {
    try {
      localStorage.setItem(`dismissed-notifications-${tenantId}`, JSON.stringify([...dismissed]))
    } catch (error) {
      // Silently handle localStorage errors
    }
  }
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to new calls for notifications (but don't delete them!)
    const channel = supabase
      .channel('calls-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const newCall = payload.new as CallNotification
          
          // Only create notification and show if not dismissed
          if (!dismissedNotifications.has(newCall.id)) {
            // Create a notification record instead of using the call directly
            const createNotification = async () => {
              // Get current user for notification
              const { data: { user } } = await supabase.auth.getUser()
              
              if (user) {
                // Check if notification already exists for this call to avoid duplicates
                const { data: existingNotif } = await supabase
                  .from('notifications')
                  .select('id')
                  .eq('tenant_id', tenantId)
                  .eq('user_id', user.id)
                  .eq('type', 'call')
                  .eq('data->>call_id', newCall.id)
                  .maybeSingle()
                
                // Only create if it doesn't already exist
                if (!existingNotif) {
                  const { error: notificationError } = await (supabase as any)
                    .from('notifications')
                    .insert({
                      tenant_id: tenantId,
                      user_id: user.id,
                      type: 'call',
                      title: 'New Call',
                      message: `New call from ${newCall.from_number || 'Unknown number'}`,
                      data: {
                        call_id: newCall.id,
                        from_number: newCall.from_number,
                        status: newCall.status,
                        follow_up_required: newCall.follow_up_required
                      }
                    })
                  
                  if (notificationError) {
                    // Silently handle notification creation errors
                  }
                }
              }
            }
            
            createNotification()
            
            // Check if notification already exists (avoid duplicates from race conditions)
            setNotifications(prev => {
              const exists = prev.some(n => n.id === newCall.id)
              if (exists) {
                return prev // Don't add duplicate
              }
              // Add new notification at the beginning
              return [newCall, ...prev]
            })
            setUnreadCount(prev => prev + 1)
            setIsCleared(false) // Reset cleared state when new call arrives
            setIsVisible(true) // Show popup when new call arrives
            
            // Show toast notification
            const callerName = newCall.clients ? 
              `${newCall.clients.first_name} ${newCall.clients.last_name}` : 
              'Unknown Caller'
            
            const message = newCall.follow_up_required ? 
              `🚨 Follow-up required: ${callerName} (${newCall.from_number || 'Unknown number'})` :
              `📞 New call from ${callerName} (${newCall.from_number || 'Unknown number'})`
            
            toast.success(message, {
              duration: 8000,
              action: {
                label: 'View Details',
                onClick: () => {
                  onViewCall?.(newCall)
                }
              }
            })
          }
        }
      )
      .subscribe()

    // Load recent notifications from notifications table (not calls table)
    const loadRecentNotifications = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return
      }

      // Load from notifications table, not calls table
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          message,
          data,
          created_at,
          is_read
        `)
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('type', 'call')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        return
      }

      // Convert notifications to CallNotification format
      const callNotifications: CallNotification[] = (data || []).map((notif: any) => ({
        id: notif.data?.call_id || notif.id, // Call ID for display
        notificationId: notif.id, // Notification ID for deletion
        from_number: notif.data?.from_number || 'Unknown number',
        status: notif.data?.status || 'unknown',
        ai_summary: notif.message || '',
        follow_up_required: notif.data?.follow_up_required || false,
        created_at: notif.created_at,
        read: notif.is_read || false,
        clients: null // Will be populated from call data if needed
      }))

      // Filter out dismissed notifications
      const filteredData = callNotifications.filter((call: any) => !dismissedNotifications.has(call.id))
      
      // Merge with existing notifications instead of replacing (preserve real-time updates)
      setNotifications(prev => {
        // Create a map of existing notifications by ID
        const existingMap = new Map(prev.map(n => [n.id, n]))
        
        // Add/update from loaded notifications
        filteredData.forEach(notif => {
          existingMap.set(notif.id, notif)
        })
        
        // Convert back to array and sort by created_at
        return Array.from(existingMap.values()).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
      
      // Mark initial load as complete
      setIsInitialLoad(false)
    }

    // Load notifications after a short delay to ensure real-time updates aren't overwritten
    const loadTimer = setTimeout(() => {
      loadRecentNotifications()
    }, 100)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(loadTimer)
    }
  }, [tenantId, supabase, onViewCall]) // Removed dismissedNotifications from deps to prevent re-running

  const markAsRead = (callId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === callId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const deleteNotification = async (callId: string) => {
    // Find the notification to get the notification ID
    const notification = notifications.find(n => n.id === callId)
    if (!notification) return
    
    const notificationId = notification.notificationId || callId
    setDeletingNotificationId(callId)
    
    try {
      // PERMANENTLY DELETE FROM DATABASE using notification ID
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (deleteError) {
        throw deleteError
      }
      
      // Add to dismissed notifications set (for UI state management)
      const newDismissed = new Set([...dismissedNotifications, callId])
      setDismissedNotifications(newDismissed)
      saveDismissedNotifications(newDismissed)
      
      // Remove from local state
      const updatedNotifications = notifications.filter(notif => notif.id !== callId)
      setNotifications(updatedNotifications)
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // If this was the last notification, hide the popup
      if (updatedNotifications.length === 0) {
        setIsVisible(false)
      }
      
      toast.success('Notification permanently deleted')
    } catch (error) {
      logger.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    } finally {
      setDeletingNotificationId(null)
    }
  }

  const clearAllNotifications = async () => {
    setShowClearAllModal(true)
  }

  const handleClearAllConfirm = async () => {
    setIsClearing(true)
    setShowClearAllModal(false)
    
    try {
      // Get current user for deletion
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // PERMANENTLY DELETE ALL NOTIFICATIONS FROM DATABASE
      // Get all notification IDs from current notifications
      const notificationIds = notifications
        .map(n => n.notificationId)
        .filter((id): id is string => !!id)
      
      if (notificationIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('id', notificationIds)
        
        if (deleteError) {
          throw deleteError
        }
      }
      
      // Also delete all call-type notifications for this user/tenant as fallback
      const { error: deleteAllError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .eq('type', 'call')
      
      if (deleteAllError) {
        // Log but don't throw - we already deleted specific ones
        logger.error('Error deleting all call notifications:', deleteAllError)
      }
      
      // Add all current notifications to dismissed set (for UI state management)
      const allNotificationIds = notifications.map(notif => notif.id)
      const newDismissed = new Set([...dismissedNotifications, ...allNotificationIds])
      setDismissedNotifications(newDismissed)
      saveDismissedNotifications(newDismissed)
      
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setNotifications([])
      setUnreadCount(0)
      setIsCleared(true)
      setIsClearing(false)
      setIsVisible(false) // Hide the popup immediately after clearing
      toast.success('All notifications permanently deleted')
    } catch (error) {
      logger.error('Error clearing all notifications:', error)
      toast.error('Failed to clear all notifications')
    } finally {
      setIsClearing(false)
    }
  }

  // Always show the bell button if there are notifications, even if popup is closed
  // Don't hide during initial load to allow real-time notifications to appear
  if (notifications.length === 0 && !isInitialLoad) {
    return null
  }

  return (
    <>
      {/* Bell Button - Always visible when there are notifications */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="relative bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50 transition-colors"
          title={isVisible ? "Hide notifications" : "Show notifications"}
        >
          <Bell className="h-4 w-4 text-blue-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Popup - Only visible when isVisible is true */}
      {isVisible && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-white rounded-lg shadow-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-gray-900">Recent Calls</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllNotifications}
                  disabled={isClearing}
                  className="text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border hover:bg-gray-50 ${
                    notification.follow_up_required ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {notification.follow_up_required ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Phone className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {notification.clients ? 
                            `${notification.clients.first_name} ${notification.clients.last_name}` : 
                            'Unknown Caller'
                          }
                        </span>
                        {notification.follow_up_required && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Follow-up
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.from_number || 'Unknown number'}
                      </p>
                      
                      {notification.ai_summary && (
                        <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                          {notification.ai_summary}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      disabled={deletingNotificationId === notification.id}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Permanently delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        onConfirm={handleClearAllConfirm}
        title="Clear All Notifications"
        description="Are you sure you want to permanently delete all notifications? This action cannot be undone and will remove all notifications from the database."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="destructive"
        loading={isClearing}
      />
    </>
  )
}