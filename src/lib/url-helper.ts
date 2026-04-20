/**
 * URL Helper for handling different environments
 * - Frontend API calls: always use localhost to avoid CORS
 * - Webhook URLs: use ngrok URL for external access
 * - Email links: use ngrok URL for external access
 */

export function getApiUrl(): string {
  // For frontend API calls, use the current origin or localhost in development
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function getWebhookUrl(): string {
  // For webhooks, use the current origin or fallback to environment variable
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function getPublicUrl(): string {
  // For public URLs (email links, etc.), use the current origin or fallback to environment variable
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function isNgrokEnvironment(): boolean {
  return process.env.NEXT_PUBLIC_APP_URL?.includes('ngrok') || false
}
