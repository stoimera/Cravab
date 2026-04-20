'use client'

interface CacheConfig {
  name: string
  version: number
  stores: string[]
}

interface CachedData {
  data: any
  timestamp: number
  version: string
}

class OfflineCache {
  private db: IDBDatabase | null = null
  private config: CacheConfig
  private cacheVersion = '1.0.0'

  constructor(config: CacheConfig) {
    this.config = config
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores for each data type
        this.config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('tenant_id', 'tenant_id', { unique: false })
          }
        })
      }
    })
  }

  async set(storeName: string, data: any, tenantId?: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
        version: this.cacheVersion
      }

      const request = store.put({
        id: data.id || `${storeName}_${Date.now()}`,
        tenant_id: tenantId,
        ...cacheData
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get(storeName: string, id: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

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

  async getAll(storeName: string, tenantId?: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result || []
        
        if (tenantId) {
          results = results.filter(item => item.tenant_id === tenantId)
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp)
        
        resolve(results.map(item => item.data))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string, tenantId?: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      if (tenantId) {
        const index = store.index('tenant_id')
        const request = index.openCursor(IDBKeyRange.only(tenantId))
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      } else {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }
    })
  }

  async isStale(storeName: string, id: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(true)
        } else {
          const age = Date.now() - result.timestamp
          const versionMismatch = result.version !== this.cacheVersion
          resolve(age > maxAge || versionMismatch)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get cache version
  getCacheVersion(): string {
    return this.cacheVersion
  }

  // Update cache version (clears all caches)
  updateCacheVersion(newVersion: string = '1.0.0'): void {
    this.cacheVersion = newVersion
    // Clear all data when version changes
    this.clear('all')
  }
}

// Create cache instance
export const offlineCache = new OfflineCache({
  name: 'CRAVABOSCache',
  version: 1,
  stores: ['calls', 'clients', 'appointments', 'settings']
})

// Helper functions for common operations
export const cacheHelpers = {
  async cacheCalls(calls: any[], tenantId: string) {
    for (const call of calls) {
      await offlineCache.set('calls', call, tenantId)
    }
  },

  async cacheClients(clients: any[], tenantId: string) {
    for (const client of clients) {
      await offlineCache.set('clients', client, tenantId)
    }
  },

  async cacheAppointments(appointments: any[], tenantId: string) {
    for (const appointment of appointments) {
      await offlineCache.set('appointments', appointment, tenantId)
    }
  },

  async getCachedCalls(tenantId: string) {
    return await offlineCache.getAll('calls', tenantId)
  },

  async getCachedClients(tenantId: string) {
    return await offlineCache.getAll('clients', tenantId)
  },

  async getCachedAppointments(tenantId: string) {
    return await offlineCache.getAll('appointments', tenantId)
  },

  async clearTenantData(tenantId: string) {
    await Promise.all([
      offlineCache.clear('calls', tenantId),
      offlineCache.clear('clients', tenantId),
      offlineCache.clear('appointments', tenantId)
    ])
  }
}
