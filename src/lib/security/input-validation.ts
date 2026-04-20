// Input Validation and Sanitization
// Protects against injection attacks and malicious input

import { z } from 'zod'

// Common validation schemas
export const validationSchemas = {
  // Email validation
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  
  // Phone validation (US format)
  phone: z.string()
    .regex(/^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, 'Invalid phone number format')
    .max(15, 'Phone number too long'),
  
  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters'),
  
  // Address validation
  address: z.string()
    .max(255, 'Address too long')
    .regex(/^[a-zA-Z0-9\s\-\.,#]+$/, 'Address contains invalid characters'),
  
  // City validation
  city: z.string()
    .max(100, 'City name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'City contains invalid characters'),
  
  // State validation
  state: z.string()
    .length(2, 'State must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Invalid state format'),
  
  // ZIP code validation
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  
  // URL validation
  url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
  
  // ID validation (UUID)
  id: z.string().uuid('Invalid ID format'),
  
  // Text content validation
  text: z.string()
    .max(10000, 'Text too long')
    .regex(/^[\w\s\-\.,!?@#$%^&*()+=<>:"'`~[\]{}|\\/;]+$/, 'Text contains invalid characters'),
  
  // HTML content validation (basic)
  html: z.string()
    .max(50000, 'Content too long')
    .refine((val) => {
      // Basic HTML tag validation - only allow safe tags
      const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      const tagRegex = /<(\w+)[^>]*>/g
      const tags = val.match(tagRegex)
      if (!tags) return true
      return tags.every(tag => {
        const tagName = tag.match(/<(\w+)/)?.[1]
        return tagName && allowedTags.includes(tagName.toLowerCase())
      })
    }, 'HTML contains invalid or unsafe tags')
}

// Input sanitization functions
export const sanitizers = {
  // Sanitize string input
  string: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break SQL
      .substring(0, 1000) // Limit length
  },
  
  // Sanitize email
  email: (input: string): string => {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '') // Only allow safe characters
      .substring(0, 255)
  },
  
  // Sanitize phone number
  phone: (input: string): string => {
    return input
      .replace(/[^\d+]/g, '') // Only keep digits and +
      .substring(0, 15)
  },
  
  // Sanitize name
  name: (input: string): string => {
    return input
      .trim()
      .replace(/[^a-zA-Z\s\-'\.]/g, '') // Only allow safe characters
      .substring(0, 100)
  },
  
  // Sanitize address
  address: (input: string): string => {
    return input
      .trim()
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .substring(0, 255)
  },
  
  // Sanitize HTML content
  html: (input: string): string => {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .substring(0, 50000)
  },
  
  // Sanitize SQL input (basic protection)
  sql: (input: string): string => {
    return input
      .replace(/[';-]/g, '') // Remove SQL injection characters
      .replace(/--/g, '') // Remove SQL comment markers
      .replace(/union/gi, '') // Remove UNION keywords
      .replace(/select/gi, '') // Remove SELECT keywords
      .replace(/insert/gi, '') // Remove INSERT keywords
      .replace(/update/gi, '') // Remove UPDATE keywords
      .replace(/delete/gi, '') // Remove DELETE keywords
      .replace(/drop/gi, '') // Remove DROP keywords
  }
}

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(input)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' }
    }
    return { success: false, error: 'Invalid input' }
  }
}

// Sanitize and validate input
export function sanitizeAndValidate<T>(schema: z.ZodSchema<T>, input: unknown, sanitizer?: (input: string) => string): { success: true; data: T } | { success: false; error: string } {
  try {
    let processedInput = input
    
    // Apply sanitizer if provided and input is string
    if (sanitizer && typeof input === 'string') {
      processedInput = sanitizer(input)
    }
    
    const result = schema.parse(processedInput)
    return { success: true, data: result }
    } catch (error) {
      if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' }
    }
    return { success: false, error: 'Invalid input' }
  }
}

// Rate limiting helper
export function isRateLimited(ip: string, action: string, limit: number = 10, windowMs: number = 60000): boolean {
  // Simple in-memory rate limiting (in production, use Redis)
  const key = `${ip}:${action}`
  const now = Date.now()
  
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map()
  }
  
  const store = global.rateLimitStore as Map<string, { count: number; resetTime: number }>
  const current = store.get(key)
  
  if (!current || now > current.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (current.count >= limit) {
    return true
  }
  
  current.count++
  return false
}

// Declare global rate limit store
declare global {
  var rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined
}

// Backwards compatibility export
export const inputValidator = {
  sanitizeString: sanitizers.string,
  validateWebhookPayload: (payload: any) => {
    // Basic webhook payload validation
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Invalid payload format' }
    }
    return { valid: true, data: payload }
  }
}