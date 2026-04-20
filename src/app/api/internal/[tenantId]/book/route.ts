import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();
    const { 
      client_phone, 
      client_name, 
      client_email, 
      client_address,
      starts_at, 
      duration_minutes = 60,
      service_type,
      notes,
      priority = 'normal'
    } = body;

    // Internal API - no authentication needed for testing

    // Validate required fields
    if (!client_phone || !starts_at) {
      return createSuccessResponse({ 
        error: 'Missing required fields: client_phone, starts_at' 
      }, 400);
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(client_phone.replace(/\D/g, ''))) {
      return createSuccessResponse({ 
        error: 'Invalid phone number format' 
      }, 400);
    }

    // Validate appointment time
    const appointmentTime = new Date(starts_at);
    if (isNaN(appointmentTime.getTime())) {
      return createSuccessResponse({ 
        error: 'Invalid appointment time format' 
      }, 400);
    }

    // Check if appointment is in the past
    if (appointmentTime < new Date()) {
      return createSuccessResponse({ 
        error: 'Cannot book appointments in the past' 
      }, 400);
    }

    // Validate tenant exists
    const supabaseAdmin = createAdminClient();
    
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Check if the requested time slot is available
    const endTime = new Date(appointmentTime);
    endTime.setMinutes(endTime.getMinutes() + duration_minutes);

    const { data: conflictingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('id, starts_at, ends_at')
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('starts_at', appointmentTime.toISOString())
      .lte('starts_at', endTime.toISOString());

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return createSuccessResponse({ 
        error: 'Time slot is no longer available',
        conflicting_appointments: conflictingAppointments.length
      }, 409);
    }

    // Find or create client
    let clientId: string;
    
    // First, try to find existing client by phone
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id, first_name, last_name, email, address')
      .eq('tenant_id', tenantId)
      .eq('phone', client_phone)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
      
      // Update client info if new information provided
      const updateData: any = {};
      if (client_name && client_name !== `${existingClient.first_name} ${existingClient.last_name}`.trim()) {
        const nameParts = client_name.split(' ');
        updateData.first_name = nameParts[0] || existingClient.first_name;
        updateData.last_name = nameParts.slice(1).join(' ') || existingClient.last_name;
      }
      if (client_email && client_email !== existingClient.email) {
        updateData.email = client_email;
      }
      if (client_address && client_address !== existingClient.address) {
        updateData.address = client_address;
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        await supabaseAdmin
          .from('clients')
          .update(updateData)
          .eq('id', clientId);
      }
    } else {
      // Create new client
      const nameParts = client_name ? client_name.split(' ') : ['Unknown', 'Client'];
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          tenant_id: tenantId,
          first_name: nameParts[0] || 'Unknown',
          last_name: nameParts.slice(1).join(' ') || 'Client',
          phone: client_phone,
          email: client_email || null,
          address: client_address || null,
          status: 'active'
        })
        .select('id')
        .single();

      if (clientError) {
        logger.error('Error creating client:', clientError);
        return createErrorResponse('Failed to create client', 500);
      }

      clientId = newClient.id;
    }

    // Find matching service if service_type provided
    let serviceId: string | null = null;
    if (service_type) {
      // For now, we'll just use the service_type as the title
      // In a real implementation, you'd have a services table
      serviceId = null;
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        service_id: serviceId,
        title: service_type || 'Service Appointment',
        description: notes || `Appointment booked via Vapi AI for ${client_name || 'client'}`,
        starts_at: appointmentTime.toISOString(),
        ends_at: endTime.toISOString(),
        duration_minutes: duration_minutes,
        status: 'scheduled',
        priority: priority,
        address: client_address || null,
        created_by: 'vapi_agent',
        notes: notes || null
      })
      .select(`
        id,
        title,
        starts_at,
        ends_at,
        duration_minutes,
        status,
        priority,
        clients!inner(
          id,
          first_name,
          last_name,
          phone,
          email,
          address
        )
      `)
      .single();

    if (appointmentError) {
      logger.error('Error creating appointment:', appointmentError);
      return createErrorResponse('Failed to create appointment', 500);
    }

    // Create notification for tenant users
    const { data: tenantUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'admin');

    if (tenantUsers && tenantUsers.length > 0) {
      const notifications = tenantUsers.map(user => ({
        tenant_id: tenantId,
        user_id: user.id,
        type: 'appointment' as const,
        title: 'New Appointment Booked',
        message: `New appointment booked for ${appointment.clients.first_name} ${appointment.clients.last_name} on ${new Date(appointment.starts_at).toLocaleDateString()}`,
        data: {
          appointment_id: appointment.id,
          client_phone: appointment.clients.phone,
          priority: appointment.priority
        }
      }));

      await supabaseAdmin
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        title: appointment.title,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        priority: appointment.priority,
        client: {
          id: appointment.clients.id,
          name: `${appointment.clients.first_name} ${appointment.clients.last_name}`,
          phone: appointment.clients.phone,
          email: appointment.clients.email,
          address: appointment.clients.address
        }
      },
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    logger.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
