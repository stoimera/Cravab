import { NextRequest, NextResponse } from 'next/server'
import { runIntegrationTests } from '@/lib/integration-test'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
export async function GET() {
  try {
    const results = await runIntegrationTests()
    
    return NextResponse.json({
      ...results,
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
