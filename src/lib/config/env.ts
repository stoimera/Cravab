// Environment Configuration with Validation
// Centralized configuration management with runtime validation

import { z } from 'zod'

// Environment schema validation
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Encryption
  MASTER_ENCRYPTION_KEY: z.string().min(32, 'Master encryption key must be at least 32 characters'),
  
  // Google Maps (Optional)
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Email Configuration (Optional)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email('Invalid email from address').optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  
  // Compliance
  GDPR_ENABLED: z.string().transform(val => val === 'true').default('false'),
  CCPA_ENABLED: z.string().transform(val => val === 'true').default('false'),
  
  // VAPI Configuration (Optional - can be configured per tenant)
  VAPI_API_KEY: z.string().optional(),
  VAPI_ASSISTANT_ID: z.string().optional(),
  VAPI_WEBHOOK_SECRET: z.string().optional(),
  
  // Twilio Configuration (Optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Database (Optional - for direct connection)
  DATABASE_URL: z.string().optional(),
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`)
    }
    throw error
  }
}

// Get validated environment variables
export const env = validateEnv()

// Environment-specific configuration
export const config = {
  // App settings
  app: {
    url: env.NEXT_PUBLIC_APP_URL || (env.NODE_ENV === 'production' ? 'https://CRAVAB.com' : 'http://localhost:3000'),
    environment: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  
  // Database settings
  database: {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    directUrl: env.DATABASE_URL,
  },
  
  // Security settings
  security: {
    masterEncryptionKey: env.MASTER_ENCRYPTION_KEY,
    gdprEnabled: env.GDPR_ENABLED,
    ccpaEnabled: env.CCPA_ENABLED,
  },
  
  // External services
  services: {
    googleMaps: {
      apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      enabled: !!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    email: {
      resendApiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      fromName: env.EMAIL_FROM_NAME,
      enabled: !!env.RESEND_API_KEY,
    },
    vapi: {
      apiKey: env.VAPI_API_KEY,
      assistantId: env.VAPI_ASSISTANT_ID,
      webhookSecret: env.VAPI_WEBHOOK_SECRET,
      enabled: !!(env.VAPI_API_KEY && env.VAPI_ASSISTANT_ID),
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
      enabled: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
    },
  },
  
  // API settings
  api: {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },
} as const

// Type exports
export type Config = typeof config
export type Env = typeof env

// Validation helpers
export const validateRequiredEnv = (requiredVars: (keyof Env)[]) => {
  const missing = requiredVars.filter(key => !env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Environment check function
export const checkEnvironment = () => {
  const issues: string[] = []
  
  // Check required services
  if (!config.services.googleMaps.enabled) {
    issues.push('Google Maps API key not configured - location features will be disabled')
  }
  
  if (!config.services.email.enabled) {
    issues.push('Email service not configured - email features will be disabled')
  }
  
  if (!config.services.vapi.enabled) {
    issues.push('VAPI service not configured - AI call features will be disabled')
  }
  
  if (!config.services.twilio.enabled) {
    issues.push('Twilio service not configured - phone features will be disabled')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings: issues.filter(issue => !issue.includes('will be disabled')),
    info: issues.filter(issue => issue.includes('will be disabled')),
  }
}

// Export default config
export default config
