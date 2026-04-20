import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Fix CORS for ngrok
  if (request.headers.get('origin')?.includes('ngrok-free.app')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Fix static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Fix manifest
  if (request.nextUrl.pathname === '/manifest.json') {
    response.headers.set('Content-Type', 'application/manifest+json')
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
