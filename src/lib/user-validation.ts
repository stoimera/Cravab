/**
 * User Validation Utilities
 * Centralized functions for user validation and conflict checking
 */

import { createErrorResponse } from '@/lib/api-helpers'

/**
 * Check if a user with the given email already exists
 * @param supabase - Supabase client instance
 * @param email - Email to check
 * @param tenantId - Optional tenant ID to scope the check
 * @returns Promise<boolean> - true if user exists, false otherwise
 */
export async function checkUserExists(
  supabase: any, 
  email: string, 
  tenantId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    const { data: existingUser } = await query.single()
    return !!existingUser
  } catch (error) {
    // If no user found, single() throws an error, which is expected
    return false
  }
}

/**
 * Validate user creation data and check for conflicts
 * @param supabase - Supabase client instance
 * @param userData - User data to validate
 * @param tenantId - Optional tenant ID to scope the check
 * @returns Promise<{ isValid: boolean; error?: NextResponse }>
 */
export async function validateUserCreation(
  supabase: any,
  userData: { email: string; first_name?: string; last_name?: string },
  tenantId?: string
): Promise<{ isValid: boolean; error?: any }> {
  // Check required fields
  if (!userData.email) {
    return {
      isValid: false,
      error: createErrorResponse('Email is required', 400)
    }
  }

  if (!userData.first_name || !userData.last_name) {
    return {
      isValid: false,
      error: createErrorResponse('First name and last name are required', 400)
    }
  }

  // Check if user already exists
  const userExists = await checkUserExists(supabase, userData.email, tenantId)
  if (userExists) {
    return {
      isValid: false,
      error: createErrorResponse('A user with this email already exists', 409)
    }
  }

  return { isValid: true }
}

/**
 * Handle Supabase Auth errors and convert to user-friendly messages
 * @param authError - Error from Supabase Auth
 * @returns NextResponse with appropriate error message
 */
export function handleAuthError(authError: any): any {
  if (authError.message.includes('already registered') || 
      authError.message.includes('User already registered')) {
    return createErrorResponse('A user with this email already exists', 409)
  }
  
  if (authError.message.includes('Invalid email')) {
    return createErrorResponse('Please enter a valid email address', 400)
  }
  
  if (authError.message.includes('Password should be at least')) {
    return createErrorResponse('Password must be at least 6 characters long', 400)
  }
  
  return createErrorResponse(`Failed to create user account: ${authError.message}`, 500)
}
