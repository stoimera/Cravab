import { logger } from '@/lib/logger'
/**
 * Middleware for automatic field-level encryption/decryption
 * Intercepts database operations to encrypt PII fields
 */

import { NextRequest } from 'next/server'
import { fieldEncryptionService } from './field-encryption'

export interface EncryptionConfig {
  enabled: boolean
  tables: string[]
  fields: string[]
}

const DEFAULT_CONFIG: EncryptionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  tables: ['users', 'clients', 'appointments', 'calls'],
  fields: ['email', 'phone', 'full_name', 'name', 'address', 'client_name', 'client_email', 'client_phone', 'client_address']
}

export class EncryptionMiddleware {
  private config: EncryptionConfig

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Encrypt request data before processing
   */
  encryptRequestData(data: any, tableName: string): any {
    if (!this.config.enabled || !this.config.tables.includes(tableName)) {
      return data
    }

    try {
      switch (tableName) {
        case 'users':
          return fieldEncryptionService.encryptUserData(data)
        case 'clients':
          return fieldEncryptionService.encryptClientData(data)
        case 'appointments':
          return fieldEncryptionService.encryptAppointmentData(data)
        case 'calls':
          return fieldEncryptionService.encryptCallData(data)
        default:
          return data
      }
    } catch (error) {
      logger.error(`Failed to encrypt data for table ${tableName}:`, error)
      return data
    }
  }

  /**
   * Decrypt response data after processing
   */
  decryptResponseData(data: any, tableName: string): any {
    if (!this.config.enabled || !this.config.tables.includes(tableName)) {
      return data
    }

    try {
      if (Array.isArray(data)) {
        return data.map(item => this.decryptSingleRecord(item, tableName))
      } else if (data && typeof data === 'object') {
        return this.decryptSingleRecord(data, tableName)
      }
      return data
    } catch (error) {
      logger.error(`Failed to decrypt data for table ${tableName}:`, error)
      return data
    }
  }

  private decryptSingleRecord(record: any, tableName: string): any {
    if (!record || typeof record !== 'object') return record

    switch (tableName) {
      case 'users':
        return fieldEncryptionService.decryptUserData(record)
      case 'clients':
        return fieldEncryptionService.decryptClientData(record)
      case 'appointments':
        return fieldEncryptionService.decryptAppointmentData(record)
      case 'calls':
        return fieldEncryptionService.decryptCallData(record)
      default:
        return record
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  withEncryption(handler: (request: NextRequest, context: any) => Promise<Response>) {
    return async (request: NextRequest, context: any) => {
      try {
        // Get table name from context or URL
        const tableName = this.extractTableName(request.url)
        
        // Intercept request body for encryption
        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
          const body = await request.json()
          const encryptedBody = this.encryptRequestData(body, tableName)
          
          // Create new request with encrypted data
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(encryptedBody)
          })
          
          const response = await handler(newRequest as any, context)
          
          // Decrypt response if needed
          if (response && response.body) {
            const responseData = await response.json()
            const decryptedData = this.decryptResponseData(responseData, tableName)
            
            return new Response(JSON.stringify(decryptedData), {
              status: response.status,
              headers: response.headers
            })
          }
          
          return response
        }
        
        // For GET requests, just decrypt the response
        const response = await handler(request, context)
        
        if (response && response.body) {
          const responseData = await response.json()
          const decryptedData = this.decryptResponseData(responseData, tableName)
          
          return new Response(JSON.stringify(decryptedData), {
            status: response.status,
            headers: response.headers
          })
        }
        
        return response
        
      } catch (error) {
        logger.error('Encryption middleware error:', error)
        return handler(request, context)
      }
    }
  }

  private extractTableName(url: string): string {
    const urlParts = url.split('/')
    const apiIndex = urlParts.indexOf('api')
    
    if (apiIndex !== -1 && urlParts[apiIndex + 1]) {
      return urlParts[apiIndex + 1]
    }
    
    return 'unknown'
  }
}

// Create singleton instance
export const encryptionMiddleware = new EncryptionMiddleware()

// Helper function for API routes
export function withFieldEncryption(handler: (request: NextRequest, context: any) => Promise<Response>) {
  return encryptionMiddleware.withEncryption(handler)
}

// Utility functions for manual encryption/decryption
export const encryptForTable = (data: any, tableName: string) => 
  encryptionMiddleware.encryptRequestData(data, tableName)

export const decryptFromTable = (data: any, tableName: string) => 
  encryptionMiddleware.decryptResponseData(data, tableName)
