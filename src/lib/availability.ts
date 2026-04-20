// Availability checking and scheduling utilities

import { DatabaseService } from './database'
import { Appointment } from '../types/database-comprehensive'

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  reason?: string
}

export interface AvailabilityOptions {
  tenantId: string
  date: Date
  duration: number // in minutes
  bufferTime?: number // buffer between appointments in minutes
  businessHours?: {
    start: string // "09:00"
    end: string // "17:00"
    breaks?: Array<{ start: string; end: string }>
  }
}

export class AvailabilityService {
  // Check availability for a specific date and time slot
  static async checkAvailability(options: AvailabilityOptions): Promise<TimeSlot[]> {
    const {
      tenantId,
      date,
      duration,
      bufferTime = 15, // 15 minutes buffer by default
      businessHours = { start: "09:00", end: "17:00" }
    } = options

    // Get all appointments for the date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAppointments = await DatabaseService.getAppointmentsByDateRange(
      tenantId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    )

    // Generate time slots for the day
    const timeSlots = this.generateTimeSlots(date, businessHours, duration)
    
    // Check each slot for conflicts
    return timeSlots.map(slot => {
      const conflicts = this.findConflicts(slot, existingAppointments, bufferTime)
      return {
        start: slot.start,
        end: slot.end,
        available: conflicts.length === 0,
        reason: conflicts.length > 0 ? `Conflicts with: ${conflicts.map(c => c.title).join(', ')}` : undefined
      }
    })
  }

  // Find the next available time slot
  static async findNextAvailableSlot(
    tenantId: string,
    duration: number,
    preferredDate?: Date,
    maxDaysAhead: number = 7
  ): Promise<TimeSlot | null> {
    const startDate = preferredDate || new Date()
    
    for (let i = 0; i < maxDaysAhead; i++) {
      const checkDate = new Date(startDate)
      checkDate.setDate(checkDate.getDate() + i)
      
      const availability = await this.checkAvailability({
        tenantId,
        date: checkDate,
        duration
      })
      
      const availableSlot = availability.find(slot => slot.available)
      if (availableSlot) {
        return availableSlot
      }
    }
    
    return null
  }

  // Get the last completed job for a tenant
  static async getLastCompletedJob(tenantId: string): Promise<{
    address: string
    coordinates: any
    completedAt: Date
    clientName: string
  } | null> {
    // Get appointments from the last 30 days to find recent completed jobs
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const appointments = await DatabaseService.getAppointmentsByDateRange(tenantId, startDate, endDate)
    
    const completedJobs = appointments
      .filter(apt => apt.status === 'completed')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    
    if (completedJobs.length === 0) return null
    
    const lastJob = completedJobs[0]
    return {
      address: lastJob.address || '',
      coordinates: lastJob.coordinates,
      completedAt: new Date(lastJob.updated_at),
      clientName: 'Client' // Since we don't have client info in this query
    }
  }

  // Suggest optimal scheduling based on last job location
  static async suggestOptimalSchedule(
    tenantId: string,
    newAddress: string,
    duration: number,
    preferredDate?: Date
  ): Promise<{
    suggestedSlots: TimeSlot[]
    lastJobInfo: {
      address: string
      travelTime: number | null
    } | null
  }> {
    const lastJob = await this.getLastCompletedJob(tenantId)
    const suggestedSlots = await this.findNextAvailableSlot(
      tenantId,
      duration,
      preferredDate
    )

    let lastJobInfo = null
    if (lastJob) {
      // Calculate travel time from last job to new address
      // This would integrate with Google Maps API
      lastJobInfo = {
        address: lastJob.address,
        travelTime: null // Would be calculated via Google Maps
      }
    }

    return {
      suggestedSlots: suggestedSlots ? [suggestedSlots] : [],
      lastJobInfo
    }
  }

  // Generate time slots for a given date
  private static generateTimeSlots(
    date: Date,
    businessHours: { start: string; end: string; breaks?: Array<{ start: string; end: string }> },
    duration: number
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = []
    
    const [startHour, startMinute] = businessHours.start.split(':').map(Number)
    const [endHour, endMinute] = businessHours.end.split(':').map(Number)
    
    const dayStart = new Date(date)
    dayStart.setHours(startHour, startMinute, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(endHour, endMinute, 0, 0)
    
    const currentTime = new Date(dayStart)
    
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000)
      
      // Check if slot is within business hours and not during breaks
      if (slotEnd <= dayEnd && !this.isDuringBreak(currentTime, businessHours.breaks || [])) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd)
        })
      }
      
      // Move to next slot (30-minute intervals)
      currentTime.setMinutes(currentTime.getMinutes() + 30)
    }
    
    return slots
  }

  // Check if a time slot conflicts with existing appointments
  private static findConflicts(
    slot: { start: Date; end: Date },
    appointments: Appointment[],
    bufferTime: number
  ): Appointment[] {
    const bufferMs = bufferTime * 60000
    const slotStart = new Date(slot.start.getTime() - bufferMs)
    const slotEnd = new Date(slot.end.getTime() + bufferMs)
    
    return appointments.filter(apt => {
      const aptStart = new Date(apt.starts_at)
      const aptEnd = new Date(apt.ends_at)
      
      return (
        (aptStart < slotEnd && aptEnd > slotStart) &&
        apt.status !== 'cancelled'
      )
    })
  }

  // Check if a time is during a break period
  private static isDuringBreak(
    time: Date,
    breaks: Array<{ start: string; end: string }>
  ): boolean {
    return breaks.some(breakPeriod => {
      const [startHour, startMinute] = breakPeriod.start.split(':').map(Number)
      const [endHour, endMinute] = breakPeriod.end.split(':').map(Number)
      
      const breakStart = new Date(time)
      breakStart.setHours(startHour, startMinute, 0, 0)
      
      const breakEnd = new Date(time)
      breakEnd.setHours(endHour, endMinute, 0, 0)
      
      return time >= breakStart && time < breakEnd
    })
  }
}
