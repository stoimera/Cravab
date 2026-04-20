/**
 * Script to create admin user for Car Detailing mock data
 * 
 * This script creates the auth user admin@example.com with password admin123
 * and links it to the Detail Armor tenant created by the migration.
 * 
 * Usage: node scripts/create-admin-user.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('Creating admin user...')

    // Step 1: Get the tenant ID for Detail Armor
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'detail-armor')
      .single()

    if (tenantError || !tenant) {
      console.error('Error finding tenant:', tenantError)
      console.log('Creating tenant first...')
      
      // Create tenant if it doesn't exist
      const { data: newTenant, error: createError } = await supabase
        .from('tenants')
        .insert({
          name: 'Detail Armor',
          slug: 'detail-armor',
          email: 'admin@example.com',
          phone: '+1-417-555-0100',
          address: '2805 W Silverleaf St, Springfield, MO 65807',
          timezone: 'America/Chicago',
          status: 'active',
          business_type: 'car detailing',
          business_hours: {
            monday: { open: '08:00', close: '17:00', closed: false },
            tuesday: { open: '08:00', close: '17:00', closed: false },
            wednesday: { open: '08:00', close: '17:00', closed: false },
            thursday: { open: '08:00', close: '17:00', closed: false },
            friday: { open: '08:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '15:00', closed: false },
            sunday: { closed: true }
          },
          base_address: '2805 W Silverleaf St, Springfield, MO 65807',
          service_area: 'Springfield, MO',
          service_radius: 25,
          subscription_active: true,
          subscription_plan: 'professional',
          onboarding_completed: true
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating tenant:', createError)
        throw createError
      }

      tenant = newTenant
      console.log('Tenant created:', tenant.id)
    }

    const tenantId = tenant.id
    console.log('Using tenant ID:', tenantId)

    // Step 2: Check if auth user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === 'admin@example.com')

    let authUserId

    if (existingUser) {
      console.log('Auth user already exists:', existingUser.id)
      authUserId = existingUser.id
    } else {
      // Step 3: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@example.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          tenant_id: tenantId,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw authError
      }

      authUserId = authData.user.id
      console.log('Auth user created:', authUserId)
    }

    // Step 4: Create/update user record in public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        tenant_id: tenantId,
        email: 'admin@example.com',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1-417-555-0100',
        title: 'Administrator',
        is_active: true,
        status: 'active',
        permissions: {
          can_manage_clients: true,
          can_manage_appointments: true,
          can_manage_services: true,
          can_manage_users: true,
          can_view_reports: true,
          can_manage_settings: true
        }
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      throw userError
    }

    console.log('\n✅ Admin user created successfully!')
    console.log('Email: admin@example.com')
    console.log('Password: admin123')
    console.log('Tenant: Detail Armor')
    console.log('User ID:', authUserId)
    console.log('\nYou can now log in with these credentials.')

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
