export interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '17:00', closed: true },
  sunday: { open: '09:00', close: '17:00', closed: true }
}

export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
] as const

export type DayKey = typeof DAYS_OF_WEEK[number]['key']
