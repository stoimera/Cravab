// Input Validation and Sanitization
import { z } from 'zod'
import { createError } from './error-handler'

// Sanitize input function
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Limit length
  sanitized = sanitized.substring(0, 1000)
  
  return sanitized
}

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  date: z.string().datetime('Invalid date format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyString: z.string().min(1, 'Cannot be empty'),
}

// Sanitization functions
export const sanitizers = {
  sanitizeString: (input: string): string => {
    return input.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim()
  },
  
  sanitizePhone: (phone: string): string => {
    return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim()
  },
  
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim()
  },
  
  sanitizeName: (name: string): string => {
    return name.replace(/[^a-zA-Z\s\-'\.]/g, '').replace(/\s+/g, ' ').trim()
  }
}

// Validation middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError.validation('Validation failed', error.errors)
      }
      throw createError.validation('Invalid input format')
    }
  }
}

// Input sanitization middleware
export function sanitizeObject<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      switch (key) {
        case 'phone':
          sanitized[key] = sanitizers.sanitizePhone(value) as any
          break
        case 'email':
          sanitized[key] = sanitizers.sanitizeEmail(value) as any
          break
        case 'first_name':
        case 'last_name':
        case 'name':
          sanitized[key] = sanitizers.sanitizeName(value) as any
          break
        default:
          sanitized[key] = sanitizers.sanitizeString(value) as any
      }
    }
  }
  
  return sanitized
}