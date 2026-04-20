import { z } from 'zod'

// Tenant schemas
export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Tenant name is required'),
  created_at: z.string().datetime(),
})

export const createTenantSchema = tenantSchema.omit({
  id: true,
  created_at: true,
})

export const updateTenantSchema = createTenantSchema.partial()

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'worker']).default('worker'),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  permissions: z.any().default({}),
  is_active: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  last_login: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateUserSchema = createUserSchema.partial()

// Service schemas (comprehensive)
export const serviceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().nullable(),
  price: z.number().positive().nullable(),
  duration_minutes: z.number().positive(),
  category: z.string().nullable(),
  base_price: z.number().min(0).nullable().or(z.nan().transform(() => null)),
  hourly_rate: z.number().min(0).nullable().or(z.nan().transform(() => null)),
  minimum_charge: z.number().min(0).nullable().or(z.nan().transform(() => null)),
  estimated_duration_minutes: z.number().positive().nullable().or(z.nan().transform(() => null)),
  is_emergency_service: z.boolean(),
  requires_equipment: z.boolean(),
  equipment_list: z.array(z.string()).nullable(),
  required_permits: z.array(z.string()).nullable(),
  keywords: z.array(z.string().min(1, 'Keyword cannot be empty')).max(10, 'Maximum 10 keywords allowed'),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
})

export const createServiceSchema = serviceSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
})

export const updateServiceSchema = createServiceSchema.partial()

// Type exports
export type Service = z.infer<typeof serviceSchema>
export type CreateService = z.infer<typeof createServiceSchema>
export type UpdateService = z.infer<typeof updateServiceSchema>

// Client schemas
export const clientSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address').nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  country: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
  preferred_contact_method: z.enum(['phone', 'email', 'sms']).nullable(),
  preferred_appointment_time: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createClientSchema = clientSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})

export const updateClientSchema = createClientSchema.partial()

// Call schemas (Vapi-compatible)
export const callSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  vapi_call_id: z.string().nullable(),
  direction: z.enum(['inbound', 'outbound']),
  from_number: z.string().nullable(),
  to_number: z.string().nullable(),
  status: z.enum(['in_progress', 'started', 'ringing', 'completed', 'failed', 'busy', 'no_answer']),
  duration_seconds: z.number().int().min(0).nullable(),
  recording_url: z.string().nullable(),
  transcript: z.string().nullable(),
  ai_sentiment: z.string().nullable(),
  ai_intent: z.string().nullable(),
  ai_summary: z.string().nullable(),
  follow_up_required: z.boolean().nullable(),
  follow_up_notes: z.string().nullable(),
  priority: z.enum(['normal', 'high', 'emergency']).default('normal'),
  metadata: z.record(z.string(), z.any()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createCallSchema = callSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})

export const updateCallSchema = createCallSchema.partial()

// Appointment schemas
export const appointmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  client_id: z.string().uuid(),
  service_id: z.string().uuid().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  duration_minutes: z.number().int().min(0),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  priority: z.enum(['normal', 'high', 'emergency']).default('normal'),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  coordinates: z.any().nullable(),
  eta_minutes: z.number().int().min(0).nullable(),
  notes: z.string().nullable(),
  created_by: z.string().min(1, 'Created by is required'),
  created_at: z.string().datetime(),
})

export const createAppointmentSchema = appointmentSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
})

export const updateAppointmentSchema = createAppointmentSchema.partial()

// Vapi-specific schemas (provider keys and agents are now stored in tenants table)

export const notificationSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['info', 'warning', 'error', 'success', 'appointment', 'call', 'system']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  data: z.record(z.string(), z.any()).nullable(),
  is_read: z.boolean().default(false),
  created_at: z.string().datetime(),
})

export const createNotificationSchema = notificationSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
})

export const updateNotificationSchema = createNotificationSchema.partial()

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Company name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'worker']).default('admin'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Vapi webhook schema
export const vapiWebhookSchema = z.object({
  type: z.string(),
  call: z.object({
    id: z.string(),
    status: z.string(),
    direction: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
    duration: z.number().optional(),
    recordingUrl: z.string().optional(),
    transcript: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  timestamp: z.string().datetime()
})

// Type exports
export type Tenant = z.infer<typeof tenantSchema>
export type CreateTenant = z.infer<typeof createTenantSchema>
export type UpdateTenant = z.infer<typeof updateTenantSchema>

export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>

export type Client = z.infer<typeof clientSchema>
export type CreateClient = z.infer<typeof createClientSchema>
export type UpdateClient = z.infer<typeof updateClientSchema>

export type Call = z.infer<typeof callSchema>
export type CreateCall = z.infer<typeof createCallSchema>
export type UpdateCall = z.infer<typeof updateCallSchema>

export type Appointment = z.infer<typeof appointmentSchema>
export type CreateAppointment = z.infer<typeof createAppointmentSchema>
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>

// Provider key and agent types removed - now stored in tenants table

export type Notification = z.infer<typeof notificationSchema>
export type CreateNotification = z.infer<typeof createNotificationSchema>
export type UpdateNotification = z.infer<typeof updateNotificationSchema>

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type VapiWebhook = z.infer<typeof vapiWebhookSchema>
