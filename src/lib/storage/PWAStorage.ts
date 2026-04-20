import { logger } from '@/lib/logger'
/**
 * PWA Storage Manager
 * Handles offline storage and synchronization for PWA functionality
 */

interface StorageItem<T> {
  data: T
  timestamp: number
  version: string
}

interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  retries: number
}

class PWAStorageManager {
  private dbName = 'CRAVABOS'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncQueue: SyncQueueItem[] = []
  private isOnline = false
  private cacheVersion = '1.0.0'
  private isInitialized = false

  constructor() {
    // Don't initialize immediately - wait for client-side
  }

  // Initialize only on client-side
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('PWAStorageManager can only be used in browser environment')
    }

    this.isOnline = navigator.onLine
    await this.initDB()
    this.setupOnlineOfflineHandlers()
    this.isInitialized = true
  }

  // Initialize IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('clients')) {
          const clientsStore = db.createObjectStore('clients', { keyPath: 'id' })
          clientsStore.createIndex('tenantId', 'tenant_id', { unique: false })
          clientsStore.createIndex('phone', 'phone', { unique: false })
        }

        if (!db.objectStoreNames.contains('appointments')) {
          const appointmentsStore = db.createObjectStore('appointments', { keyPath: 'id' })
          appointmentsStore.createIndex('tenantId', 'tenant_id', { unique: false })
          appointmentsStore.createIndex('clientId', 'client_id', { unique: false })
          appointmentsStore.createIndex('startsAt', 'starts_at', { unique: false })
        }

        if (!db.objectStoreNames.contains('calls')) {
          const callsStore = db.createObjectStore('calls', { keyPath: 'id' })
          callsStore.createIndex('tenantId', 'tenant_id', { unique: false })
          callsStore.createIndex('vapiCallId', 'vapi_call_id', { unique: false })
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }
      }
    })
  }

  // Setup online/offline handlers
  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Generic storage operations
  async setItem<T>(storeName: string, key: string, data: T): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const item: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.cacheVersion
      }

      const request = store.put({ key, ...item })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getItem<T>(storeName: string, key: string): Promise<T | null> {
    await this.ensureInitialized()
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removeItem(storeName: string, key: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Client operations
  async saveClient(tenantId: string, client: any): Promise<void> {
    const key = `${tenantId}_${client.id}`
    await this.setItem('clients', key, client)
  }

  async getClient(tenantId: string, clientId: string): Promise<any | null> {
    const key = `${tenantId}_${clientId}`
    return await this.getItem('clients', key)
  }

  async getAllClients(tenantId: string): Promise<any[]> {
    await this.ensureInitialized()
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clients'], 'readonly')
      const store = transaction.objectStore('clients')
      const index = store.index('tenantId')
      const request = index.getAll(tenantId)

      request.onsuccess = () => {
        const results = request.result.map(item => item.data)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Appointment operations
  async saveAppointment(tenantId: string, appointment: any): Promise<void> {
    const key = `${tenantId}_${appointment.id}`
    await this.setItem('appointments', key, appointment)
  }

  async getAppointment(tenantId: string, appointmentId: string): Promise<any | null> {
    const key = `${tenantId}_${appointmentId}`
    return await this.getItem('appointments', key)
  }

  async getAllAppointments(tenantId: string): Promise<any[]> {
    await this.ensureInitialized()
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['appointments'], 'readonly')
      const store = transaction.objectStore('appointments')
      const index = store.index('tenantId')
      const request = index.getAll(tenantId)

      request.onsuccess = () => {
        const results = request.result.map(item => item.data)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Call operations
  async saveCall(tenantId: string, call: any): Promise<void> {
    const key = `${tenantId}_${call.id}`
    await this.setItem('calls', key, call)
  }

  async getCall(tenantId: string, callId: string): Promise<any | null> {
    const key = `${tenantId}_${callId}`
    return await this.getItem('calls', key)
  }

  async getAllCalls(tenantId: string): Promise<any[]> {
    await this.ensureInitialized()
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calls'], 'readonly')
      const store = transaction.objectStore('calls')
      const index = store.index('tenantId')
      const request = index.getAll(tenantId)

      request.onsuccess = () => {
        const results = request.result.map(item => item.data)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    await this.ensureInitialized()
    const syncItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${item.table}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0
    }

    await this.setItem('syncQueue', syncItem.id, syncItem)
    this.syncQueue.push(syncItem)

    if (this.isOnline) {
      this.processSyncQueue()
    }
  }

  async processSyncQueue(): Promise<void> {
    await this.ensureInitialized()
    if (!this.isOnline || this.syncQueue.length === 0) return

    const items = [...this.syncQueue]
    this.syncQueue = []

    for (const item of items) {
      try {
        await this.syncItem(item)
        await this.removeItem('syncQueue', item.id)
      } catch (error) {
        logger.error('Sync failed for item:', item, error)
        
        // Retry logic
        if (item.retries < 3) {
          item.retries++
          await this.setItem('syncQueue', item.id, item)
          this.syncQueue.push(item)
        }
      }
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with your API endpoints
    const response = await fetch(`/api/${item.table}`, {
      method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`)
    }
  }

  // Cache operations
  async setCache<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl
    }
    await this.setItem('cache', key, cacheItem)
  }

  async getCache<T>(key: string): Promise<T | null> {
    const item = await this.getItem<{ data: T; timestamp: number; ttl: number; version: string }>('cache', key)
    
    if (!item) return null

    // Check if expired or version mismatch
    if (Date.now() - item.timestamp > item.ttl || item.version !== this.cacheVersion) {
      await this.removeItem('cache', key)
      return null
    }

    return item.data
  }

  // Clear all data for a tenant
  async clearTenantData(tenantId: string): Promise<void> {
    await this.ensureInitialized()
    const stores = ['clients', 'appointments', 'calls']
    
    for (const storeName of stores) {
      if (!this.db) continue

      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const index = store.index('tenantId')
      const request = index.getAll(tenantId)

      request.onsuccess = () => {
        const items = request.result
        items.forEach(item => store.delete(item.key))
      }
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<any> {
    await this.ensureInitialized()
    if (!this.db) return null

    const stats = {
      clients: 0,
      appointments: 0,
      calls: 0,
      syncQueue: 0,
      cache: 0
    }

    const stores = Object.keys(stats) as (keyof typeof stats)[]
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => {
        stats[storeName] = request.result
      }
    }

    return stats
  }

  // Get cache version
  getCacheVersion(): string {
    return this.cacheVersion
  }

  // Update cache version (clears all caches)
  updateCacheVersion(newVersion: string = '1.0.0'): void {
    this.cacheVersion = newVersion
    // Clear all tenant data when version changes
    this.clearTenantData('all')
  }
}

// Export singleton instance
export const pwaStorage = new PWAStorageManager()

// Export types
export type { StorageItem, SyncQueueItem }
