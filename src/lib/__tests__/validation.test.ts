// Simple validation functions for testing
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  return cleanPhone.length >= 10 && phoneRegex.test(cleanPhone)
}

function validateRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

describe('Essential Validation Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('(555) 123-4567')).toBe(true)
      expect(validatePhone('555-123-4567')).toBe(true)
      expect(validatePhone('5551234567')).toBe(true)
    })

    it('should reject invalid phone formats', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abc-def-ghij')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      expect(validateRequired('John Doe')).toBe(true)
      expect(validateRequired('Valid text')).toBe(true)
    })

    it('should reject empty or whitespace-only values', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired('   ')).toBe(false)
      expect(validateRequired(null)).toBe(false)
      expect(validateRequired(undefined)).toBe(false)
    })
  })
})