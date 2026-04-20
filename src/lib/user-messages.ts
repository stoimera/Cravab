// User-Friendly Error Messages
// Centralized system for converting technical errors to user-friendly messages

export interface UserMessage {
  title: string
  message: string
  action?: string
  severity: 'info' | 'warning' | 'error' | 'success'
}

// Error type mappings to user-friendly messages
export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    title: 'Access Denied',
    message: 'You need to sign in to access this feature.',
    action: 'Sign In',
    severity: 'warning' as const
  },
  FORBIDDEN: {
    title: 'Permission Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'Contact Support',
    severity: 'error' as const
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    action: 'Sign In',
    severity: 'warning' as const
  },

  // Validation Errors
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    message: 'Please check your input and try again.',
    action: 'Fix Errors',
    severity: 'warning' as const
  },
  REQUIRED_FIELD: {
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
    action: 'Complete Form',
    severity: 'warning' as const
  },
  INVALID_EMAIL: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    action: 'Fix Email',
    severity: 'warning' as const
  },
  INVALID_PHONE: {
    title: 'Invalid Phone Number',
    message: 'Please enter a valid phone number.',
    action: 'Fix Phone',
    severity: 'warning' as const
  },

  // Database Errors
  DUPLICATE_ENTRY: {
    title: 'Already Exists',
    message: 'This information already exists in our system.',
    action: 'Use Different Information',
    severity: 'warning' as const
  },
  USER_ALREADY_EXISTS: {
    title: 'User Already Exists',
    message: 'A user with this email already exists. Please use a different email address.',
    action: 'Use Different Email',
    severity: 'warning' as const
  },
  RECORD_NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested information could not be found.',
    action: 'Refresh Page',
    severity: 'info' as const
  },
  FOREIGN_KEY_CONSTRAINT: {
    title: 'Cannot Delete',
    message: 'This item cannot be deleted because it\'s being used elsewhere.',
    action: 'Remove Dependencies First',
    severity: 'warning' as const
  },

  // Network & API Errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers. Please check your internet connection.',
    action: 'Try Again',
    severity: 'error' as const
  },
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    action: 'Retry',
    severity: 'warning' as const
  },
  EXTERNAL_SERVICE_ERROR: {
    title: 'Service Unavailable',
    message: 'An external service is temporarily unavailable. Please try again later.',
    action: 'Try Again Later',
    severity: 'warning' as const
  },

  // Business Logic Errors
  APPOINTMENT_CONFLICT: {
    title: 'Time Conflict',
    message: 'This time slot is already booked. Please choose a different time.',
    action: 'Select Different Time',
    severity: 'warning' as const
  },
  CLIENT_EXISTS: {
    title: 'Client Already Exists',
    message: 'A client with this phone number already exists.',
    action: 'Use Different Phone Number',
    severity: 'warning' as const
  },
  INSUFFICIENT_PERMISSIONS: {
    title: 'Insufficient Permissions',
    message: 'You don\'t have the required permissions for this action.',
    action: 'Contact Administrator',
    severity: 'error' as const
  },

  // System Errors
  INTERNAL_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Our team has been notified.',
    action: 'Try Again',
    severity: 'error' as const
  },
  MAINTENANCE_MODE: {
    title: 'System Maintenance',
    message: 'We\'re performing maintenance. Please try again in a few minutes.',
    action: 'Check Back Later',
    severity: 'info' as const
  },
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'You\'re making requests too quickly. Please slow down.',
    action: 'Wait and Retry',
    severity: 'warning' as const
  },

  // Feature-Specific Errors
  VAPI_NOT_CONFIGURED: {
    title: 'AI Calls Not Set Up',
    message: 'AI call features are not configured for your account.',
    action: 'Contact Support',
    severity: 'info' as const
  },
  GOOGLE_MAPS_NOT_CONFIGURED: {
    title: 'Location Services Unavailable',
    message: 'Location-based features are not available.',
    action: 'Contact Support',
    severity: 'info' as const
  },
  EMAIL_NOT_CONFIGURED: {
    title: 'Email Services Unavailable',
    message: 'Email features are not configured for your account.',
    action: 'Contact Support',
    severity: 'info' as const
  },

  // Success Messages
  SUCCESS: {
    title: 'Success',
    message: 'Operation completed successfully.',
    severity: 'success' as const
  },
  SAVED: {
    title: 'Saved',
    message: 'Your changes have been saved.',
    severity: 'success' as const
  },
  DELETED: {
    title: 'Deleted',
    message: 'Item has been deleted successfully.',
    severity: 'success' as const
  }
} as const

