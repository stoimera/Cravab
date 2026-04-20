import { NextRequest, NextResponse } from 'next/server'
import { encryptText, testEncryption } from '@/lib/crypto'
import { authenticateRequest, createErrorResponse } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'

// Maximum field lengths for validation
const MAX_FIELD_LENGTHS = {
  vapi_api_key: 500,
  vapi_public_api_key: 500,
  vapi_assistant_id: 200
}

/**
 * Validate and sanitize input fields
 */
function validateInput(
  vapi_api_key: any,
  vapi_public_api_key: any,
  vapi_assistant_id: any
): { isValid: boolean; error?: string } {
  // Validate types
  if (vapi_api_key !== undefined && typeof vapi_api_key !== 'string') {
    return { isValid: false, error: 'vapi_api_key must be a string' }
  }
  if (vapi_public_api_key !== undefined && typeof vapi_public_api_key !== 'string') {
    return { isValid: false, error: 'vapi_public_api_key must be a string' }
  }
  if (vapi_assistant_id !== undefined && typeof vapi_assistant_id !== 'string') {
    return { isValid: false, error: 'vapi_assistant_id must be a string' }
  }

  // Validate lengths
  if (vapi_api_key && vapi_api_key.length > MAX_FIELD_LENGTHS.vapi_api_key) {
    return { 
      isValid: false, 
      error: `vapi_api_key exceeds maximum length of ${MAX_FIELD_LENGTHS.vapi_api_key} characters` 
    }
  }
  if (vapi_public_api_key && vapi_public_api_key.length > MAX_FIELD_LENGTHS.vapi_public_api_key) {
    return { 
      isValid: false, 
      error: `vapi_public_api_key exceeds maximum length of ${MAX_FIELD_LENGTHS.vapi_public_api_key} characters` 
    }
  }
  if (vapi_assistant_id && vapi_assistant_id.length > MAX_FIELD_LENGTHS.vapi_assistant_id) {
    return { 
      isValid: false, 
      error: `vapi_assistant_id exceeds maximum length of ${MAX_FIELD_LENGTHS.vapi_assistant_id} characters` 
    }
  }

  return { isValid: true }
}

export async function POST(request: NextRequest) {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult

    // Get user's role and tenant_id for admin check
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData) {
      logger.error('Error fetching user data:', userDataError)
      return createErrorResponse('User not found', 404, { tenantId })
    }

    // Verify user belongs to the tenant they're trying to update
    if (userData.tenant_id !== tenantId) {
      return createErrorResponse('Access denied to this tenant', 403)
    }

    // Check if user is admin
    if (userData.role !== 'admin') {
      return createErrorResponse('Admin privileges required', 403)
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    const { vapi_api_key, vapi_public_api_key, vapi_assistant_id } = body

    // Validate input
    const validation = validateInput(vapi_api_key, vapi_public_api_key, vapi_assistant_id)
    if (!validation.isValid) {
      return createErrorResponse(validation.error || 'Invalid input', 400)
    }

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      logger.error('Error fetching tenant:', tenantError)
      return createErrorResponse('Tenant not found', 404)
    }

    // Check encryption system before proceeding
    const masterKey = process.env.MASTER_ENCRYPTION_KEY
    if (!masterKey) {
      logger.error('MASTER_ENCRYPTION_KEY not found in environment')
      return createErrorResponse('Encryption key not configured', 500)
    }

    // Test encryption system if API key is being updated
    if (vapi_api_key !== undefined && vapi_api_key) {
      try {
        await testEncryption(masterKey)
      } catch (error) {
        logger.error('Encryption system test failed:', error)
        return createErrorResponse('Encryption system error', 500)
      }
    }

    // Build update object - only include fields that are provided
    const updateData: {
      vapi_api_key_encrypted?: string | null
      vapi_public_api_key?: string | null
      vapi_assistant_id?: string | null
      updated_at?: string
    } = {
      updated_at: new Date().toISOString()
    }

    // Encrypt the API key if provided
    if (vapi_api_key !== undefined) {
      if (vapi_api_key) {
        try {
          updateData.vapi_api_key_encrypted = encryptText(masterKey, vapi_api_key.trim())
          logger.debug('API key encrypted successfully, length:', updateData.vapi_api_key_encrypted.length)
        } catch (encryptError) {
          logger.error('Encryption failed:', encryptError)
          return createErrorResponse(
            'Failed to encrypt API key', 
            500,
            { 
              details: encryptError instanceof Error ? encryptError.message : String(encryptError)
            }
          )
        }
      } else {
        // If empty string provided, clear the encrypted key
        updateData.vapi_api_key_encrypted = null
      }
    }

    // Only update fields that are explicitly provided
    if (vapi_public_api_key !== undefined) {
      updateData.vapi_public_api_key = vapi_public_api_key ? vapi_public_api_key.trim() : null
    }

    if (vapi_assistant_id !== undefined) {
      updateData.vapi_assistant_id = vapi_assistant_id ? vapi_assistant_id.trim() : null
    }

    // Check if there's anything to update (excluding updated_at)
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updated_at')
    if (fieldsToUpdate.length === 0) {
      return createErrorResponse('No fields provided to update', 400)
    }

    // Update tenant configuration using service client to bypass RLS
    // (This is consistent with provider-keys route and ensures reliability)
    const { error: updateError } = await supabaseAdmin()
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)

    if (updateError) {
      logger.error('Error updating tenant configuration:', updateError)
      return createErrorResponse('Failed to save configuration', 500, {
        details: updateError.message
      })
    }

    // Return success response without exposing sensitive data
    return NextResponse.json({
      success: true,
      message: 'VAPI configuration updated successfully',
      updated: {
        has_api_key: !!updateData.vapi_api_key_encrypted,
        has_public_api_key: !!updateData.vapi_public_api_key,
        has_assistant_id: !!updateData.vapi_assistant_id
      }
    })

  } catch (error) {
    logger.error('Unexpected error in VAPI configure:', error)
    return createErrorResponse(
      'Internal server error', 
      500,
      { 
        details: error instanceof Error ? error.message : String(error)
      }
    )
  }
}
