// Business Hours Utilities for Vapi AI Integration
// Helps AI agent suggest appointments within working hours

import { DatabaseService } from './database'

export interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

export interface AvailableTimeSlot {
  date: string
  time: string
  dayOfWeek: string
  isAvailable: boolean
  reason?: string
}

export class BusinessHoursUtils {
  // Get available time slots for a specific date range
  static async getAvailableSlots(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    durationMinutes: number = 60
  ): Promise<AvailableTimeSlot[]> {
    // For now, use default business hours since we simplified the schema
    const businessHours = {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
    
    const slots: AvailableTimeSlot[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long' 
      }).toLowerCase()
      
      const dayHours = (businessHours as any)[dayOfWeek]
      
      if (dayHours && !dayHours.closed) {
        const daySlots = this.generateTimeSlotsForDay(
          currentDate,
          dayHours,
          durationMinutes
        )
        slots.push(...daySlots)
      } else {
        slots.push({
          date: currentDate.toISOString().split('T')[0],
          time: '00:00',
          dayOfWeek,
          isAvailable: false,
          reason: 'Business is closed'
        })
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return slots
  }

  // Generate time slots for a specific day
  private static generateTimeSlotsForDay(
    date: Date,
    dayHours: { open: string; close: string },
    durationMinutes: number
  ): AvailableTimeSlot[] {
    const slots: AvailableTimeSlot[] = []
    
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
    
    const dayStart = new Date(date)
    dayStart.setHours(openHour, openMinute, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(closeHour, closeMinute, 0, 0)
    
    const currentTime = new Date(dayStart)
    
    // Generate 30-minute intervals
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000)
      
      if (slotEnd <= dayEnd) {
        slots.push({
          date: date.toISOString().split('T')[0],
          time: currentTime.toTimeString().slice(0, 5),
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          isAvailable: true
        })
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + 30)
    }
    
    return slots
  }

  // Check if a specific time is within business hours
  static async isWithinBusinessHours(
    tenantId: string,
    appointmentTime: Date
  ): Promise<{ isValid: boolean; reason?: string; businessHours?: any }> {
    // For now, use default business hours since we simplified the schema
    const businessHours = {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
    
    const dayOfWeek = appointmentTime.toLocaleDateString('en-US', { 
      weekday: 'long' 
    }).toLowerCase()
    
      const dayHours = (businessHours as any)[dayOfWeek]
    
    if (!dayHours || dayHours.closed) {
      return {
        isValid: false,
        reason: `Business is closed on ${dayOfWeek}`,
        businessHours: dayHours
      }
    }
    
    const appointmentHour = appointmentTime.getHours()
    const appointmentMinute = appointmentTime.getMinutes()
    const appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute

    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
    const openTimeMinutes = openHour * 60 + openMinute
    const closeTimeMinutes = closeHour * 60 + closeMinute

    if (appointmentTimeMinutes < openTimeMinutes || appointmentTimeMinutes >= closeTimeMinutes) {
      return {
        isValid: false,
        reason: `Appointment time is outside business hours (${dayHours.open} - ${dayHours.close})`,
        businessHours: dayHours
      }
    }
    
    return {
      isValid: true,
      businessHours: dayHours
    }
  }

  // Get next available appointment time within business hours
  static async getNextAvailableTime(
    tenantId: string,
    preferredDate?: Date,
    durationMinutes: number = 60,
    maxDaysAhead: number = 7
  ): Promise<AvailableTimeSlot | null> {
    const startDate = preferredDate || new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + maxDaysAhead)
    
    const availableSlots = await this.getAvailableSlots(
      tenantId,
      startDate,
      endDate,
      durationMinutes
    )
    
    const firstAvailable = availableSlots.find(slot => slot.isAvailable)
    return firstAvailable || null
  }

  // Format business hours for AI agent consumption
  static formatBusinessHoursForAI(businessHours: BusinessHours): string {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    return days.map(day => {
      const hours = businessHours[day]
      if (!hours || hours.closed) {
        return `${day}: Closed`
      }
      return `${day}: ${hours.open} - ${hours.close}`
    }).join('\n')
  }

  // Get available days for appointment booking
  static getAvailableDays(businessHours: BusinessHours): string[] {
    return Object.keys(businessHours).filter(day => 
      !businessHours[day].closed
    )
  }

  // Suggest alternative times if requested time is unavailable
  static async suggestAlternativeTimes(
    tenantId: string,
    requestedTime: Date,
    durationMinutes: number = 60,
    maxSuggestions: number = 3
  ): Promise<AvailableTimeSlot[]> {
    // For now, use default business hours since we simplified the schema
    const businessHours = {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
    
    const dayOfWeek = requestedTime.toLocaleDateString('en-US', { 
      weekday: 'long' 
    }).toLowerCase()
    
      const dayHours = (businessHours as any)[dayOfWeek]
    
    if (!dayHours || dayHours.closed) {
      // Suggest next available day
      const nextAvailable = await this.getNextAvailableTime(
        tenantId,
        new Date(requestedTime.getTime() + 24 * 60 * 60 * 1000),
        durationMinutes,
        7
      )
      return nextAvailable ? [nextAvailable] : []
    }
    
    // Generate alternative times for the same day
    const alternatives: AvailableTimeSlot[] = []
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
    
    const dayStart = new Date(requestedTime)
    dayStart.setHours(openHour, openMinute, 0, 0)
    
    const dayEnd = new Date(requestedTime)
    dayEnd.setHours(closeHour, closeMinute, 0, 0)
    
    // Try times before and after the requested time
    const timeOffsets = [-60, -30, 30, 60, 90, 120] // minutes
    
    for (const offset of timeOffsets) {
      const alternativeTime = new Date(requestedTime.getTime() + offset * 60000)
      
      if (alternativeTime >= dayStart && alternativeTime < dayEnd) {
        const validation = await this.isWithinBusinessHours(tenantId, alternativeTime)
        
        if (validation.isValid) {
          alternatives.push({
            date: alternativeTime.toISOString().split('T')[0],
            time: alternativeTime.toTimeString().slice(0, 5),
            dayOfWeek,
            isAvailable: true
          })
          
          if (alternatives.length >= maxSuggestions) {
            break
          }
        }
      }
    }
    
    return alternatives
  }
}
