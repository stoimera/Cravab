/**
 * Centralized date parsing utilities for handling relative dates
 * Converts natural language dates to actual dates in the user's timezone
 */

export interface DateParseResult {
  date: string // YYYY-MM-DD format
  dayOfWeek: string // lowercase day name
  isRelative: boolean
  originalInput: string
  clarification?: {
    thisWeek: string
    nextWeek: string
    message: string
  }
}

/**
 * Parse relative date expressions and convert to actual dates
 * @param dateInput - The date input from user (e.g., "tomorrow", "friday", "next week")
 * @param userTimezone - The user's timezone (e.g., "America/Chicago")
 * @param currentDate - Optional current date from getCurrentDate function (YYYY-MM-DD format)
 * @returns Parsed date information
 */
export function parseRelativeDate(dateInput: string, userTimezone: string = 'America/Chicago', currentDate?: string): DateParseResult {
  let userDate: Date
  
  if (currentDate) {
    // Use the current date from getCurrentDate function
    userDate = new Date(currentDate + 'T00:00:00')
  } else {
    // Fallback to current system date
    const now = new Date()
    userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
  }
  const input = dateInput.toLowerCase().trim()
  
  // Parsing relative date in timezone
  // Current user date processed
  
  // Handle "tomorrow"
  if (input.includes('tomorrow')) {
    const tomorrow = new Date(userDate)
    tomorrow.setDate(userDate.getDate() + 1)
    return {
      date: tomorrow.toISOString().split('T')[0],
      dayOfWeek: tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      isRelative: true,
      originalInput: dateInput
    }
  }
  
  // Handle "today"
  if (input.includes('today')) {
    return {
      date: userDate.toISOString().split('T')[0],
      dayOfWeek: userDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      isRelative: true,
      originalInput: dateInput
    }
  }
  
  // Handle specific days of the week
  const dayMap: { [key: string]: number } = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }
  
  for (const [dayName, dayNumber] of Object.entries(dayMap)) {
    if (input.includes(dayName)) {
      const isNextWeek = input.includes('next')
      const isThisWeek = input.includes('this')
      const currentDay = userDate.getDay()
      
      // Check if today is the same day they're asking about
      const isToday = currentDay === dayNumber
      
      let targetDate = getNextWeekday(userDate, dayNumber)
      
      if (isNextWeek) {
        // Next week's day - get this week's day first, then add 7 days
        const thisWeekDay = getNextWeekday(userDate, dayNumber)
        targetDate = new Date(thisWeekDay)
        targetDate.setDate(thisWeekDay.getDate() + 7)
      } else if (isThisWeek) {
        // This week's day (same as current logic)
        targetDate = getNextWeekday(userDate, dayNumber)
      } else {
        // If neither "next" nor "this" is specified, default to next occurrence
        targetDate = getNextWeekday(userDate, dayNumber)
      }
      
      // Special case: if today is the same day and they said "next [day]"
      // Return a special response that indicates clarification is needed
      if (isToday && isNextWeek) {
        // This week's day (the upcoming occurrence this week - 7 days from today)
        const thisWeekDate = new Date(userDate)
        thisWeekDate.setDate(userDate.getDate() + 7)
        // Next week's day (14 days from today)
        const nextWeekDate = new Date(userDate)
        nextWeekDate.setDate(userDate.getDate() + 14)
        
        return {
          date: 'CLARIFICATION_NEEDED',
          dayOfWeek: dayName,
          isRelative: true,
          originalInput: dateInput,
          clarification: {
            thisWeek: thisWeekDate.toISOString().split('T')[0],
            nextWeek: nextWeekDate.toISOString().split('T')[0],
            message: `Since today is ${dayName}, did you mean this ${dayName} (${thisWeekDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}) or next ${dayName} (${nextWeekDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })})?`
          }
        }
      }
      
      return {
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek: dayName,
        isRelative: true,
        originalInput: dateInput
      }
    }
  }
  
  // Handle specific dates with ordinal numbers (e.g., "20th of October", "ninth of October")
  const ordinalMatch = input.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)/i)
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1])
    const monthName = ordinalMatch[2].toLowerCase()
    const monthMap: { [key: string]: number } = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11
    }
    
    const month = monthMap[monthName]
    if (month !== undefined) {
      // Check if year is specified
      const yearMatch = input.match(/(\d{4})/)
      const year = yearMatch ? parseInt(yearMatch[1]) : userDate.getFullYear()
      
      const targetDate = new Date(year, month, day)
      
      // If the date is in the past, assume next year
      if (targetDate < userDate) {
        targetDate.setFullYear(year + 1)
      }
      
      return {
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek: targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        isRelative: false,
        originalInput: dateInput
      }
    }
  }
  
  // Handle ordinal numbers with month names (e.g., "ninth of October")
  const ordinalWords: { [key: string]: number } = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14, 'fifteenth': 15,
    'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18, 'nineteenth': 19, 'twentieth': 20,
    'twenty-first': 21, 'twenty-second': 22, 'twenty-third': 23, 'twenty-fourth': 24, 'twenty-fifth': 25,
    'twenty-sixth': 26, 'twenty-seventh': 27, 'twenty-eighth': 28, 'twenty-ninth': 29, 'thirtieth': 30, 'thirty-first': 31
  }
  
  const ordinalWordMatch = input.match(/(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty-second|twenty-third|twenty-fourth|twenty-fifth|twenty-sixth|twenty-seventh|twenty-eighth|twenty-ninth|thirtieth|thirty-first)\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)/i)
  if (ordinalWordMatch) {
    const day = ordinalWords[ordinalWordMatch[1].toLowerCase()]
    const monthName = ordinalWordMatch[2].toLowerCase()
    const monthMap: { [key: string]: number } = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11
    }
    
    const month = monthMap[monthName]
    if (month !== undefined && day !== undefined) {
      // Check if year is specified
      const yearMatch = input.match(/(\d{4})/)
      const year = yearMatch ? parseInt(yearMatch[1]) : userDate.getFullYear()
      
      const targetDate = new Date(year, month, day)
      
      // If the date is in the past, assume next year
      if (targetDate < userDate) {
        targetDate.setFullYear(year + 1)
      }
      
      return {
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek: targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        isRelative: false,
        originalInput: dateInput
      }
    }
  }
  
  // Handle "next week"
  if (input.includes('next week')) {
    const nextWeek = new Date(userDate)
    nextWeek.setDate(userDate.getDate() + 7)
    return {
      date: nextWeek.toISOString().split('T')[0],
      dayOfWeek: nextWeek.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      isRelative: true,
      originalInput: dateInput
    }
  }
  
  // Handle "this weekend" (Saturday or Sunday)
  if (input.includes('weekend')) {
    const saturday = getNextWeekday(userDate, 6) // Saturday
    const sunday = getNextWeekday(userDate, 0) // Sunday
    const isNextWeekend = input.includes('next')
    
    if (isNextWeekend) {
      const nextSaturday = new Date(saturday)
      nextSaturday.setDate(saturday.getDate() + 7)
      return {
        date: nextSaturday.toISOString().split('T')[0],
        dayOfWeek: 'saturday',
        isRelative: true,
        originalInput: dateInput
      }
    } else {
      // This weekend - return Saturday if it's before Saturday, otherwise next Saturday
      const today = userDate.getDay()
      if (today < 6) { // Before Saturday
        return {
          date: saturday.toISOString().split('T')[0],
          dayOfWeek: 'saturday',
          isRelative: true,
          originalInput: dateInput
        }
      } else {
        return {
          date: sunday.toISOString().split('T')[0],
          dayOfWeek: 'sunday',
          isRelative: true,
          originalInput: dateInput
        }
      }
    }
  }
  
  // If no relative date pattern matches, try to parse as absolute date
  try {
    const parsedDate = new Date(dateInput)
    if (!isNaN(parsedDate.getTime())) {
      return {
        date: parsedDate.toISOString().split('T')[0],
        dayOfWeek: parsedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        isRelative: false,
        originalInput: dateInput
      }
    }
  } catch (error) {
    // Failed to parse date
  }
  
  // If all else fails, return today's date
  // Could not parse date input, defaulting to today
  return {
    date: userDate.toISOString().split('T')[0],
    dayOfWeek: userDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
    isRelative: false,
    originalInput: dateInput
  }
}

