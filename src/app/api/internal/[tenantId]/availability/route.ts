import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';


import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const days = parseInt(searchParams.get('days') || '7');

    // Internal API - no authentication needed for testing

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

    // Default business hours (9 AM - 5 PM, Monday-Friday)
    const businessHours = {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true }
    };
    const timezone = 'America/New_York';

    // Calculate date range
    const startDate = date ? new Date(date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Get existing appointments in the date range
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('starts_at, ends_at, duration_minutes')
      .eq('tenant_id', tenantId)
      .gte('starts_at', startDate.toISOString())
      .lte('starts_at', endDate.toISOString())
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (appointmentsError) {
      logger.error('Error fetching appointments:', appointmentsError);
      return createErrorResponse('Failed to fetch appointments', 500);
    }

    // Generate available slots
    const slots = generateAvailableSlots(
      startDate,
      endDate,
      businessHours,
      appointments || [],
      timezone
    );

    return NextResponse.json({
      tenant_id: tenantId,
      tenant_name: tenant.name,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      timezone,
      slots: slots.filter(slot => slot.available),
      total_slots: slots.length,
      available_slots: slots.filter(slot => slot.available).length
    });

  } catch (error) {
    logger.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateAvailableSlots(
  startDate: Date,
  endDate: Date,
  businessHours: Record<string, any>,
  appointments: any[],
  timezone: string
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const slotDuration = 30; // 30-minute slots
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const dayName = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long' 
    }).toLowerCase();
    
    const dayHours = businessHours[dayName];
    
    // Skip if business is closed
    if (!dayHours || dayHours.closed) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
      continue;
    }

    // Parse business hours
    const openTime = parseTime(dayHours.open);
    const closeTime = parseTime(dayHours.close);
    
    if (!openTime || !closeTime) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
      continue;
    }

    // Generate slots for this day
    const dayStart = new Date(currentDate);
    dayStart.setHours(openTime.hours, openTime.minutes, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(closeTime.hours, closeTime.minutes, 0, 0);

    let slotTime = new Date(dayStart);
    
    while (slotTime < dayEnd) {
      const slotEnd = new Date(slotTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if slot is in the past
      const now = new Date();
      const isPast = slotTime < now;

      // Check if slot conflicts with existing appointments
      const hasConflict = appointments.some(apt => {
        const aptStart = new Date(apt.starts_at);
        const aptEnd = new Date(apt.ends_at || aptStart.getTime() + (apt.duration_minutes || 60) * 60000);
        
        return (slotTime < aptEnd && slotEnd > aptStart);
      });

      const available = !isPast && !hasConflict;
      
      slots.push({
        start: slotTime.toISOString(),
        end: slotEnd.toISOString(),
        available,
        reason: isPast ? 'Past time' : hasConflict ? 'Already booked' : undefined
      });

      slotTime.setMinutes(slotTime.getMinutes() + slotDuration);
    }

    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return slots;
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  return { hours, minutes };
}
