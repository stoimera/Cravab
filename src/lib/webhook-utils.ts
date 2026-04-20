import { z } from 'zod'
import { ApiResponse, functionSchemas, FunctionName } from '@/types/webhook'

// Standardized response helpers
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function createErrorResponse(error: string, details?: any): ApiResponse {
  return { success: false, error, details }
}

// Validation helper
export function validateParameters<T extends FunctionName>(
  functionName: T,
  parameters: any
): { success: true; data: any } | { success: false; error: string; details: any } {
  try {
    const schema = functionSchemas[functionName]
    const validatedData = schema.parse(parameters)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      
      return {
        success: false,
        error: 'Validation failed',
        details: {
          validationErrors: errorMessages,
          receivedParameters: parameters
        }
      }
    }
    
    return {
      success: false,
      error: 'Validation error',
      details: error instanceof Error ? error.message : 'Unknown validation error'
    }
  }
}

// Database insert helper with safeguards
export async function safeInsert<T>(
  query: any,
  data: any,
  selectFields: string = '*'
): Promise<{ success: true; data: T } | { success: false; error: string; details: any }> {
  try {
    const { data: result, error } = await query
      .insert(data)
      .select(selectFields)
      .limit(1)
      .single()

    if (error) {
      return {
        success: false,
        error: 'Database insert failed',
        details: error.message
      }
    }

    if (!result) {
      return {
        success: false,
        error: 'No data returned from insert',
        details: 'Insert operation completed but no data was returned'
      }
    }

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: 'Database operation failed',
      details: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Database update helper with safeguards
export async function safeUpdate<T>(
  query: any,
  data: any,
  selectFields: string = '*'
): Promise<{ success: true; data: T } | { success: false; error: string; details: any }> {
  try {
    const { data: result, error } = await query
      .update(data)
      .select(selectFields)
      .limit(1)
      .single()

    if (error) {
      return {
        success: false,
        error: 'Database update failed',
        details: error.message
      }
    }

    if (!result) {
      return {
        success: false,
        error: 'No data returned from update',
        details: 'Update operation completed but no data was returned'
      }
    }

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: 'Database operation failed',
      details: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Dynamic availability slot generation with standard hourly slots
export function generateAvailabilitySlots(
  startTime: { hours: number; minutes: number },
  endTime: { hours: number; minutes: number },
  serviceDurationMinutes: number = 60
): string[] {
  const slots: string[] = []
  const startMinutes = startTime.hours * 60 + startTime.minutes
  const endMinutes = endTime.hours * 60 + endTime.minutes
  
  // Generate standard hourly slots (every hour on the hour)
  for (let hour = startTime.hours; hour < endTime.hours; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`
    slots.push(timeStr)
  }
  
  // Also add half-hour slots for more flexibility
  for (let hour = startTime.hours; hour < endTime.hours; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:30`
    // Only add if it doesn't go past end time
    if (hour * 60 + 30 + serviceDurationMinutes <= endMinutes) {
      slots.push(timeStr)
    }
  }
  
  return slots.sort()
}

// Parse time string helper
export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }
  
  return { hours, minutes }
}

// Parse business hours - accepts both string format ("8:00 AM - 6:00 PM") and object format ({"open": "08:00", "close": "17:00", "closed": false})
export function parseBusinessHoursString(hoursStr: string | { open?: string; close?: string; closed?: boolean } | null): { open: { hours: number; minutes: number }; close: { hours: number; minutes: number } } | null {
  if (!hoursStr) return null
  
  // Handle object format: {"open": "08:00", "close": "17:00", "closed": false}
  if (typeof hoursStr === 'object' && !Array.isArray(hoursStr)) {
    if (hoursStr.closed || !hoursStr.open || !hoursStr.close) return null
    
    const parse24HourTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return { hours, minutes: minutes || 0 }
    }
    
    return {
      open: parse24HourTime(hoursStr.open),
      close: parse24HourTime(hoursStr.close)
    }
  }
  
  // Handle string format: "8:00 AM - 6:00 PM" or "Closed"
  if (typeof hoursStr !== 'string' || hoursStr === 'Closed') return null
  
  const match = hoursStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  
  const [, openHour, openMin, openAmPm, closeHour, closeMin, closeAmPm] = match
  
  const parseTime = (hour: string, min: string, ampm: string) => {
    let h = parseInt(hour, 10)
    const m = parseInt(min, 10)
    
    if (ampm.toUpperCase() === 'PM' && h !== 12) {
      h += 12
    } else if (ampm.toUpperCase() === 'AM' && h === 12) {
      h = 0
    }
    
    return { hours: h, minutes: m }
  }
  
  const open = parseTime(openHour, openMin, openAmPm)
  const close = parseTime(closeHour, closeMin, closeAmPm)
  
  return { open, close }
}

// Format time for display
export function formatTimeForDisplay(hours: number, minutes: number): string {
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const ampm = hours < 12 ? 'AM' : 'PM'
  const displayMinutes = minutes.toString().padStart(2, '0')
  
  return `${displayHour}:${displayMinutes} ${ampm}`
}
