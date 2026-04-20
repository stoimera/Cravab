import { logger } from '@/lib/logger'
// =============================================
// SERVICE MAPPING FOR VAPI INTEGRATION
// =============================================
// DEPRECATED: These mappings are legacy and plumbing-specific.
// New tenants should use tenant-specific service keywords from the database.
// This is kept for backward compatibility with existing tenants.
// 
// For new implementations, use tenant services with keywords from the database
// instead of these hardcoded mappings.

export interface ServiceMapping {
  [key: string]: string
}

// Plumbing service mappings (DEPRECATED - use tenant-specific keywords instead)
export const PLUMBING_SERVICES: ServiceMapping = {
  // Faucet related
  'leaky-faucet': 'Plumbing Repair',
  'leaky faucet': 'Plumbing Repair',
  'faucet repair': 'Plumbing Repair',
  'faucet leak': 'Plumbing Repair',
  'kitchen faucet': 'Plumbing Repair',
  'bathroom faucet': 'Plumbing Repair',
  'dripping faucet': 'Plumbing Repair',
  'broken faucet': 'Plumbing Repair',
  
  // Pipe related
  'broken pipe': 'Plumbing Repair',
  'pipe repair': 'Plumbing Repair',
  'pipe leak': 'Plumbing Repair',
  'burst pipe': 'Plumbing Repair',
  'frozen pipe': 'Plumbing Repair',
  'pipe replacement': 'Plumbing Repair',
  
  // Drain related
  'drain cleaning': 'Plumbing Repair',
  'clogged drain': 'Plumbing Repair',
  'drain clog': 'Plumbing Repair',
  'slow drain': 'Plumbing Repair',
  'drain backup': 'Plumbing Repair',
  'drain repair': 'Plumbing Repair',
  
  // Toilet related
  'toilet repair': 'Plumbing Repair',
  'toilet leak': 'Plumbing Repair',
  'leaking toilet': 'Plumbing Repair',
  'toilet clog': 'Plumbing Repair',
  'toilet running': 'Plumbing Repair',
  'toilet not flushing': 'Plumbing Repair',
  'toilet replacement': 'Plumbing Repair',
  
  // Shower/Bathtub related
  'shower repair': 'Plumbing Repair',
  'shower leak': 'Plumbing Repair',
  'bathtub repair': 'Plumbing Repair',
  'bathtub leak': 'Plumbing Repair',
  'shower head': 'Plumbing Repair',
  'shower drain': 'Plumbing Repair',
  
  // Water related
  'water leak': 'Plumbing Repair',
  'water damage': 'Plumbing Repair',
  'water pressure': 'Plumbing Repair',
  'low water pressure': 'Plumbing Repair',
  'no water': 'Plumbing Repair',
  'water shut off': 'Plumbing Repair',
  
  // General plumbing
  'plumbing repair': 'Plumbing Repair',
  'plumbing service': 'Plumbing Repair',
  'plumbing issue': 'Plumbing Repair',
  'plumbing problem': 'Plumbing Repair',
  'plumbing maintenance': 'Plumbing Repair',
  'plumbing installation': 'Plumbing Repair',
  
  // Sink related
  'sink repair': 'Plumbing Repair',
  'sink leak': 'Plumbing Repair',
  'sink clog': 'Plumbing Repair',
  'kitchen sink': 'Plumbing Repair',
  'bathroom sink': 'Plumbing Repair',
  
  // Garbage disposal
  'garbage disposal': 'Plumbing Repair',
  'disposal repair': 'Plumbing Repair',
  'disposal not working': 'Plumbing Repair',
  'disposal jammed': 'Plumbing Repair'
}

// Heating service mappings
export const HEATING_SERVICES: ServiceMapping = {
  'heating repair': 'Heating Repair',
  'heating service': 'Heating Repair',
  'heating issue': 'Heating Repair',
  'heating problem': 'Heating Repair',
  'furnace repair': 'Heating Repair',
  'furnace not working': 'Heating Repair',
  'furnace maintenance': 'Heating Repair',
  'boiler repair': 'Heating Repair',
  'boiler not working': 'Heating Repair',
  'heat pump': 'Heating Repair',
  'heat pump repair': 'Heating Repair',
  'radiator': 'Heating Repair',
  'radiator repair': 'Heating Repair',
  'no heat': 'Heating Repair',
  'heating not working': 'Heating Repair',
  'heating system': 'Heating Repair'
}

// Emergency service mappings
export const EMERGENCY_SERVICES: ServiceMapping = {
  'emergency': 'Emergency Service',
  'emergency service': 'Emergency Service',
  'emergency repair': 'Emergency Service',
  'urgent': 'Emergency Service',
  'urgent repair': 'Emergency Service',
  'asap': 'Emergency Service',
  'immediately': 'Emergency Service',
  'right now': 'Emergency Service',
  'water emergency': 'Emergency Service',
  'flood': 'Emergency Service',
  'water damage emergency': 'Emergency Service',
  'burst pipe emergency': 'Emergency Service',
  'sewer backup': 'Emergency Service',
  'sewer emergency': 'Emergency Service'
}

// Combined service mapping
export const SERVICE_MAPPING: ServiceMapping = {
  ...PLUMBING_SERVICES,
  ...HEATING_SERVICES,
  ...EMERGENCY_SERVICES
}

/**
 * Function to map VAPI service name to database service name
 * @deprecated Use tenant-specific service matching from database instead
 * This function is kept for backward compatibility only
 */
export function mapVapiServiceToDbService(vapiServiceName: string): string {
  const normalizedName = vapiServiceName.toLowerCase().trim()
  const mapped = SERVICE_MAPPING[normalizedName]
  
  // Log warning when using deprecated mappings (only in dev)
  if (mapped && process.env.NODE_ENV === 'development') {
    logger.warn(`[DEPRECATED] Using hardcoded service mapping for "${vapiServiceName}". Consider using tenant-specific keywords from database.`)
  }
  
  return mapped || vapiServiceName
}

/**
 * Function to get service category
 * @deprecated Use tenant's service category from database instead
 * This function is kept for backward compatibility only
 */
export function getServiceCategory(serviceName: string): string {
  const normalizedName = serviceName.toLowerCase().trim()
  
  if (PLUMBING_SERVICES[normalizedName]) return 'plumbing'
  if (HEATING_SERVICES[normalizedName]) return 'heating'
  if (EMERGENCY_SERVICES[normalizedName]) return 'emergency'
  
  return 'general'
}

/**
 * Function to get all possible service names for a category
 * @deprecated Use tenant's services from database instead
 * This function is kept for backward compatibility only
 */
export function getServiceNamesForCategory(category: string): string[] {
  switch (category.toLowerCase()) {
    case 'plumbing':
      return Object.keys(PLUMBING_SERVICES)
    case 'heating':
      return Object.keys(HEATING_SERVICES)
    case 'emergency':
      return Object.keys(EMERGENCY_SERVICES)
    default:
      return Object.keys(SERVICE_MAPPING)
  }
}
