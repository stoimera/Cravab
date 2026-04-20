import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/service'


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, employees } = body

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    // Verify the tenant exists and is active
    const { data: tenant, error: tenantError } = await supabaseAdmin()
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('status', 'active')
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found or not active' },
        { status: 404 }
      )
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No employees to add'
      })
    }

    // Create users for each employee
    const createdUsers = []
    const errors = []

    for (const employee of employees) {
      try {
        // Generate temporary password
        const tempPassword = generateTemporaryPassword()
        
        // Create user in Supabase Auth
        const { data: userData, error: userError } = await supabaseAdmin().auth.admin.createUser({
          email: employee.email,
          password: tempPassword,
          email_confirm: false, // They'll need to confirm their email
          user_metadata: {
            tenant_id: tenantId,
            role: employee.role,
            name: employee.name
          }
        })

        if (userError) {
          errors.push(`Failed to create user ${employee.email}: ${userError.message}`)
          continue
        }

        // Create user record in users table
        const { error: userRecordError } = await supabaseAdmin()
          .from('users')
          .insert({
            id: userData.user.id,
            email: employee.email,
            tenant_id: tenantId,
            first_name: employee.first_name || 'Team',
            last_name: employee.last_name || 'Member',
            role: employee.role
          })

        if (userRecordError) {
          errors.push(`Failed to create user record for ${employee.email}: ${userRecordError.message}`)
          continue
        }

        createdUsers.push({
          name: employee.name,
          email: employee.email,
          role: employee.role,
          tempPassword: tempPassword
        })

        // TODO: Implement email invitation system

      } catch (error) {
        errors.push(`Error creating user ${employee.email}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdUsers.length} users`,
      createdUsers,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    logger.error('Error in team setup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
