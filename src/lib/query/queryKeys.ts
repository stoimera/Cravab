/**
 * Query Keys Factory
 * Centralized query key management for consistent caching
 */

export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (tenantId: string, filters?: any) => [...queryKeys.clients.lists(), { tenantId, filters }] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (tenantId: string, clientId: string) => [...queryKeys.clients.details(), { tenantId, clientId }] as const,
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (tenantId: string, filters?: any) => [...queryKeys.appointments.lists(), { tenantId, filters }] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (tenantId: string, appointmentId: string) => [...queryKeys.appointments.details(), { tenantId, appointmentId }] as const,
    calendar: (tenantId: string, month: string) => [...queryKeys.appointments.all, 'calendar', { tenantId, month }] as const,
  },

  // Calls
  calls: {
    all: ['calls'] as const,
    lists: () => [...queryKeys.calls.all, 'list'] as const,
    list: (tenantId: string, filters?: any) => [...queryKeys.calls.lists(), { tenantId, filters }] as const,
    details: () => [...queryKeys.calls.all, 'detail'] as const,
    detail: (tenantId: string, callId: string) => [...queryKeys.calls.details(), { tenantId, callId }] as const,
    summary: (tenantId: string) => [...queryKeys.calls.all, 'summary', { tenantId }] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (tenantId: string, filters?: any) => [...queryKeys.users.lists(), { tenantId, filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (tenantId: string, userId: string) => [...queryKeys.users.details(), { tenantId, userId }] as const,
  },

  // Services
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (tenantId: string) => [...queryKeys.services.lists(), { tenantId }] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (tenantId: string, serviceId: string) => [...queryKeys.services.details(), { tenantId, serviceId }] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (tenantId: string, filters?: any) => [...queryKeys.documents.lists(), { tenantId, filters }] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    dashboard: (tenantId: string, period: string) => [...queryKeys.reports.all, 'dashboard', { tenantId, period }] as const,
    metrics: (tenantId: string, period: string) => [...queryKeys.reports.all, 'metrics', { tenantId, period }] as const,
  },

  // Company/Tenant
  company: {
    all: ['company'] as const,
    settings: (tenantId: string) => [...queryKeys.company.all, 'settings', { tenantId }] as const,
    users: (tenantId: string) => [...queryKeys.company.all, 'users', { tenantId }] as const,
    businessHours: (tenantId: string) => [...queryKeys.company.all, 'businessHours', { tenantId }] as const,
  },

  // VAPI
  vapi: {
    all: ['vapi'] as const,
    config: (tenantId: string) => [...queryKeys.vapi.all, 'config', { tenantId }] as const,
    webhooks: (tenantId: string) => [...queryKeys.vapi.all, 'webhooks', { tenantId }] as const,
  },
} as const

// Helper function to create tenant-scoped keys
export function createTenantKey(tenantId: string, baseKey: readonly string[]) {
  return [...baseKey, { tenantId }] as const
}

// Helper function to create filtered keys
export function createFilteredKey(baseKey: readonly string[], filters: Record<string, any>) {
  return [...baseKey, { filters }] as const
}