// Error pattern matching for technical error messages
export const ERROR_PATTERNS = {
  // Database error patterns
  'duplicate key': ERROR_MESSAGES.DUPLICATE_ENTRY,
  'unique constraint': ERROR_MESSAGES.DUPLICATE_ENTRY,
  'foreign key constraint': ERROR_MESSAGES.FOREIGN_KEY_CONSTRAINT,
  'not found': ERROR_MESSAGES.RECORD_NOT_FOUND,
  'does not exist': ERROR_MESSAGES.RECORD_NOT_FOUND,
  'already exists': ERROR_MESSAGES.DUPLICATE_ENTRY,
  'already registered': ERROR_MESSAGES.USER_ALREADY_EXISTS,
  'user already registered': ERROR_MESSAGES.USER_ALREADY_EXISTS,
  'user with this email already exists': ERROR_MESSAGES.USER_ALREADY_EXISTS,
  
  // Network error patterns
  'fetch failed': ERROR_MESSAGES.NETWORK_ERROR,
  'network error': ERROR_MESSAGES.NETWORK_ERROR,
  'connection refused': ERROR_MESSAGES.NETWORK_ERROR,
  'timeout': ERROR_MESSAGES.TIMEOUT_ERROR,
  'request timeout': ERROR_MESSAGES.TIMEOUT_ERROR,
  
  // Authentication patterns
  'unauthorized': ERROR_MESSAGES.UNAUTHORIZED,
  'forbidden': ERROR_MESSAGES.FORBIDDEN,
  'access denied': ERROR_MESSAGES.FORBIDDEN,
  'session expired': ERROR_MESSAGES.SESSION_EXPIRED,
  'invalid token': ERROR_MESSAGES.UNAUTHORIZED,
  
  // Validation patterns
  'validation error': ERROR_MESSAGES.VALIDATION_ERROR,
  'required field': ERROR_MESSAGES.REQUIRED_FIELD,
  'invalid email': ERROR_MESSAGES.INVALID_EMAIL,
  'invalid phone': ERROR_MESSAGES.INVALID_PHONE,
  
  // Business logic patterns
  'appointment conflict': ERROR_MESSAGES.APPOINTMENT_CONFLICT,
  'time slot taken': ERROR_MESSAGES.APPOINTMENT_CONFLICT,
  'client exists': ERROR_MESSAGES.CLIENT_EXISTS,
  'insufficient permissions': ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
  
  // Rate limiting
  'rate limit': ERROR_MESSAGES.RATE_LIMITED,
  'too many requests': ERROR_MESSAGES.RATE_LIMITED,
  
  // External services
  'vapi not configured': ERROR_MESSAGES.VAPI_NOT_CONFIGURED,
  'google maps not configured': ERROR_MESSAGES.GOOGLE_MAPS_NOT_CONFIGURED,
  'email not configured': ERROR_MESSAGES.EMAIL_NOT_CONFIGURED,
} as const

// Convert technical error to user-friendly message
export function getUserMessage(error: Error | string, context?: string): UserMessage {
  const errorMessage = typeof error === 'string' ? error : error.message
  const lowerMessage = errorMessage.toLowerCase()
  
  // Check for specific error patterns
  for (const [pattern, message] of Object.entries(ERROR_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      return message
    }
  }
  
  // Check for HTTP status codes in error messages
  if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized')) {
    return ERROR_MESSAGES.UNAUTHORIZED
  }
  if (lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
    return ERROR_MESSAGES.FORBIDDEN
  }
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return ERROR_MESSAGES.RECORD_NOT_FOUND
  }
  if (lowerMessage.includes('409') || lowerMessage.includes('conflict')) {
    return ERROR_MESSAGES.DUPLICATE_ENTRY
  }
  if (lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
    return ERROR_MESSAGES.RATE_LIMITED
  }
  if (lowerMessage.includes('500') || lowerMessage.includes('internal server error')) {
    return ERROR_MESSAGES.INTERNAL_ERROR
  }
  if (lowerMessage.includes('502') || lowerMessage.includes('bad gateway')) {
    return ERROR_MESSAGES.EXTERNAL_SERVICE_ERROR
  }
  if (lowerMessage.includes('503') || lowerMessage.includes('service unavailable')) {
    return ERROR_MESSAGES.MAINTENANCE_MODE
  }
  
  // Context-specific fallbacks
  if (context && typeof context === 'string') {
    if (context.includes('auth') || context.includes('login')) {
      return ERROR_MESSAGES.UNAUTHORIZED
    }
    if (context.includes('validation') || context.includes('form')) {
      return ERROR_MESSAGES.VALIDATION_ERROR
    }
    if (context.includes('network') || context.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }
  }
  
  // Default fallback
  return ERROR_MESSAGES.INTERNAL_ERROR
}

// Get success message
export function getSuccessMessage(action: string): UserMessage {
  switch (action.toLowerCase()) {
    case 'create':
    case 'add':
      return {
        title: 'Created Successfully',
        message: 'Item has been created successfully.',
        severity: 'success'
      }
    case 'update':
    case 'edit':
    case 'save':
      return ERROR_MESSAGES.SAVED
    case 'delete':
    case 'remove':
      return ERROR_MESSAGES.DELETED
    case 'send':
      return {
        title: 'Sent Successfully',
        message: 'Message has been sent successfully.',
        severity: 'success'
      }
    default:
      return ERROR_MESSAGES.SUCCESS
  }
}

// Format error for display
export function formatErrorForDisplay(error: Error | string, context?: string): string {
  const userMessage = getUserMessage(error, context)
  return userMessage.message
}

// Format error with title for display
export function formatErrorWithTitle(error: Error | string, context?: string): { title: string; message: string } {
  const userMessage = getUserMessage(error, context)
  return {
    title: userMessage.title,
    message: userMessage.message
  }
}

// Check if error is retryable
export function isRetryableError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message
  const lowerMessage = errorMessage.toLowerCase()
  
  const retryablePatterns = [
    'network error',
    'timeout',
    'connection refused',
    'fetch failed',
    'rate limit',
    'service unavailable',
    'bad gateway'
  ]
  
  return retryablePatterns.some(pattern => lowerMessage.includes(pattern))
}

// Get retry delay based on error type
export function getRetryDelay(error: Error | string): number {
  const errorMessage = typeof error === 'string' ? error : error.message
  const lowerMessage = errorMessage.toLowerCase()
  
  if (lowerMessage.includes('rate limit')) {
    return 60000 // 1 minute for rate limits
  }
  if (lowerMessage.includes('timeout')) {
    return 5000 // 5 seconds for timeouts
  }
  if (lowerMessage.includes('network error')) {
    return 3000 // 3 seconds for network errors
  }
  
  return 1000 // 1 second default
}
