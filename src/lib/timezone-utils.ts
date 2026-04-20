import { createClient } from '@/lib/supabase/client'

// Timezone utility functions for proper time display

export interface TenantTimezone {
  timezone: string
  tenantId: string
}

// Cache for tenant timezones to avoid repeated database calls
const timezoneCache = new Map<string, string>()

/**
 * Get tenant timezone from database or cache
 */
export async function getTenantTimezone(tenantId: string): Promise<string> {
  // Check cache first
  if (timezoneCache.has(tenantId)) {
    return timezoneCache.get(tenantId)!
  }

  try {
    const supabase = createClient()
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('timezone')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) {
      // Could not fetch tenant timezone, defaulting to America/Chicago
      return 'America/Chicago'
    }

    const timezone = (tenant as any).timezone || 'America/Chicago'
    
    // Cache the result
    timezoneCache.set(tenantId, timezone)
    
    return timezone
  } catch (error) {
    // Error fetching tenant timezone
    return 'America/Chicago'
  }
}

/**
 * Convert UTC datetime string to tenant timezone (for backward compatibility)
 * NOTE: This function is now deprecated since we store times in tenant timezone
 */
export function convertUTCToTenantTimezone(
  utcDateTime: string, 
  tenantTimezone: string
): Date {
  // Create a date object from the UTC string
  const utcDate = new Date(utcDateTime)
  
  // Use Intl.DateTimeFormat to get the correct time in tenant timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tenantTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(utcDate)
  const year = parts.find(p => p.type === 'year')?.value || '2025'
  const month = parts.find(p => p.type === 'month')?.value || '01'
  const day = parts.find(p => p.type === 'day')?.value || '01'
  const hour = parts.find(p => p.type === 'hour')?.value || '00'
  const minute = parts.find(p => p.type === 'minute')?.value || '00'
  const second = parts.find(p => p.type === 'second')?.value || '00'
  
  // Create a new date with the tenant timezone values
  const tenantDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
  
  return tenantDate
}

/**
 * Handle datetime that's already in tenant timezone (new approach)
 * Since we now store times in tenant timezone, we just need to parse them correctly
 */
export function handleTenantTimezoneDateTime(
  tenantDateTime: string, 
  tenantTimezone: string
): Date {
  // The datetime is already in tenant timezone, so we can use it directly
  const tenantDate = new Date(tenantDateTime)
  
  // Validate that the date is valid
  if (isNaN(tenantDate.getTime())) {
    // Invalid date string
    return new Date() // Return current date as fallback
  }
  
  return tenantDate
}

/**
 * Format time for display in tenant timezone
 * NOTE: Now handles times that are already stored in tenant timezone
 */
export function formatTimeForTenant(
  tenantDateTime: string, 
  tenantTimezone: string,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
): string {
  // The datetime is already in tenant timezone, so we can format it directly
  const tenantDate = new Date(tenantDateTime)
  
  // Validate that the date is valid
  if (isNaN(tenantDate.getTime())) {
    // Invalid date string
    return '12:00 AM'
  }
  
  // Format time directly since it's already in tenant timezone
  return tenantDate.toLocaleTimeString('en-US', options)
}

/**
 * Format date for display in tenant timezone
 */
export function formatDateForTenant(
  utcDateTime: string, 
  tenantTimezone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  const tenantDate = convertUTCToTenantTimezone(utcDateTime, tenantTimezone)
  
  return tenantDate.toLocaleDateString('en-US', {
    ...options,
    timeZone: tenantTimezone
  })
}

/**
 * Get time portion (HH:MM) in tenant timezone
 * NOTE: Now handles times that are already stored in tenant timezone
 */
export function getTimeInTenantTimezone(
  tenantDateTime: string, 
  tenantTimezone: string
): string {
  // The datetime is already in tenant timezone, so we can extract time directly
  const tenantDate = new Date(tenantDateTime)
  
  // Validate that the date is valid
  if (isNaN(tenantDate.getTime())) {
    // Invalid date string
    return '00:00'
  }
  
  // Format time in HH:MM format
  const hour = tenantDate.getHours().toString().padStart(2, '0')
  const minute = tenantDate.getMinutes().toString().padStart(2, '0')
  
  return `${hour}:${minute}`
}

/**
 * Get time portion (HH:MM AM/PM) in tenant timezone
 */
export function getTimeInTenantTimezone12Hour(
  utcDateTime: string, 
  tenantTimezone: string
): string {
  return formatTimeForTenant(utcDateTime, tenantTimezone, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get date portion (YYYY-MM-DD) in tenant timezone
 * NOTE: Now handles times that are already stored in tenant timezone
 */
export function getDateInTenantTimezone(
  tenantDateTime: string, 
  tenantTimezone: string
): string {
  // The datetime is already in tenant timezone, so we can extract date directly
  const tenantDate = new Date(tenantDateTime)
  
  // Validate that the date is valid
  if (isNaN(tenantDate.getTime())) {
    // Invalid date string
    return new Date().toISOString().split('T')[0]
  }
  
  // Format date in YYYY-MM-DD format
  const year = tenantDate.getFullYear()
  const month = (tenantDate.getMonth() + 1).toString().padStart(2, '0')
  const day = tenantDate.getDate().toString().padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Check if a UTC datetime is today in tenant timezone
 */
export function isTodayInTenantTimezone(
  utcDateTime: string, 
  tenantTimezone: string
): boolean {
  const tenantDate = convertUTCToTenantTimezone(utcDateTime, tenantTimezone)
  const today = new Date()
  const todayInTenantTz = new Date(today.toLocaleString('en-US', { 
    timeZone: tenantTimezone 
  }))
  
  return tenantDate.toDateString() === todayInTenantTz.toDateString()
}

/**
 * Check if a UTC datetime is tomorrow in tenant timezone
 */
export function isTomorrowInTenantTimezone(
  utcDateTime: string, 
  tenantTimezone: string
): boolean {
  const tenantDate = convertUTCToTenantTimezone(utcDateTime, tenantTimezone)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowInTenantTz = new Date(tomorrow.toLocaleString('en-US', { 
    timeZone: tenantTimezone 
  }))
  
  return tenantDate.toDateString() === tomorrowInTenantTz.toDateString()
}

/**
 * Get a human-readable relative time (Today, Tomorrow, or formatted date)
 */
export function getRelativeTimeInTenantTimezone(
  utcDateTime: string, 
  tenantTimezone: string
): string {
  if (isTodayInTenantTimezone(utcDateTime, tenantTimezone)) {
    return 'Today'
  }
  
  if (isTomorrowInTenantTimezone(utcDateTime, tenantTimezone)) {
    return 'Tomorrow'
  }
  
  return formatDateForTenant(utcDateTime, tenantTimezone, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Clear timezone cache (useful for testing or when tenant timezone changes)
 */
export function clearTimezoneCache(tenantId?: string): void {
  if (tenantId) {
    timezoneCache.delete(tenantId)
  } else {
    timezoneCache.clear()
  }
}
