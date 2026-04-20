/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for secure encryption/decryption
 */

import crypto from 'crypto'
import type { BinaryLike } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function asBinaryLike(buf: Buffer): BinaryLike {
  return buf as unknown as BinaryLike
}

function u8(buf: Buffer): Uint8Array {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

export class EncryptionService {
  private static instance: EncryptionService
  private key: Buffer

  private constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    
    // Ensure key is exactly 32 bytes
    this.key = crypto.scryptSync(encryptionKey, 'salt', KEY_LENGTH)
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipher(ALGORITHM, asBinaryLike(this.key))
      cipher.setAAD(u8(Buffer.from('CRAVAB-os', 'utf8')))
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()
      
      // Combine IV + tag + encrypted data
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
    } catch (error) {
      // Encryption error
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const tag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]

      const decipher = crypto.createDecipher(ALGORITHM, asBinaryLike(this.key))
      decipher.setAAD(u8(Buffer.from('CRAVAB-os', 'utf8')))
      decipher.setAuthTag(u8(tag))

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      // Decryption error
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex')
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
}

export const encryptionService = EncryptionService.getInstance()
