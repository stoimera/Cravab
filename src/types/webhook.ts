import { z } from 'zod'

// Standardized API Response Types
export type ApiResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: any }

// Common validation schemas
export const phoneSchema = z.string()
  .min(7, 'Phone number must be at least 7 digits')
  .max(15, 'Phone number must be no more than 15 digits')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number contains invalid characters')

export const emailSchema = z.string()
  .email('Invalid email format')
  .optional()

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/, 'Invalid date format - must be ISO 8601 or YYYY-MM-DD')

export const timeSchema = z.string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')

export const uuidSchema = z.string().min(1, 'ID is required')

// Function-specific schemas
export const getServicesSchema = z.object({
  tenant_id: uuidSchema
})

export const getAvailabilitySchema = z.object({
  tenant_id: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  days: z.number().min(1).max(30).optional().default(7)
})

export const getBusinessHoursSchema = z.object({
  tenant_id: uuidSchema
})

export const createClientSchema = z.object({
  tenant_id: uuidSchema,
  name: z.string().min(1, 'Name is required').max(100).optional(),
  first_name: z.string().min(1, 'First name is required').max(50).optional(),
  last_name: z.string().min(1, 'Last name is required').max(50).optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(10).optional()
}).refine(data => data.name || (data.first_name && data.last_name), {
  message: 'Either name or both first_name and last_name are required'
})

export const lookupClientSchema = z.object({
  tenant_id: uuidSchema,
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  name: z.string().min(1).optional(),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional()
}).refine(data => data.phone || data.email || data.name || (data.first_name && data.last_name), {
  message: 'At least one of phone, email, or name is required'
})

export const getClientDetailsSchema = z.object({
  tenant_id: uuidSchema,
  client_id: uuidSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional()
}).refine(data => data.client_id || data.phone || data.email, {
  message: 'At least one of client_id, phone, or email is required'
})

export const getPricingSchema = z.object({
  tenant_id: uuidSchema,
  service_id: uuidSchema
})

export const checkServiceAreaSchema = z.object({
  tenant_id: uuidSchema,
  address: z.string().min(1, 'Address is required').max(200).optional(),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional()
}).refine(data => data.address || data.zip_code, {
  message: 'Either address or zip_code is required'
})

export const createQuoteSchema = z.object({
  tenant_id: uuidSchema,
  client_id: uuidSchema,
  service_id: uuidSchema,
  description: z.string().max(500).optional(),
  materials_cost: z.number().min(0).optional().default(0),
  labor_rate: z.number().min(0).optional().default(75),
  estimated_hours: z.number().min(0.5).max(24).optional().default(1)
})

export const endCallSchema = z.object({
  // endCall has no required parameters - it's just an acknowledgment
})

export const bookAppointmentSchema = z.object({
  tenant_id: uuidSchema,
  // Support both VAPI format and expected format
  client_id: uuidSchema.optional(),
  client_name: z.string().min(1, 'Client name is required').max(100).optional(),
  first_name: z.string().min(1, 'First name is required').max(50).optional(),
  last_name: z.string().min(1, 'Last name is required').max(50).optional(),
  client_phone: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  client_email: emailSchema.optional(),
  email: emailSchema.optional(),
  client_address: z.string().min(1, 'Client address is required').max(200).optional(),
  address: z.string().min(1, 'Client address is required').max(200).optional(),
  starts_at: dateSchema.optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  service_id: z.string().min(1, 'Service ID is required').optional(),
  service_type: z.string().min(1, 'Service type is required').optional(),
  notes: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  duration_minutes: z.number().min(15).max(480).optional().default(60)
}).refine(data => data.client_name || (data.first_name && data.last_name) || data.client_id, {
  message: 'Either client_name, both first_name and last_name, or client_id is required'
}).refine(data => data.client_phone || data.phone || data.client_id, {
  message: 'Phone number or client_id is required'
}).refine(data => data.starts_at || (data.date && data.time), {
  message: 'Either starts_at or both date and time are required'
})
// Service is optional - appointments can be created without specific service

export const updateAppointmentSchema = z.object({
  tenant_id: uuidSchema,
  appointment_id: uuidSchema,
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(500).optional(),
  scheduled_date: dateSchema.optional(),
  scheduled_time: timeSchema.optional()
})

export const cancelAppointmentSchema = z.object({
  tenant_id: uuidSchema,
  appointment_id: uuidSchema,
  reason: z.string().max(200).optional()
})

export const rescheduleAppointmentSchema = z.object({
  tenant_id: uuidSchema,
  appointment_id: uuidSchema,
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  new_time: timeSchema,
  reason: z.string().max(200).optional()
})

export const findServiceForClientSchema = z.object({
  client_request: z.string().min(1, 'Client request is required').max(500, 'Client request too long'),
  tenant_id: uuidSchema
})

export const getCurrentDateSchema = z.object({
  tenant_id: uuidSchema
})

export const getPricingInfoSchema = z.object({
  tenant_id: uuidSchema,
  client_request: z.string().min(1, 'Client request is required').max(500, 'Client request too long')
})

// Schema mapping for function validation
export const functionSchemas = {
  getServices: getServicesSchema,
  getAvailability: getAvailabilitySchema,
  getBusinessHours: getBusinessHoursSchema,
  createClient: createClientSchema,
  lookupClient: lookupClientSchema,
  getClientDetails: getClientDetailsSchema,
  getPricing: getPricingSchema,
  checkServiceArea: checkServiceAreaSchema,
  createQuote: createQuoteSchema,
  bookAppointment: bookAppointmentSchema,
  updateAppointment: updateAppointmentSchema,
  cancelAppointment: cancelAppointmentSchema,
  rescheduleAppointment: rescheduleAppointmentSchema,
  endCall: endCallSchema,
  findServiceForClient: findServiceForClientSchema,
  getCurrentDate: getCurrentDateSchema,
  getPricingInfo: getPricingInfoSchema
} as const

export type FunctionName = keyof typeof functionSchemas