/**
 * Get the next occurrence of a specific weekday
 * @param fromDate - Starting date
 * @param targetDay - Target day of week (0 = Sunday, 1 = Monday, etc.)
 * @returns Date of the next occurrence
 */
function getNextWeekday(fromDate: Date, targetDay: number): Date {
  const result = new Date(fromDate)
  const currentDay = fromDate.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7
  result.setDate(fromDate.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
  return result
}

/**
 * Extract time from a date/time string
 * @param dateTimeInput - Input string like "tomorrow at 2pm", "friday 3:30"
 * @returns Time in HH:MM format or null if no time found
 */
export function extractTimeFromString(dateTimeInput: string): string | null {
  const timeMatch = dateTimeInput.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i)
  if (!timeMatch) return null
  
  let hours = parseInt(timeMatch[1])
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
  const ampm = timeMatch[3]?.toLowerCase()
  
  // Convert to 24-hour format
  if (ampm === 'pm' && hours !== 12) hours += 12
  if (ampm === 'am' && hours === 12) hours = 0
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Parse a complete date/time string with relative dates and times
 * @param dateTimeInput - Input like "tomorrow at 2pm", "friday 3:30", "next monday 9am"
 * @param userTimezone - User's timezone
 * @param currentDate - Optional current date from getCurrentDate function (YYYY-MM-DD format)
 * @returns Object with parsed date and time
 */
export function parseDateTimeString(dateTimeInput: string, userTimezone: string = 'America/Chicago', currentDate?: string): {
  date: string
  time: string | null
  dayOfWeek: string
  isRelative: boolean
} {
  const time = extractTimeFromString(dateTimeInput)
  const dateInput = dateTimeInput.replace(/\s*(at|@)\s*\d{1,2}:?\d{0,2}\s*(am|pm)?/gi, '').trim()
  const dateResult = parseRelativeDate(dateInput, userTimezone, currentDate)
  
  return {
    date: dateResult.date,
    time: time,
    dayOfWeek: dateResult.dayOfWeek,
    isRelative: dateResult.isRelative
  }
}
