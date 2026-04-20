import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/service'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { validateUserCreation, handleAuthError } from '@/lib/user-validation'
import { emailService } from '@/lib/email'
import { logger } from '@/lib/logger'
export async function GET() {
  try {
    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(new NextRequest('http://localhost'))
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult

    // Get user data to check role and get tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    // Check if user is admin
    if (!userData || userData.role !== 'admin') {
      return createErrorResponse('Forbidden', 403)
    }

    // Get all employees in the company
    const { data: employees, error } = await supabaseAdmin()
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        created_at
      `)
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      // Error fetching employees
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      )
    }

    // Format employee data
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
      email: emp.email,
      role: emp.role,
      status: 'active', // You might want to add a status field to the users table
      created_at: emp.created_at
    }))

    return NextResponse.json({ employees: formattedEmployees })

  } catch (error) {
    logger.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('=== EMPLOYEES API POST REQUEST START ===')
    
    // Verify user authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Authentication failed:', authError)
      return createErrorResponse('Unauthorized', 401)
    }
    
    logger.debug('User authenticated:', user.id)

    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return createErrorResponse('User not found', 404)
    }

    // Check if user is admin
    if (!userData || (userData as { role: string }).role !== 'admin') {
      return createErrorResponse('Forbidden', 403)
    }

    const body = await request.json()
    logger.debug('Request body received:', body)
    
    const { name, email, role, first_name, last_name } = body

    if (!name || !email || !role) {
      logger.error('Missing required fields:', { name, email, role })
      return createErrorResponse('Missing required fields: name, email, role', 400)
    }
    
    logger.debug('Required fields present:', { name, email, role })

    // Use provided first_name and last_name, or split name if not provided
    const firstName = first_name || name.trim().split(' ')[0] || ''
    const lastName = last_name || name.trim().split(' ').slice(1).join(' ') || 'User'
    
    logger.debug('Name processing debug:', { 
      originalName: name, 
      providedFirstName: first_name,
      providedLastName: last_name,
      finalFirstName: firstName, 
      finalLastName: lastName 
    })

    // Validate user creation data
    logger.debug('Validating user creation with data:', { 
      email, 
      first_name: firstName, 
      last_name: lastName,
      tenant_id: (userData as { tenant_id: string }).tenant_id
    })
    
    const validation = await validateUserCreation(supabaseAdmin(), { 
      email, 
      first_name: firstName, 
      last_name: lastName 
    }, (userData as { tenant_id: string }).tenant_id)
    
    if (!validation.isValid) {
      logger.error('User validation failed:', validation.error)
      return validation.error
    }
    
    logger.debug('User validation passed')

    // Generate temporary password
    const tempPassword = generateTemporaryPassword()

    // Create user in Supabase Auth
    logger.debug('Creating Supabase Auth user for:', email)
    const { data: newUser, error: userCreateError } = await supabaseAdmin().auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: false, // They'll need to confirm their email
      user_metadata: {
        tenant_id: (userData as { tenant_id: string }).tenant_id,
        role: role,
        name: name
      }
    })

    if (userCreateError) {
      logger.error('Supabase Auth user creation failed:', userCreateError)
      return handleAuthError(userCreateError)
    }
    
    logger.debug('Supabase Auth user created successfully:', newUser.user?.id)

    // Create user record in users table
    logger.debug('Creating user record in database with data:', {
      id: newUser.user.id,
      email: email,
      tenant_id: (userData as { tenant_id: string }).tenant_id,
      first_name: firstName,
      last_name: lastName,
      role: role
    })
    
    const { error: userRecordError } = await supabaseAdmin()
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        tenant_id: (userData as { tenant_id: string }).tenant_id,
        first_name: firstName,
        last_name: lastName,
        role: role
      })

    if (userRecordError) {
      logger.error('Database user record creation failed:', userRecordError)
      // Clean up auth user if database insert fails
      await supabaseAdmin().auth.admin.deleteUser(newUser.user.id)
      return createErrorResponse(`Failed to create user record: ${userRecordError.message}`, 500)
    }
    
    logger.debug('User record created successfully in database')

    // Send invitation email
    try {
      // Check if email service is configured
      if (!process.env.NEXT_RESEND_API_KEY) {
        logger.debug('Email service not configured - skipping invitation email')
        logger.debug('To enable email invitations, set NEXT_RESEND_API_KEY in your environment variables')
      } else {
        // Get company information for the email
        const { data: companyData } = await supabaseAdmin()
          .from('tenants')
          .select('name')
          .eq('id', (userData as { tenant_id: string }).tenant_id)
          .single()

        // Get inviter information
        const { data: inviterData } = await supabaseAdmin()
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
        
        await emailService.sendUserInvite({
          to: email,
          inviterName: `${inviterData?.first_name || ''} ${inviterData?.last_name || ''}`.trim() || 'Team Member',
          companyName: companyData?.name || 'Your Company',
          inviteLink,
          role: role.charAt(0).toUpperCase() + role.slice(1)
        })
        
        logger.debug('Invitation email sent successfully to:', email)
      }
    } catch (emailError) {
      logger.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email fails - user is already created
    }

    return createSuccessResponse({
      success: true,
      employee: {
        id: newUser.user.id,
        name: name,
        email: email,
        role: role
      }
    })

  } catch (error) {
    logger.error('Employees API error:', error)
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    })
  }
}

function generateTemporaryPassword(): string {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
