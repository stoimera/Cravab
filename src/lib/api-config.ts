// API Configuration for Cravab
// Centralized configuration for all API endpoints and settings

import { config } from './config'

export const API_CONFIG = {
  // Base configuration
  BASE_URL: config.app.url,
  TIMEOUT: config.api.timeout,
  RETRIES: config.api.retries,
  RETRY_DELAY: config.api.retryDelay,

  // Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      SESSION: '/api/auth/session',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
    },

    // Company
    COMPANY: {
      SETTINGS: '/api/company/settings',
      VAPI: '/api/vapi',
      RUNTIME: '/api/company/runtime',
      EMPLOYEES: '/api/company/employees',
      SETUP_ADMIN: '/api/company/setup-admin',
      SETUP_TEAM: '/api/company/setup-team',
      VERIFY_INVITATION: '/api/company/verify-invitation',
    },

    // Clients
    CLIENTS: {
      LIST: '/api/clients',
      CREATE: '/api/clients',
      GET: (id: string) => `/api/clients/${id}`,
      UPDATE: (id: string) => `/api/clients/${id}`,
      DELETE: (id: string) => `/api/clients/${id}`,
      EXPORT: '/api/clients/export',
    },

    // Calls
    CALLS: {
      LIST: '/api/calls',
      CREATE: '/api/calls/create',
      EXPORT: '/api/calls/export',
    },

    // Appointments
    APPOINTMENTS: {
      LIST: '/api/appointments',
      CREATE: '/api/appointments',
      GET: (id: string) => `/api/appointments/${id}`,
      UPDATE: (id: string) => `/api/appointments/${id}`,
      DELETE: (id: string) => `/api/appointments/${id}`,
    },

    // Services
    SERVICES: {
      LIST: '/api/services',
      CREATE: '/api/services',
      GET: (id: string) => `/api/services/${id}`,
      UPDATE: (id: string) => `/api/services/${id}`,
      DELETE: (id: string) => `/api/services/${id}`,
    },

    // Vapi AI
    VAPI: {
      CREATE_CALL: '/api/vapi/create-call',
      WEBHOOK: '/api/vapi/webhook',
      CREATE_ASSISTANT: '/api/vapi/create-assistant',
    },

    // External APIs
    EXTERNAL: {
      GOOGLE_MAPS_ETA: '/api/maps/eta',
      JARVIS_CHAT: '/api/jarvis/chat',
      NOTIFICATIONS: '/api/notifications',
      PAYMENTS: '/api/payments',
      WEBHOOKS: '/api/webhooks',
    },

    // System
    SYSTEM: {
      HEALTH: '/api/health',
      INTEGRATION_TEST: '/api/integration-test',
      ACCESS_REQUESTS: '/api/access-requests',
    },
  },

  // Headers
  HEADERS: {
    JSON: {
      'Content-Type': 'application/json',
    },
    FORM_DATA: {
      'Content-Type': 'multipart/form-data',
    },
  },

  // Status codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
  },

  // Error messages
  ERRORS: {
    NETWORK: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access denied.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION: 'Please check your input and try again.',
    UNKNOWN: 'An unexpected error occurred.',
  },
} as const

// Type definitions
export type ApiEndpoint = typeof API_CONFIG.ENDPOINTS
export type ApiStatus = typeof API_CONFIG.STATUS
export type ApiError = typeof API_CONFIG.ERRORS

// Helper functions
export const getEndpoint = (path: string, ...params: string[]): string => {
  return path.replace(/:(\w+)/g, (_, key) => {
    const param = params.shift()
    if (!param) {
      throw new Error(`Missing parameter for ${key} in path ${path}`)
    }
    return param
  })
}

export const isSuccessStatus = (status: number): boolean => {
  return status >= 200 && status < 300
}

export const isClientError = (status: number): boolean => {
  return status >= 400 && status < 500
}

export const isServerError = (status: number): boolean => {
  return status >= 500 && status < 600
}

export const getErrorMessage = (status: number, customMessage?: string): string => {
  if (customMessage) return customMessage

  switch (status) {
    case API_CONFIG.STATUS.UNAUTHORIZED:
      return API_CONFIG.ERRORS.UNAUTHORIZED
    case API_CONFIG.STATUS.FORBIDDEN:
      return API_CONFIG.ERRORS.FORBIDDEN
    case API_CONFIG.STATUS.NOT_FOUND:
      return API_CONFIG.ERRORS.NOT_FOUND
    case API_CONFIG.STATUS.TOO_MANY_REQUESTS:
      return API_CONFIG.ERRORS.NETWORK
    case API_CONFIG.STATUS.INTERNAL_SERVER_ERROR:
    case API_CONFIG.STATUS.BAD_GATEWAY:
    case API_CONFIG.STATUS.SERVICE_UNAVAILABLE:
      return API_CONFIG.ERRORS.SERVER_ERROR
    default:
      return API_CONFIG.ERRORS.UNKNOWN
  }
}
