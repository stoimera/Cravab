import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { logger } from '@/lib/logger'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function calculateTravelTime(address1: string, address2: string): Promise<number> {
  // Import Google Maps service dynamically to avoid SSR issues
  return import('./google-maps').then(({ calculateTravelTime: googleCalculateTravelTime }) => 
    googleCalculateTravelTime(address1, address2)
  ).then((result) => result || 15).catch((error) => {
    logger.error('Error calculating travel time:', error)
    // Fallback to mock value if Google Maps fails
    return 15
  })
}