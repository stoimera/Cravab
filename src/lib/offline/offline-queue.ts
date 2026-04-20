/**
 * Offline Data Queue System
 * Manages offline data synchronization for appointments and calls
 */

import React, { useState, useEffect } from 'react'

export interface OfflineAction {
  id: string
  type: 'CREATE_APPOINTMENT' | 'UPDATE_APPOINTMENT' | 'DELETE_APPOINTMENT' | 'CREATE_CALL' | 'UPDATE_CALL'
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
  priority: 'high' | 'medium' | 'low'
}

export interface SyncStatus {
  isOnline: boolean
  queueSize: number
  lastSync: number | null
  pendingActions: number
  failedActions: number
}

class OfflineQueueManager {
  private static instance: OfflineQueueManager
  private queue: OfflineAction[] = []
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private listeners: ((status: SyncStatus) => void)[] = []

  private constructor() {
    this.setupEventListeners()
    this.loadQueueFromStorage()
  }

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager()
    }
    return OfflineQueueManager.instance
  }

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners()
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners()
    })

    // Visibility change (when user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue()
      }
    })
  }

  private loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('offline-queue')
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      // Failed to load offline queue
      this.queue = []
    }
  }

  private saveQueueToStorage() {
    try {
      localStorage.setItem('offline-queue', JSON.stringify(this.queue))
    } catch (error) {
      // Failed to save offline queue
    }
  }

  private notifyListeners() {
    const status = this.getSyncStatus()
    this.listeners.forEach(listener => listener(status))
  }

  /**
   * Add action to offline queue
   */
  addAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const offlineAction: OfflineAction = {
      id,
      timestamp: Date.now(),
      retryCount: 0,
      ...action
    }

    this.queue.push(offlineAction)
    this.saveQueueToStorage()
    this.notifyListeners()

    // Try to process immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processQueue()
    }

    return id
  }

  /**
   * Process the offline queue
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.queue.length === 0) {
      return
    }

    this.syncInProgress = true
    this.notifyListeners()

    try {
      // Sort by priority and timestamp
      const sortedQueue = [...this.queue].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return a.timestamp - b.timestamp
      })

      for (const action of sortedQueue) {
        try {
          await this.executeAction(action)
          this.removeAction(action.id)
        } catch (error) {
          // Failed to execute action
          action.retryCount++
          
          if (action.retryCount >= action.maxRetries) {
            // Action exceeded max retries, removing from queue
            this.removeAction(action.id)
          }
        }
      }
    } finally {
      this.syncInProgress = false
      this.saveQueueToStorage()
      this.notifyListeners()
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const { type, data } = action

    switch (type) {
      case 'CREATE_APPOINTMENT':
        await this.createAppointment(data)
        break
      case 'UPDATE_APPOINTMENT':
        await this.updateAppointment(data)
        break
      case 'DELETE_APPOINTMENT':
        await this.deleteAppointment(data)
        break
      case 'CREATE_CALL':
        await this.createCall(data)
        break
      case 'UPDATE_CALL':
        await this.updateCall(data)
        break
      default:
        throw new Error(`Unknown action type: ${type}`)
    }
  }

  private async createAppointment(data: any): Promise<void> {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to create appointment: ${response.statusText}`)
    }
  }

  private async updateAppointment(data: any): Promise<void> {
    const { id, ...updateData } = data
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      throw new Error(`Failed to update appointment: ${response.statusText}`)
    }
  }

  private async deleteAppointment(data: any): Promise<void> {
    const { id } = data
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Failed to delete appointment: ${response.statusText}`)
    }
  }

  private async createCall(data: any): Promise<void> {
    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to create call: ${response.statusText}`)
    }
  }

  private async updateCall(data: any): Promise<void> {
    const { id, ...updateData } = data
    const response = await fetch(`/api/calls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      throw new Error(`Failed to update call: ${response.statusText}`)
    }
  }

  private removeAction(id: string): void {
    this.queue = this.queue.filter(action => action.id !== id)
    this.saveQueueToStorage()
    this.notifyListeners()
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      queueSize: this.queue.length,
      lastSync: this.getLastSyncTime(),
      pendingActions: this.queue.length,
      failedActions: this.queue.filter(a => a.retryCount > 0).length
    }
  }

  private getLastSyncTime(): number | null {
    const lastSync = localStorage.getItem('last-sync-time')
    return lastSync ? parseInt(lastSync) : null
  }

  private setLastSyncTime(): void {
    localStorage.setItem('last-sync-time', Date.now().toString())
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Clear the offline queue
   */
  clearQueue(): void {
    this.queue = []
    this.saveQueueToStorage()
    this.notifyListeners()
  }

  /**
   * Get queue contents (for debugging)
   */
  getQueue(): OfflineAction[] {
    return [...this.queue]
  }

  /**
   * Force sync (manual trigger)
   */
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processQueue()
      this.setLastSyncTime()
    }
  }
}

export const offlineQueue = OfflineQueueManager.getInstance()

// React hook for offline queue
export function useOfflineQueue() {
  const [status, setStatus] = useState<SyncStatus>(offlineQueue.getSyncStatus())

  React.useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(setStatus)
    return unsubscribe
  }, [])

  const addAction = React.useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    return offlineQueue.addAction(action)
  }, [])

  const forceSync = React.useCallback(() => {
    return offlineQueue.forceSync()
  }, [])

  const clearQueue = React.useCallback(() => {
    offlineQueue.clearQueue()
  }, [])

  return {
    status,
    addAction,
    forceSync,
    clearQueue,
    isOnline: status.isOnline,
    queueSize: status.queueSize,
    pendingActions: status.pendingActions,
    failedActions: status.failedActions
  }
}

// Helper functions for common operations
export const queueAppointment = (data: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
  return offlineQueue.addAction({
    type: 'CREATE_APPOINTMENT',
    data,
    maxRetries: 3,
    priority
  })
}

export const queueCall = (data: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
  return offlineQueue.addAction({
    type: 'CREATE_CALL',
    data,
    maxRetries: 3,
    priority
  })
}

export const queueAppointmentUpdate = (id: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
  return offlineQueue.addAction({
    type: 'UPDATE_APPOINTMENT',
    data: { id, ...data },
    maxRetries: 3,
    priority
  })
}

export const queueAppointmentDelete = (id: string, priority: 'high' | 'medium' | 'low' = 'high') => {
  return offlineQueue.addAction({
    type: 'DELETE_APPOINTMENT',
    data: { id },
    maxRetries: 5,
    priority
  })
}
