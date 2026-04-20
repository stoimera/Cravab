/**
 * Centralized CORS Configuration
 * Production-ready CORS handling for all API endpoints
 */

export interface CorsConfig {
  origin: string | string[] | boolean
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge: number
}

export const corsConfig: CorsConfig = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://CRAVAB.com',
    'https://CRAVAB.vercel.app',
    // Add your production domains here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Forwarded-For',
    'X-Real-IP',
    'X-API-Key',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = Array.isArray(corsConfig.origin) 
    ? corsConfig.origin 
    : [corsConfig.origin as string]

  const isAllowed = origin && allowedOrigins.includes(origin)
  const allowedOrigin = isAllowed ? origin : (corsConfig.origin as string[])[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
    'Access-Control-Allow-Credentials': corsConfig.credentials.toString(),
    'Access-Control-Max-Age': corsConfig.maxAge.toString(),
    'Vary': 'Origin'
  }
}

export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      ...getCorsHeaders(),
      'Content-Length': '0'
    }
  })
}

export function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return handleCorsPreflight()
    }

    try {
      const response = await handler(req)
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      const errorResponse = new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
      
      return errorResponse
    }
  }
}
