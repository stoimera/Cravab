import { NextRequest, NextResponse } from 'next/server'
import { generateMasterKey, testEncryption } from '@/lib/crypto'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
export async function GET() {
  try {
    // Generate a new clean master key
    const newMasterKey = generateMasterKey()
    
    // Test it works
    const testResult = testEncryption(newMasterKey)
    
    return NextResponse.json({
      newMasterKey: newMasterKey,
      keyLength: newMasterKey.length,
      testPassed: testResult,
      instructions: [
        '1. Copy this new master key',
        '2. Add it to your .env.local file as MASTER_ENCRYPTION_KEY',
        '3. Restart your development server',
        '4. Test the Vapi configuration again'
      ]
    })
    
  } catch (error) {
    return createSuccessResponse({ 
      error: 'Key generation failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500)
  }
}
