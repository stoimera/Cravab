// Security Headers Configuration
// Implements security headers to protect against common attacks

import { NextRequest, NextResponse } from 'next/server'

export const securityHeaders = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:3000 https://CRAVAB.com https://CRAVAB.vercel.app https://maps.googleapis.com https://api.vapi.ai https://*.supabase.co https://*.supabase.com wss:",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '),
  
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

export function addSecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  // Add all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add cache control for sensitive pages
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/admin/') ||
      request.nextUrl.pathname.startsWith('/settings/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}
