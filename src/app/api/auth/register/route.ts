import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { registerSchema } from '@/lib/schemas'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    let validatedData
    try {
      validatedData = registerSchema.parse(body)
    } catch (validationError) {
      logger.error('Validation error:', validationError)
      const errorMessage = validationError instanceof Error ? validationError.message : 'Validation failed'
      return createErrorResponse(`Validation failed: ${errorMessage}`, 400)
    }
    
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const supabaseService = createServiceClient()
    const supabaseAdmin = createServiceClient() // Use service client for auth operations
    
    // Create company first
    const tenantId = uuidv4()
    
    // Generate unique slug
    const generateUniqueSlug = async (baseName: string): Promise<string> => {
      let baseSlug = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Ensure slug is not empty
      if (!baseSlug) {
        baseSlug = 'company'
      }
      
      let slug = baseSlug
      let counter = 1
      let attempts = 0
      const maxAttempts = 100 // Prevent infinite loop
      
      while (attempts < maxAttempts) {
        try {
          const { data: existingCompany, error } = await supabase
            .from('tenants')
            .select('id')
            .eq('slug', slug)
            .single()
          
          // If no error and no data, slug is available
          if (error && error.code === 'PGRST116') { // No rows returned
            return slug
          }
          
          // If data exists, try next iteration
          if (existingCompany) {
            slug = `${baseSlug}-${counter}`
            counter++
            attempts++
          } else {
            return slug
          }
        } catch (error) {
          logger.error('Error checking slug uniqueness:', error)
          // If there's an error checking, use timestamp fallback
          return `${baseSlug}-${Date.now()}`
        }
      }
      
      // Fallback to timestamp if we've tried too many times
      return `${baseSlug}-${Date.now()}`
    }
    
    const companySlug = await generateUniqueSlug(validatedData.name)
    
    logger.debug('Generated slug:', companySlug)
    
    const { error: companyError } = await supabaseService
      .from('tenants')
      .insert({
        id: tenantId,
        name: validatedData.name,
        slug: companySlug,
        email: validatedData.email,
        status: 'active',
      } as any)

    if (companyError) {
      logger.error('Company creation error:', companyError)
      // Check if it's a duplicate slug error
      if (companyError.message.includes('duplicate key value violates unique constraint "tenants_slug_key"')) {
        // Try with a timestamp-based slug
        const timestamp = Date.now()
        const fallbackSlug = `${companySlug}-${timestamp}`
        logger.debug('Trying fallback slug:', fallbackSlug)
        
        const { error: fallbackError } = await supabaseService
          .from('tenants')
          .insert({
            id: tenantId,
            name: validatedData.name,
            slug: fallbackSlug,
            email: validatedData.email,
            status: 'active',
          } as any)
        
        if (fallbackError) {
          return createErrorResponse(`Failed to create company: ${fallbackError.message}`, 400)
        }
      } else {
        return createErrorResponse(`Failed to create company: ${companyError.message}`, 400)
      }
    }
    
    // Company created successfully

    // Create user account using service client (bypasses email confirmation)
    logger.debug('Creating Supabase Auth user for:', validatedData.email)
    
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      logger.error('Supabase Auth error:', authError)
      // Auth signup error
      // Clean up company if user creation fails
      await supabaseService.from('tenants').delete().eq('id', tenantId)
      
      // Handle specific Supabase Auth errors
      if (authError.message.includes('already registered') || authError.message.includes('User already registered') || authError.message.includes('already exists')) {
        return createErrorResponse('A user with this email already exists', 409)
      }
      return createErrorResponse(`Failed to create user account: ${authError.message}`, 400)
    }
    
    logger.debug('Supabase Auth user created:', authData.user?.id)
    // Auth user created successfully

    if (authData.user) {
      // Create user profile
      const userData = {
        id: authData.user.id,
        tenant_id: tenantId,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        role: validatedData.role,
        phone: validatedData.phone || null,
        is_active: true,
        status: 'active',
      }
      
      logger.debug('Creating user profile with data:', userData)
      
      // Use the simple user creation function
      const { data: createResult, error: userError } = await (supabaseService as any).rpc('create_user_simple', {
        p_user_id: userData.id,
        p_tenant_id: userData.tenant_id,
        p_email: userData.email,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_role: userData.role,
        p_phone: userData.phone
      })

      if (userError) {
        logger.error('User creation error:', userError)
        // Clean up company and auth user if profile creation fails
        await supabaseService.from('tenants').delete().eq('id', tenantId)
        await supabaseService.auth.admin.deleteUser(authData.user.id)
        // User creation error
        return createErrorResponse(`Database error saving new user: ${userError.message}`, 400)
      }
      
      // Check if the function returned an error
      if (createResult && !createResult.success) {
        logger.error('User creation function error:', createResult.error)
        // Clean up company and auth user if profile creation fails
        await supabaseService.from('tenants').delete().eq('id', tenantId)
        await supabaseService.auth.admin.deleteUser(authData.user.id)
        // User creation error
        return createErrorResponse(`Database error saving new user: ${createResult.error}`, 400)
      }
      
      logger.debug('User profile created successfully')

      // Update user metadata with tenant_id
      const { error: metadataError } = await supabaseService.auth.admin.updateUserById(
        authData.user.id,
        {
          user_metadata: {
            tenant_id: tenantId,
            role: validatedData.role,
            email: validatedData.email
          }
        }
      )

      if (metadataError) {
        // Error updating user metadata
        // Don't fail registration for metadata update error
      }
    }

    return createSuccessResponse({
      success: true,
      message: 'Registration successful! Your account has been created and you can now sign in.',
      user: authData.user,
      company: {
        id: tenantId,
        name: validatedData.name,
        slug: companySlug,
      },
    })
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      error instanceof Error ? 400 : 500
    )
  }
}
