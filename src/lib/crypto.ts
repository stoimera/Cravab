import crypto from 'crypto';
import { logger } from '@/lib/logger'

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 96 bits
const TAG_LENGTH = 16; // For GCM, this is 128 bits
const SALT_LENGTH = 64; // 512 bits

/**
 * Encrypt text using AES-256-GCM
 * @param masterKey - Base64 encoded master key (32 bytes)
 * @param plaintext - Text to encrypt
 * @returns Base64 encoded encrypted data with format: salt:iv:tag:encrypted
 */
export function encryptText(masterKeyBase64: string, plaintext: string): string {
  try {
    const key = Buffer.from(masterKeyBase64, 'base64');
    
    if (key.length !== 32) {
      throw new Error('Master key must be 32 bytes (256 bits)');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    
    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt:iv:tag:encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    return combined.toString('base64');
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt text');
  }
}

/**
 * Decrypt text using AES-256-GCM
 * @param masterKey - Base64 encoded master key (32 bytes)
 * @param ciphertextBase64 - Base64 encoded encrypted data
 * @returns Decrypted plaintext
 */
export function decryptText(masterKeyBase64: string, ciphertextBase64: string): string {
  try {
    const key = Buffer.from(masterKeyBase64, 'base64');
    
    if (key.length !== 32) {
      throw new Error('Master key must be 32 bytes (256 bits)');
    }

    // Decode the base64 data
    const combined = Buffer.from(ciphertextBase64, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from master key and salt using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt text');
  }
}

/**
 * Generate a random master key (32 bytes)
 * @returns Base64 encoded master key
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Verify that a master key is valid
 * @param masterKeyBase64 - Base64 encoded master key
 * @returns True if valid, false otherwise
 */
export function isValidMasterKey(masterKeyBase64: string): boolean {
  try {
    const key = Buffer.from(masterKeyBase64, 'base64');
    return key.length === 32;
  } catch {
    return false;
  }
}

/**
 * Test encryption/decryption with a sample text
 * @param masterKey - Base64 encoded master key
 * @returns True if test passes, false otherwise
 */
export function testEncryption(masterKeyBase64: string): boolean {
  try {
    const testText = 'This is a test message for encryption validation';
    const encrypted = encryptText(masterKeyBase64, testText);
    const decrypted = decryptText(masterKeyBase64, encrypted);
    return decrypted === testText;
  } catch {
    return false;
  }
}

/**
 * Hash a string using SHA-256 (for non-reversible operations)
 * @param text - Text to hash
 * @returns SHA-256 hash as hex string
 */
export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random token for webhook verification
 * @param length - Length of token in bytes (default: 32)
 * @returns Base64 encoded random token
 */
export function generateWebhookToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Verify webhook signature using HMAC-SHA256
 * @param payload - Raw payload string
 * @param signature - Signature from webhook header
 * @param secret - Webhook secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
