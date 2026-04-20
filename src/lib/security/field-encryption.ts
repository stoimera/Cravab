/**
 * Field-level encryption for PII data
 * Encrypts sensitive fields before database storage
 */

import { encryptionService } from './encryption'

export interface EncryptedField {
  encrypted: string
  iv: string
  tag: string
}

export interface PIIFields {
  email?: string
  phone?: string
  full_name?: string
  address?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
}

export class FieldEncryptionService {
  private static instance: FieldEncryptionService
  private encryptionService = encryptionService

  private constructor() {}

  static getInstance(): FieldEncryptionService {
    if (!FieldEncryptionService.instance) {
      FieldEncryptionService.instance = new FieldEncryptionService()
    }
    return FieldEncryptionService.instance
  }

  /**
   * Encrypt PII fields for database storage
   */
  encryptPIIFields(data: PIIFields): Record<string, string> {
    const encrypted: Record<string, string> = {}

    // Fields that should be encrypted
    const fieldsToEncrypt: (keyof PIIFields)[] = [
      'email',
      'phone', 
      'full_name',
      'address',
      'client_name',
      'client_email',
      'client_phone',
      'client_address'
    ]

    for (const field of fieldsToEncrypt) {
      const value = data[field]
      if (value && value.trim() !== '') {
        try {
          encrypted[field] = this.encryptionService.encrypt(value)
        } catch (error) {
          // Failed to encrypt field
          // Store as-is if encryption fails (fallback)
          encrypted[field] = value
        }
      }
    }

    return encrypted
  }

  /**
   * Decrypt PII fields from database
   */
  decryptPIIFields(data: Record<string, any>): PIIFields {
    const decrypted: PIIFields = {}

    // Fields that should be decrypted
    const fieldsToDecrypt: (keyof PIIFields)[] = [
      'email',
      'phone',
      'full_name', 
      'address',
      'client_name',
      'client_email',
      'client_phone',
      'client_address'
    ]

    for (const field of fieldsToDecrypt) {
      const value = data[field]
      if (value && typeof value === 'string') {
        try {
          // Check if it's encrypted (contains colons from our format)
          if (value.includes(':')) {
            decrypted[field] = this.encryptionService.decrypt(value)
          } else {
            // Not encrypted, return as-is
            decrypted[field] = value
          }
        } catch (error) {
          // Failed to decrypt field
          // Return as-is if decryption fails
          decrypted[field] = value
        }
      }
    }

    return decrypted
  }

  /**
   * Encrypt a single field
   */
  encryptField(value: string): string {
    if (!value || value.trim() === '') return value
    
    try {
      return this.encryptionService.encrypt(value)
    } catch (error) {
      // Failed to encrypt field
      return value
    }
  }

  /**
   * Decrypt a single field
   */
  decryptField(value: string): string {
    if (!value || typeof value !== 'string') return value
    
    try {
      // Check if it's encrypted (contains colons from our format)
      if (value.includes(':')) {
        return this.encryptionService.decrypt(value)
      } else {
        // Not encrypted, return as-is
        return value
      }
    } catch (error) {
      // Failed to decrypt field
      return value
    }
  }

  /**
   * Check if a field is encrypted
   */
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.includes(':') && value.split(':').length === 3
  }

  /**
   * Encrypt user data before database insert/update
   */
  encryptUserData(userData: any): any {
    const encrypted = this.encryptPIIFields({
      email: userData.email,
      phone: userData.phone,
      full_name: userData.full_name,
      address: userData.address
    })

    return {
      ...userData,
      ...encrypted
    }
  }

  /**
   * Decrypt user data after database fetch
   */
  decryptUserData(userData: any): any {
    const decrypted = this.decryptPIIFields(userData)
    
    return {
      ...userData,
      ...decrypted
    }
  }

  /**
   * Encrypt client data before database insert/update
   */
  encryptClientData(clientData: any): any {
    const encrypted = this.encryptPIIFields({
      client_name: clientData.name || clientData.client_name,
      client_email: clientData.email || clientData.client_email,
      client_phone: clientData.phone || clientData.client_phone,
      client_address: clientData.address || clientData.client_address
    })

    return {
      ...clientData,
      ...encrypted
    }
  }

  /**
   * Decrypt client data after database fetch
   */
  decryptClientData(clientData: any): any {
    const decrypted = this.decryptPIIFields(clientData)
    
    return {
      ...clientData,
      name: decrypted.client_name || clientData.name,
      email: decrypted.client_email || clientData.email,
      phone: decrypted.client_phone || clientData.phone,
      address: decrypted.client_address || clientData.address,
      ...decrypted
    }
  }

  /**
   * Encrypt appointment data before database insert/update
   */
  encryptAppointmentData(appointmentData: any): any {
    const encrypted = this.encryptPIIFields({
      client_name: appointmentData.client_name,
      client_email: appointmentData.client_email,
      client_phone: appointmentData.client_phone,
      client_address: appointmentData.client_address
    })

    return {
      ...appointmentData,
      ...encrypted
    }
  }

  /**
   * Decrypt appointment data after database fetch
   */
  decryptAppointmentData(appointmentData: any): any {
    const decrypted = this.decryptPIIFields(appointmentData)
    
    return {
      ...appointmentData,
      ...decrypted
    }
  }

  /**
   * Encrypt call data before database insert/update
   */
  encryptCallData(callData: any): any {
    const encrypted = this.encryptPIIFields({
      client_name: callData.client_name,
      client_email: callData.client_email,
      client_phone: callData.client_phone,
      client_address: callData.client_address
    })

    return {
      ...callData,
      ...encrypted
    }
  }

  /**
   * Decrypt call data after database fetch
   */
  decryptCallData(callData: any): any {
    const decrypted = this.decryptPIIFields(callData)
    
    return {
      ...callData,
      ...decrypted
    }
  }
}

export const fieldEncryptionService = FieldEncryptionService.getInstance()

// Helper functions for common use cases
export const encryptPII = (data: PIIFields) => fieldEncryptionService.encryptPIIFields(data)
export const decryptPII = (data: Record<string, any>) => fieldEncryptionService.decryptPIIFields(data)
export const encryptField = (value: string) => fieldEncryptionService.encryptField(value)
export const decryptField = (value: string) => fieldEncryptionService.decryptField(value)
export const isEncrypted = (value: string) => fieldEncryptionService.isEncrypted(value)
