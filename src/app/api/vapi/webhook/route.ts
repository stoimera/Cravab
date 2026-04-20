import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { 
  validateParameters, 
  createSuccessResponse as createWebhookSuccessResponse, 
  createErrorResponse as createWebhookErrorResponse,
  safeInsert,
  safeUpdate,
  generateAvailabilitySlots,
  parseTimeString,
  parseBusinessHoursString,
  formatTimeForDisplay
} from '@/lib/webhook-utils'
import { parseRelativeDate, parseDateTimeString } from '@/lib/date-parsing'
import { ApiResponse, FunctionName } from '@/types/webhook'
import { mapVapiServiceToDbService } from '@/lib/service-mapping'
import { webhookCache } from '@/lib/cache/WebhookCache'
import { withErrorHandling, logError } from '@/lib/error-handler'
import { sanitizeInput } from '@/lib/validation'
import { withCors } from '@/lib/middleware/cors'
import { 
  createErrorResponse as createStandardErrorResponse,
  createSuccessResponse as createStandardSuccessResponse,
  logError as logStandardError
} from '@/lib/errors/standard-errors'
import { checkServiceArea } from '@/lib/service-area'
import { geocodeAddress } from '@/lib/geocoding/google-maps'
import { simplifiedCacheManager } from '@/lib/cache/SimplifiedCacheManager'
import { logger } from '@/lib/logger'


import { authenticateRequest, executeTenantQuery, createErrorResponse as createApiErrorResponse, createSuccessResponse as createApiSuccessResponse } from '@/lib/api-helpers'
import { tenantResolutionService } from '@/lib/tenant-resolution'
// Direct VAPI integration - webhook handles all function calls

// Map VAPI call status to database status
function mapVapiStatusToDbStatus(vapiStatus: string): 'in_progress' | 'started' | 'ringing' | 'completed' | 'failed' | 'busy' | 'no_answer' {
  const statusMap: Record<string, 'in_progress' | 'started' | 'ringing' | 'completed' | 'failed' | 'busy' | 'no_answer'> = {
    'queued': 'started',
    'ringing': 'ringing', 
    'in-progress': 'in_progress',
    'completed': 'completed',
    'ended': 'completed',  // VAPI sometimes sends 'ended' for completed calls
    'finished': 'completed',  // VAPI sometimes sends 'finished' for completed calls
    'failed': 'failed',
    'busy': 'busy',
    'no-answer': 'no_answer',
    'cancelled': 'failed'
  }
  
  return statusMap[vapiStatus] || 'completed'
}

// Service mapping is now imported from @/lib/service-mapping

/**
 * Get technician terminology based on business type
 * Returns appropriate term for the tenant's industry
 */
function getTechnicianTerm(businessType: string | null | undefined): string {
  if (!businessType) {
    return 'technician' // Default generic term
  }
  
  const businessTypeLower = businessType.toLowerCase()
  
  // Map business types to appropriate technician terminology
  const termMap: Record<string, string> = {
    'plumbing': 'plumber',
    'hvac': 'HVAC technician',
    'electrical': 'electrician',
    'landscaping': 'landscaper',
    'cleaning': 'cleaner',
    'carpentry': 'carpenter',
    'roofing': 'roofer',
    'painting': 'painter',
    'appliance': 'appliance technician',
    'locksmith': 'locksmith',
    'handyman': 'handyman',
    'car detailing': 'car detailer',
    'auto detailing': 'car detailer',
    'detailing': 'detailer',
    'car dealership': 'car dealer',
    'car dealer': 'car dealer',
    'dealership': 'dealer'
  }
  
  return termMap[businessTypeLower] || 'technician' // Fallback to generic
}

// Helper function to process function calls
async function processFunctionCall(functionName: string, parameters: any, tenantId: string, supabase: any): Promise<ApiResponse> {
  
  try {
    let functionResult: ApiResponse
    
    // Route to appropriate function handler
    if (functionName === 'getCurrentDate') {
      functionResult = await handleGetCurrentDate(tenantId, parameters, supabase)
    } else if (functionName === 'checkServiceArea') {
      functionResult = await handleCheckServiceArea(tenantId, parameters, supabase)
    } else if (functionName === 'findServiceForClient') {
      functionResult = await handleFindServiceForClient(tenantId, parameters, supabase)
    } else if (functionName === 'getPricingInfo' || functionName === 'getPricingDetails') {
      functionResult = await handleGetPricingInfo(tenantId, parameters, supabase)
    } else if (functionName === 'bookAppointment') {
      functionResult = await handleBookAppointment(tenantId, parameters, supabase)
    } else if (functionName === 'getServices') {
      functionResult = await handleGetServices(tenantId, parameters, supabase)
    } else if (functionName === 'getAvailability') {
      functionResult = await handleGetAvailability(tenantId, parameters, supabase)
    } else if (functionName === 'getBusinessHours') {
      functionResult = await handleGetBusinessHours(tenantId, parameters, supabase)
    } else if (functionName === 'createClient') {
      functionResult = await handleCreateClient(tenantId, parameters, supabase)
    } else if (functionName === 'lookupClient') {
      functionResult = await handleLookupClient(tenantId, parameters, supabase)
    } else if (functionName === 'getClientDetails') {
      functionResult = await handleGetClientDetails(tenantId, parameters, supabase)
    } else if (functionName === 'getPricing') {
      functionResult = await handleGetPricing(tenantId, parameters, supabase)
    } else if (functionName === 'createQuote') {
      functionResult = await handleCreateQuote(tenantId, parameters, supabase)
    } else if (functionName === 'rescheduleAppointment') {
      functionResult = await handleRescheduleAppointment(tenantId, parameters, supabase)
    } else if (functionName === 'cancelAppointment') {
      functionResult = await handleCancelAppointment(tenantId, parameters, supabase)
    } else if (functionName === 'updateAppointment') {
      functionResult = await handleUpdateAppointment(tenantId, parameters, supabase)
    } else if (functionName === 'getAppointments') {
      functionResult = await handleGetAppointments(tenantId, parameters, supabase)
    } else if (functionName === 'getClientAppointments') {
      functionResult = await handleGetClientAppointments(tenantId, parameters, supabase)
    } else if (functionName === 'updateClient') {
      functionResult = await handleUpdateClient(tenantId, parameters, supabase)
    } else if (functionName === 'getServiceKeywords') {
      functionResult = await handleGetServiceKeywords(tenantId, parameters, supabase)
    } else if (functionName === 'checkEmergencyRequest') {
      functionResult = await handleCheckEmergencyRequest(tenantId, parameters, supabase)
    } else if (functionName === 'checkServiceAvailability') {
      functionResult = await handleCheckServiceAvailability(tenantId, parameters, supabase)
    } else if (functionName === 'endCall') {
      functionResult = await handleEndCall(tenantId, parameters, supabase)
    } else {
      logger.error(`Unknown function: ${functionName}`)
      functionResult = createWebhookErrorResponse(`Unknown function: ${functionName}`)
    }
    
    
    // Store getCurrentDate result in call context for date parsing
    if (functionName === 'getCurrentDate' && functionResult.success && functionResult.data?.date) {
      // Note: This would need to be implemented with proper call context management
      // For now, the date parsing will use system date as fallback
    }
    
    return functionResult
    
  } catch (error) {
    logger.error(`Error processing function call ${functionName}:`, error)
    return createWebhookErrorResponse(`Error processing ${functionName}`, error instanceof Error ? error.message : 'Unknown error')
  }
}

// Helper function to handle call events and store in database
async function handleCallEvent(eventType: string, call: any, tenantId: string, supabase: any, transcriptText?: string, summaryText?: string) {
  try {
    
    if (!call?.id) {
      return
    }
    
    if (!tenantId) {
      return
    }

    // Check if call already exists
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('id, status')
      .eq('vapi_call_id', call.id)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error fetching existing call:', fetchError)
      return
    }

    // Get call context for client_id
    const callContext = await webhookCache.getCallContext(call.id, tenantId)
    
    // Ensure all required fields are properly set for database schema compliance
    const now = new Date().toISOString()
    // Full call data structure with all fields from schema
    const callData = {
      vapi_call_id: call.id,
      tenant_id: tenantId,
      client_id: callContext?.clientId || call.client_id || null,
      status: mapVapiStatusToDbStatus(call.status) || eventType,
      direction: (call.direction || 'inbound') as 'inbound' | 'outbound',
      from_number: call.customer?.number || call.from || 'unknown',
      to_number: call.assistant?.number || call.to || 'unknown',
      duration_seconds: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : null),
      transcript: transcriptText || call.transcript || '[No transcript available]',
      ai_sentiment: call.sentiment || null,
      ai_intent: call.intent || null,
      ai_summary: summaryText || call.summary || null,
      recording_url: call.recordingUrl || call.recording_url || null,
      follow_up_required: false,
      follow_up_reason: null,
      follow_up_notes: null,
      follow_up_urgency: 'standard',
      follow_up_callback_timeframe: 'within 4 hours',
      follow_up_completed_at: null,
      priority: call.priority || 'normal',
      metadata: call.metadata || {},
      started_at: call.startedAt || call.started_at || now,
      ended_at: call.endedAt || call.ended_at || now,
      updated_at: now,
      duration: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : 0),
      summary: summaryText || call.summary || null
    }

    // Validate required fields before database operation
    if (!callData.transcript || callData.transcript.trim() === '') {
      logger.warn('Warning: Empty transcript for call', call.id)
      callData.transcript = '[No transcript available]'
    }
    
    if (!callData.started_at) {
      logger.warn('Warning: Missing started_at for call', call.id)
      callData.started_at = now
    }
    
    if (!callData.ended_at) {
      logger.warn('Warning: Missing ended_at for call', call.id)
      callData.ended_at = now
    }


    // Retry logic for database operations
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
        if (existingCall) {
          // Update existing call
          const { error: updateError } = await supabase
            .from('calls')
            .update(callData)
            .eq('id', existingCall.id)
            .eq('tenant_id', tenantId)

          if (updateError) {
            logger.error(`Error updating call (attempt ${retryCount + 1}):`, updateError)
            if (retryCount === maxRetries - 1) {
              logger.error('Max retries reached for call update')
              return
            }
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
            continue
          } else {
            break
          }
        } else {
          // Create new call
          const { data: insertedCall, error: insertError } = await supabase
            .from('calls')
            .insert({
              ...callData,
              created_at: now
            })
            .select()

          if (insertError) {
            logger.error(`Error creating call (attempt ${retryCount + 1}):`, insertError)
            
            // If schema cache error, try with core fields only
            if (insertError.code === 'PGRST204') {
              const coreData = {
                vapi_call_id: call.id,
                tenant_id: tenantId,
                client_id: callContext?.clientId || null,
                status: mapVapiStatusToDbStatus(call.status) || eventType,
                direction: (call.direction || 'inbound') as 'inbound' | 'outbound',
                from_number: call.customer?.number || call.from || 'unknown',
                to_number: call.assistant?.number || call.to || 'unknown',
                duration_seconds: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : null),
                transcript: transcriptText || call.transcript || '[No transcript available]',
                ai_summary: summaryText || call.summary || null,
                recording_url: call.recordingUrl || call.recording_url || null,
                metadata: call.metadata || {},
                started_at: call.startedAt || call.started_at || now,
                ended_at: call.endedAt || call.ended_at || now,
                duration: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : 0),
                summary: summaryText || call.summary || null,
                created_at: now,
                updated_at: now
              }
              
              const { data: coreInsertedCall, error: coreError } = await supabase
                .from('calls')
                .insert(coreData)
                .select()
              
              if (coreError) {
                logger.error(`Core data insert also failed:`, coreError)
                if (retryCount === maxRetries - 1) {
                  logger.error('Max retries reached for call creation')
                  return
                }
              } else {
                break
              }
            }
            
            if (retryCount === maxRetries - 1) {
              logger.error('Max retries reached for call creation')
              return
            }
            retryCount++
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
            continue
          } else {
            break
          }
        }
      } catch (retryError) {
        logger.error(`Retry error (attempt ${retryCount + 1}):`, retryError)
        if (retryCount === maxRetries - 1) {
          logger.error('Max retries reached due to exception')
          return
        }
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
  } catch (error) {
    logger.error('Error in handleCallEvent:', error)
  }
}

// Enhanced function to check if follow-up is required
function checkFollowUpRequired(parameters: any, serviceData: any, tenant: any, transcriptText?: string): {
  required: boolean;
  reason: string;
  missingInfo: string[];
  aiAnalysis: string;
  urgency: 'emergency' | 'urgent' | 'standard';
  callbackTimeframe: string;
} {
  const missingInfo: string[] = []
  let reason = ''
  let aiAnalysis = ''
  let urgency: 'emergency' | 'urgent' | 'standard' = 'standard'
  let callbackTimeframe = 'within 4 hours'

  // Combine parameters and transcript for comprehensive analysis
  const fullText = [
    parameters.service_type || '',
    parameters.notes || '',
    parameters.description || '',
    transcriptText || ''
  ].join(' ').toLowerCase()

  // 1. Service Not Found - Client asks for service not in catalog
  if (parameters.service_type && (!serviceData || !serviceData.id)) {
    missingInfo.push(`Service "${parameters.service_type}" not found in our service catalog`)
    reason = 'Service not found in catalog - needs callback to discuss alternatives'
    urgency = 'standard'
    callbackTimeframe = 'within 2 hours'
  }

  // 2. Missing Pricing Information - Service exists but has no pricing
  if (serviceData && (!serviceData.price && !serviceData.base_price && !serviceData.hourly_rate)) {
    missingInfo.push(`Service "${serviceData.name}" has no pricing information`)
    reason = 'Service exists but pricing not available - needs callback with accurate quote'
    urgency = 'urgent'
    callbackTimeframe = 'within 30 minutes'
  }

  // 3. Emergency Outside Business Hours
  const isEmergency = parameters.priority === 'emergency' || 
    parameters.service_type?.toLowerCase().includes('emergency') ||
    fullText.includes('emergency') ||
    fullText.includes('urgent') ||
    fullText.includes('flooding') ||
    fullText.includes('burst') ||
    fullText.includes('leaking') ||
    fullText.includes('asap')

  if (isEmergency) {
    const now = new Date()
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const businessHours = tenant?.business_hours?.[dayName]
    
    if (businessHours?.closed || !businessHours) {
      missingInfo.push('Emergency service requested outside business hours')
      reason = 'Emergency service outside business hours - needs immediate callback'
      urgency = 'emergency'
      callbackTimeframe = 'within 10 minutes'
    }
  }

  // 4. Custom/Complex Work - Keywords for complex work
  const customWorkKeywords = [
    'custom', 'special', 'unusual', 'complex', 'renovation', 'remodel', 
    'commercial', 'large project', 'complete', 'comprehensive', 'extensive',
    'custom fixtures', 'specialty', 'unique', 'one-of-a-kind'
  ]

  const hasCustomWork = customWorkKeywords.some(keyword => fullText.includes(keyword))

  if (hasCustomWork) {
    missingInfo.push('Client described complex/custom work requiring special pricing')
    reason = 'Custom work requiring special pricing - needs callback with detailed quote'
    urgency = 'urgent'
    callbackTimeframe = 'within 1 hour'
  }

  // 5. Exact Pricing Requests - Keywords for exact pricing
  const exactPricingKeywords = [
    'exact price', 'exact cost', 'precise pricing', 'specific price', 
    'how much exactly', 'exact amount', 'precise cost', 'specific cost',
    'exact quote', 'precise quote', 'exact estimate'
  ]

  const wantsExactPricing = exactPricingKeywords.some(keyword => fullText.includes(keyword))

  if (wantsExactPricing) {
    missingInfo.push('Client requested exact pricing - needs callback with precise quote')
    reason = 'Exact pricing requested - needs callback with precise quote'
    urgency = 'urgent'
    callbackTimeframe = 'within 30 minutes'
  }

  // 6. Service Area Issues (if outside service area)
  if (parameters.address && parameters.serviceable === false) {
    missingInfo.push('Client outside service area - needs callback to discuss alternatives')
    reason = 'Outside service area - needs callback to discuss alternatives'
    urgency = 'standard'
    callbackTimeframe = 'within 2 hours'
  }

  // Generate AI analysis based on urgency and reason
  if (missingInfo.length > 0) {
    const urgencyText = urgency === 'emergency' ? 'IMMEDIATE' : 
                       urgency === 'urgent' ? 'URGENT' : 'STANDARD'
    
    aiAnalysis = `FOLLOW-UP REQUIRED (${urgencyText}): ${reason}. ` +
      `Missing information: ${missingInfo.join(', ')}. ` +
      `Recommended action: Call client back ${callbackTimeframe} to ${getRecommendedAction(reason)}. ` +
      `Client seems interested in ${parameters.service_type || 'our services'} and needs ${urgency} response.`
  }

  return {
    required: missingInfo.length > 0,
    reason,
    missingInfo,
    aiAnalysis,
    urgency,
    callbackTimeframe
  }
}

// Helper function to get recommended action based on reason
function getRecommendedAction(reason: string): string {
  if (reason.includes('Service not found')) {
    return 'discuss service alternatives and recommendations'
  } else if (reason.includes('pricing not available')) {
    return 'provide accurate pricing information'
  } else if (reason.includes('Emergency')) {
    return 'assess emergency situation and provide immediate service options'
  } else if (reason.includes('Custom work')) {
    return 'discuss project scope and provide detailed quote'
  } else if (reason.includes('Exact pricing')) {
    return 'provide precise pricing after assessment'
  } else if (reason.includes('Outside service area')) {
    return 'discuss alternatives or service area expansion'
  } else {
    return 'address their specific needs'
  }
}

// Enhanced appointment booking with business logic validation
async function handleAppointmentBooking(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    // Step 1: Get tenant data including timezone
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('business_hours, timezone')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return createWebhookErrorResponse('Tenant not found', tenantError?.message)
    }

    const tenantTimezone = tenant.timezone
    if (!tenantTimezone) {
      return createWebhookErrorResponse('Tenant timezone not configured', 'Please configure timezone in company settings')
    }
    
    // Step 2: Check availability for the requested time
    // Handle both parameter formats: starts_at or appointment_time
    const startsAtParam = parameters.starts_at || parameters.appointment_time
    const normalizedStartsAt = normalizeYearTo2025(startsAtParam)
    
    // PROPER TIMEZONE HANDLING: Store times in tenant timezone, not UTC
    let requestedTime: Date
    if (normalizedStartsAt.endsWith('Z')) {
      // Remove 'Z' and treat as tenant timezone - store as-is in tenant timezone
      const localTimeString = normalizedStartsAt.replace('Z', '')
      // Create date object - this will be stored in tenant timezone
      requestedTime = new Date(localTimeString)
    } else {
      // If no 'Z', assume it's already in the correct format
      requestedTime = new Date(normalizedStartsAt)
    }
    
    
    // Work directly in tenant's timezone - no conversions needed
    const businessDate = requestedTime.toLocaleDateString('en-CA') // YYYY-MM-DD format
    
    const availabilityResult = await handleGetAvailability(tenantId, {
      tenant_id: tenantId,
      date: businessDate,
      days: 1
    }, supabase)
    
    if (!availabilityResult.success) {
      return createWebhookErrorResponse('Unable to check availability', availabilityResult.details)
    }
    
    // Step 3: Validate the requested time is available
    const availability = availabilityResult.data?.availability || []
    
    // Work directly in tenant's timezone - no conversions needed
    const requestedDate = requestedTime.toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Convert to tenant timezone and extract hour and minute
    const tenantTime = new Date(requestedTime.toLocaleString('en-US', { timeZone: tenantTimezone }))
    const hour = tenantTime.getHours().toString().padStart(2, '0')
    const minute = tenantTime.getMinutes().toString().padStart(2, '0')
    const requestedTimeFormatted = `${hour}:${minute}`
    
    
    const isTimeAvailable = availability.some((day: any) => {
      if (day.date === requestedDate) {
        return day.times && day.times.includes(requestedTimeFormatted)
      }
      return false
    })
    
    if (!isTimeAvailable) {
      // Suggest alternative times
      const dayAvailability = availability.find((day: any) => day.date === requestedDate)
      const alternativeTimes = dayAvailability ? dayAvailability.times.slice(0, 3) : []
      
      
      return createWebhookErrorResponse('Requested time is not available', {
        message: 'Sorry, that time slot is not available.',
        alternative_times: alternativeTimes,
        available_times: dayAvailability ? dayAvailability.times : []
      })
    }
    
    // Step 4: Check if client exists
    let clientResult = null
    const phone = parameters.phone || parameters.client_phone
    if (phone) {
      clientResult = await handleLookupClient(tenantId, {
        tenant_id: tenantId,
        phone: phone
      }, supabase)
    }
    
    // Step 5: Check if we need to create a client
    let needsClientCreation = !clientResult || !clientResult.success || !clientResult.data?.clients || clientResult.data.clients.length === 0
    
    // Step 6: Get client ID
    let clientId: string
    if (!needsClientCreation && clientResult && clientResult.success && clientResult.data?.clients && clientResult.data.clients.length > 0) {
      clientId = clientResult.data.clients[0].id
    } else {
      // Parse client name from client_name parameter
      const clientName = parameters.client_name || `${parameters.first_name || ''} ${parameters.last_name || ''}`.trim()
      const nameParts = clientName.split(' ')
      const firstName = nameParts[0] || 'Unknown'
      const lastName = nameParts.slice(1).join(' ') || 'Client'
      
      const createClientResult = await handleCreateClient(tenantId, {
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: parameters.email || parameters.client_email,
        address: parameters.address || parameters.client_address,
        city: parameters.city,
        state: parameters.state,
        zip_code: parameters.zip_code
      }, supabase)
      
      if (!createClientResult.success) {
        return createWebhookErrorResponse('Failed to create client', createClientResult.details)
      }
      
      clientId = createClientResult.data?.client?.id
      if (!clientId) {
        return createWebhookErrorResponse('Failed to get client ID after creation')
      }
    }
    
    // Step 7: Get service ID - simplified approach
    let serviceId: string | null = null
    const serviceIdentifier = parameters.service_id || parameters.service_type
    if (serviceIdentifier) {
      
      // Map VAPI service name to database service name
      const mappedServiceName = mapVapiServiceToDbService(serviceIdentifier)
      
      // Simple search by name - if not found, continue without service
      const { data: service } = await supabase
        .from('services')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${mappedServiceName}%`)
        .single()
      
      if (service) {
        serviceId = service.id
      }
    }
    
    // Step 8: Create the appointment
    const appointmentData = {
      tenant_id: tenantId,
      client_id: clientId,
      service_id: serviceId,
      title: `Appointment for ${parameters.client_name || 'Client'}`,
      description: parameters.notes || 'Appointment booked via VAPI',
      starts_at: requestedTime.toISOString(),
      ends_at: new Date(requestedTime.getTime() + (parameters.duration_minutes || 60) * 60000).toISOString(),
      duration_minutes: parameters.duration_minutes || 60,
      status: 'scheduled',
      notes: parameters.notes,
      priority: 'normal',
      address: parameters.client_address || null,
      city: null,
      state: null,
      zip_code: null
    }
    
    // Insert appointment first without select to avoid PGRST116 errors
    const { data: insertedAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select('id')
      .single()
    
    if (insertError) {
      logger.error('Error inserting appointment:', insertError)
      logger.error('Insert error code:', insertError.code)
      logger.error('Insert error details:', insertError.details)
      logger.error('Insert error hint:', insertError.hint)
      return createWebhookErrorResponse('Failed to create appointment', insertError.message || insertError.details || 'Unknown error')
    }
    
    if (!insertedAppointment || !insertedAppointment.id) {
      logger.error('Appointment insert returned no data or ID')
      return createWebhookErrorResponse('Failed to create appointment', 'Insert succeeded but no appointment ID returned')
    }
    
    // Fetch the full appointment data separately
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, title, starts_at, ends_at, duration_minutes, client_id, service_id')
      .eq('id', insertedAppointment.id)
      .single()
    
    if (fetchError || !appointment) {
      logger.error('Error fetching created appointment:', fetchError)
      // Even if fetch fails, we have the ID, so return success with minimal data
      const appointmentWithDetails = {
        id: insertedAppointment.id,
        title: appointmentData.title,
        starts_at: appointmentData.starts_at,
        ends_at: appointmentData.ends_at,
        duration_minutes: appointmentData.duration_minutes
      }
      
      return createWebhookSuccessResponse({
        appointment: appointmentWithDetails,
        message: 'Appointment booked successfully',
        appointment_id: insertedAppointment.id,
        client_id: clientId,
        service_id: serviceId
      })
    }
    
    // Fetch related data separately to avoid join issues
    const appointmentWithDetails = { ...appointment }
    
    // Fetch client data if needed
    if (appointment.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('first_name, last_name, phone, email')
        .eq('id', appointment.client_id)
        .single()
      
      if (client) {
        appointmentWithDetails.clients = client
      }
    }
    
    // Fetch service data if needed
    if (appointment.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('name, description, base_price, hourly_rate')
        .eq('id', appointment.service_id)
        .single()
      
      if (service) {
        appointmentWithDetails.services = service
      }
    }
    
    
    // Invalidate all cache layers for appointments
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: appointment.id,
      warmCache: true
    })
    
    return createWebhookSuccessResponse({
      appointment: appointmentWithDetails,
      message: 'Appointment booked successfully',
      appointment_id: appointment.id,
      client_id: clientId,
      service_id: serviceId
    })
    
  } catch (error) {
    logger.error('Error in enhanced appointment booking:', error)
    return createWebhookErrorResponse('Appointment booking failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Helper function to normalize year to 2025
function normalizeYearTo2025(dateString: string): string {
  if (!dateString) return dateString
  
  // If the date contains 2023, 2024, or any other year, replace with 2025
  const yearPattern = /(20[0-9]{2})/
  if (yearPattern.test(dateString)) {
    return dateString.replace(yearPattern, '2025')
  }
  
  // If no year is specified, assume 2025
  if (dateString.match(/^\d{2}-\d{2}$/) || dateString.match(/^\d{1,2}\/\d{1,2}$/)) {
    return `2025-${dateString}`
  }
  
  return dateString
}

// Service mapping removed - using simplified direct search instead

// Production-ready Vapi webhook handler
async function webhookHandler(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    // Enhanced debugging for call storage issue
    

    // Enhanced debugging for validation issues
    if (body.messages && Array.isArray(body.messages)) {
      for (const msg of body.messages) {
        if (msg.role === 'tool_calls' && msg.toolCalls) {
          for (const toolCall of msg.toolCalls) {
          }
        }
      }
    }

    // Handle different VAPI webhook payload structures
    let type, call, message, transcript, messages
    
    
    // Extract transcript and summary from VAPI webhook payload
    let transcriptText = '[No transcript available]'
    let summaryText = null
    
    if (body.message?.analysis?.transcript) {
      transcriptText = body.message.analysis.transcript
    } else if (body.message?.transcript) {
      transcriptText = body.message.transcript
    } else if (body.call?.transcript) {
      transcriptText = body.call.transcript
    }
    
    if (body.message?.analysis?.summary) {
      summaryText = body.message.analysis.summary
    } else if (body.message?.summary) {
      summaryText = body.message.summary
    } else if (body.call?.summary) {
      summaryText = body.call.summary
    }
    
    // Initialize call ID from body (call object not yet extracted)
    const callId = (body.call as any)?.id || body.message?.callId || body.message?.call?.id || 'unknown'
    
    // Extract tenant ID from body sources (check multiple possible locations)
    let webhookTenantId = (body.call as any)?.metadata?.tenant_id ||
                         (body.message as any)?.tenant_id ||
                         (body.message as any)?.call?.metadata?.tenant_id ||
                         (body.metadata as any)?.tenant_id
    
    // If no tenant ID found, we'll need to determine it later
    if (!webhookTenantId) {
    }
    
    // Get or create call context
    let callContext = await webhookCache.getCallContext(callId, webhookTenantId)
    
    // Initialize additional context properties if not present
    // Note: CallContext interface only supports: tenantId, callId, clientId?, appointmentId?, serviceId?, metadata?, lastActivity
    
    
    // SIMPLIFIED WEBHOOK DETECTION - PRIORITY ORDER FOR PRODUCTION RELIABILITY
    
    
    // 1. Check for explicit type field first (most reliable)
    if (body.type) {
      type = body.type
      call = body.call
      transcript = body.transcript
      messages = body.messages || []
    }
    // 2. Check for end-of-call-report (special case - must come before general message check)
    else if (body.message && body.message.type === 'end-of-call-report') {
        type = 'end-of-call-report'
        call = body.message.call
        transcript = body.message.transcript
        messages = body.message.artifact?.messages || []
      }
    // 3. Check for nested message with type (VAPI message format)
    else if (body.message && body.message.type) {
      type = body.message.type
      call = body.message.call || body.call
      transcript = body.message.transcript || body.transcript
      messages = body.message.messages || body.messages || []
    }
    // 4. Check for call-log format (has messages array)
    else if (body.messages && Array.isArray(body.messages)) {
      type = 'call-log'
      call = body.call
      transcript = body.transcript
      messages = body.messages
    }
    // 5. Check for toolCalls in call object
    else if (body.call && body.call.toolCalls && Array.isArray(body.call.toolCalls)) {
      type = 'call-log'
      call = body.call
      transcript = body.transcript
      messages = []
    }
    // 6. Fallback for unknown formats
    else {
      logger.warn('WARNING: Unknown webhook format detected')
      
      type = 'unknown'
      call = body.call || body.message?.call
      transcript = body.transcript || body.message?.transcript
      messages = body.messages || body.message?.messages || []
      
    }

    if (!type) {
      return createWebhookSuccessResponse({ error: 'Missing webhook type' })
    }


    const supabase = createServiceClient()

    // Use centralized tenant resolution service
    const callData = {
      from_number: call?.from || call?.from_number || body.message?.from || body.message?.from_number,
      to_number: call?.assistant?.number || call?.to || call?.to_number,
      metadata: call?.metadata,
      customer: call?.customer,
      assistant: call?.assistant
    }

    // Use the tenant ID from webhook metadata (multi-tenant support)
    let tenantId = webhookTenantId
    
    // If no tenant ID found in webhook, try multiple strategies to get it
    if (!tenantId) {
      
      // Strategy 1: Look in function calls in messages
      if (messages && Array.isArray(messages)) {
        for (const message of messages) {
          if (message.role === 'tool_calls' && message.toolCalls) {
            for (const toolCall of message.toolCalls) {
              if (toolCall.type === 'function' && toolCall.function) {
                try {
                  const parameters = JSON.parse(toolCall.function.arguments)
                  if (parameters.tenant_id) {
                    tenantId = parameters.tenant_id
                    break
                  }
                } catch (error) {
                }
              }
            }
            if (tenantId) break
          }
        }
      }
      
      // Strategy 2: Look in call context if available
      if (!tenantId && callContext?.tenantId) {
        tenantId = callContext.tenantId
      }
      
      // Strategy 3: Look in assistant ID to tenant mapping (check multiple locations)
      if (!tenantId) {
        const assistantId = call?.assistantId || 
                           call?.assistant?.id || 
                           body.call?.assistantId ||
                           body.message?.call?.assistantId ||
                           body.assistantId
        
        if (assistantId) {
          try {
            const { data: tenantByAssistant, error: assistantError } = await supabase
              .from('tenants')
              .select('id, name')
              .eq('vapi_assistant_id', assistantId)
              .eq('status', 'active')
              .maybeSingle()
            
            if (!assistantError && tenantByAssistant) {
              tenantId = tenantByAssistant.id
              logger.debug(`Found tenant ${tenantId} via assistant ID ${assistantId}`)
            }
          } catch (error) {
            logger.error('Error looking up tenant by assistant ID:', error)
          }
        }
      }
    }
    
    // If still no tenant ID found, try to determine from call data
    if (!tenantId) {
      
      // Strategy 4: Try to extract from call metadata or assistant overrides
      if (call?.assistantOverrides?.clientMessages) {
        // This could contain tenant-specific configuration
      }
      
      // Strategy 5: Check if this is a test call (allow specific test tenant)
      if (call?.id && call.id.includes('test')) {
        try {
          const { data: testTenant, error: testError } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('name', 'Test Tenant')
            .eq('status', 'active')
            .single()
          
          if (!testError && testTenant) {
            tenantId = testTenant.id
          }
        } catch (error) {
          // Silent error - continue with other strategies
        }
      }
    }
    
    // Final validation: Ensure we have a valid tenant ID
    if (!tenantId) {
      logger.error('CRITICAL: No tenant ID found after all strategies!')
      logger.error('Webhook data analysis:', {
        hasWebhookTenantId: !!webhookTenantId,
        hasMessages: !!messages,
        messagesLength: messages?.length || 0,
        hasCallContext: !!callContext,
        hasAssistantId: !!call?.assistantId,
        callId: call?.id
      })
      
      // Log the webhook body for debugging (without sensitive data)
      logger.error('Webhook body structure:', {
        type: body.type,
        hasCall: !!body.call,
        hasMessage: !!body.message,
        hasMessages: !!body.messages,
        callId: body.call?.id || body.message?.callId || body.message?.call?.id,
        assistantId: body.call?.assistantId || body.call?.assistant?.id || body.message?.call?.assistantId || body.assistantId,
        callMetadata: body.call?.metadata,
        messageCallMetadata: body.message?.call?.metadata
      })
      
      return NextResponse.json({ 
        error: 'Unable to determine tenant ID for this webhook',
        details: 'No tenant ID found in webhook metadata, function calls, call context, or assistant mapping. This prevents data from being stored in the wrong tenant.',
        debug: {
          strategiesAttempted: ['webhook_metadata', 'function_calls', 'call_context', 'assistant_mapping', 'call_data_analysis'],
          webhookType: body.type,
          callId: call?.id
        }
      }, { status: 400 })
    }
    
    
    // Debug: Check if tenant exists
    const { data: tenantData, error: tenantCheckError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .eq('id', tenantId)
      .single()
    
    if (tenantCheckError) {
      logger.error('Tenant lookup failed:', tenantCheckError)
    }

    // Store context for subsequent tool calls
    const clientContext: { clientId?: string; clientPhone?: string } = {} // Store client info for subsequent calls
    const appointmentContext: { appointmentId?: string; appointmentStartsAt?: string } = {} // Store appointment info for subsequent calls
    const toolCallResults: Array<{ toolCallId: string; result?: any; error?: string }> = []

    // Note: end-of-call-report is processed in the switch statement below
    // It only stores call data, not tool calls


    // Process call events first before other logic
    if (type && type.startsWith('call-')) {
      
      await handleCallEvent(type.replace('call-', ''), call, tenantId, supabase, transcriptText, summaryText)
      
      // Skip the switch statement for call-* events to avoid duplicate processing
      return NextResponse.json({ success: true })
    }

    switch (type) {
      case 'webCall':
        await handleCallEvent('webCall', call, tenantId, supabase, transcriptText, summaryText)
        // CRITICAL FIX: Process function calls within webCall webhooks
        
        if (messages && Array.isArray(messages)) {
          for (const message of messages) {
            if (message.type === 'function-call' && message.functionCall) {
              
              const functionName = message.functionCall.name
              const parameters = message.functionCall.parameters || {}
              
              if (!functionName) {
                logger.error('No function name provided in webCall function call')
                continue
              }

              try {
                // Process the function call using the same logic as the function-call case
                let functionResult
                
                // Validate parameters first
                
                const validation = validateParameters(functionName as FunctionName, parameters)
                if (!validation.success) {
                  logger.error(`Validation failed for ${functionName}:`, validation.error)
                  logger.error('Validation details:', validation.details)
                }
                
                // Use validated parameters if validation passed, otherwise use original parameters
                let paramsToUse = validation.success ? validation.data : parameters
                
                // Extract tenant ID from function parameters (each function call includes its own tenant_id)
                // Use parameter tenant_id if provided, otherwise fallback to webhook tenantId
                const functionTenantId = paramsToUse.tenant_id || tenantId
                
                // Process the function call using the existing function handlers
                functionResult = await processFunctionCall(functionName, paramsToUse, functionTenantId, supabase)
                
                
                // Store function call result in cache for context
                if (call?.id) {
                  const existingContext = await webhookCache.getCallContext(call.id, tenantId)
                  webhookCache.updateCallContext(call.id, {
                    lastActivity: Date.now(),
                    metadata: {
                      ...existingContext?.metadata,
                      [`${functionName}_result`]: functionResult
                    }
                  })
                }
                
              } catch (error) {
                logger.error(`Error processing function call ${functionName}:`, error)
                logger.error('Function call error details:', JSON.stringify(error, null, 2))
              }
            }
          }
        }
        
        break

      case 'assistant-request':
        
        // Get tenant's assistant ID from database
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('vapi_assistant_id')
          .eq('id', tenantId)
          .single()
        
        if (tenantError || !tenant?.vapi_assistant_id) {
          logger.error('No VAPI assistant configured for tenant:', tenantId, tenantError)
          return NextResponse.json({ 
            error: 'No VAPI assistant configured for this tenant' 
          }, { status: 400 })
        }
        
        // CRITICAL: Return response immediately to avoid VAPI timeout (7.5 seconds)
        // Store call event asynchronously after response
        const assistantResponse = NextResponse.json({
          assistantId: tenant.vapi_assistant_id // Use tenant's configured assistant ID
        })
        
        // Store call event asynchronously (don't await)
        handleCallEvent('assistant-request', call, tenantId, supabase, transcriptText, summaryText)
          .catch(error => logger.error('Error processing assistant-request asynchronously:', error))
        
        return assistantResponse

      // Note: All call-* events are now processed above before the switch statement
      // to avoid duplicate call storage

      case 'message':
        
        // Store call data for message events
        if (call?.id) {
          await handleCallEvent('message', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'transcript':
        
        // Store call data for transcript events
        if (call?.id) {
          await handleCallEvent('transcript', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'metadata':
        
        // Store call data for metadata events
        if (call?.id) {
          await handleCallEvent('metadata', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'status-update':
        
        // Update existing call status and duration
        if (call?.id) {
          try {
            // First, try to update the existing call with new status and duration
            const { data: existingCall, error: fetchError } = await supabase
              .from('calls')
              .select('id, status, duration_seconds')
              .eq('vapi_call_id', call.id)
              .eq('tenant_id', tenantId)
              .single()

            if (existingCall && !fetchError) {
              // Update the existing call with new status and duration
              const updateData = {
                status: mapVapiStatusToDbStatus(call.status) || existingCall.status,
                duration_seconds: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : existingCall.duration_seconds),
                ended_at: call.endedAt || call.ended_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              }

              const { error: updateError } = await supabase
                .from('calls')
                .update(updateData)
                .eq('id', existingCall.id)
                .eq('tenant_id', tenantId)

              if (updateError) {
                logger.error('Error updating call status:', updateError)
              } else {
                logger.debug(`Call ${call.id} status updated to: ${updateData.status}, duration: ${updateData.duration_seconds}s`)
              }
            } else {
              // If no existing call found, create a new one
              await handleCallEvent('status-update', call, tenantId, supabase, transcriptText, summaryText)
            }
          } catch (error) {
            logger.error('Error in status-update handler:', error)
          }
        }
        break

      case 'tool-calls':
        
        // Process tool calls in real-time during the call
        if (body.toolCalls && Array.isArray(body.toolCalls)) {
          const toolCallResults = []
          const clientContext: { clientId?: string; clientPhone?: string } = {}
          const appointmentContext: { appointmentId?: string; appointmentStartsAt?: string } = {}
          
          for (const toolCall of body.toolCalls) {
            if (toolCall.type === 'function') {
              
              const functionName = toolCall.function.name
              try {
                const parameters = JSON.parse(toolCall.function.arguments)
                
                // Validate parameters
                const validation = validateParameters(functionName as FunctionName, parameters)
                const paramsToUse = validation.success ? validation.data : parameters
                // Use parameter tenant_id if provided, otherwise fallback to webhook tenantId
                const functionTenantId = paramsToUse.tenant_id || tenantId
                
                let result: ApiResponse
                
                // Execute the function
                if (functionName === 'createClient') {
                  result = await handleCreateClient(functionTenantId, paramsToUse, supabase)
                  if (result.success && result.data?.client) {
                    // Update call context
                    webhookCache.updateCallContext(callId, {
                      clientId: result.data.client.id,
                      tenantId: functionTenantId
                    })
                  }
                } else if (functionName === 'lookupClient') {
                  result = await handleLookupClient(functionTenantId, paramsToUse, supabase)
                  if (result.success && result.data?.clients?.length > 0) {
                    const client = result.data.clients[0]
                    // Update call context
                    webhookCache.updateCallContext(callId, {
                      clientId: client.id,
                      // Note: CallContext interface only supports: tenantId, callId, clientId?, appointmentId?, serviceId?, metadata?, lastActivity
                      tenantId: functionTenantId
                    })
                  }
                } else if (functionName === 'bookAppointment') {
                  let bookingParams = paramsToUse
                  if (callContext.clientId) {
                    bookingParams = { ...paramsToUse, client_id: callContext.clientId }
                  }
                  result = await handleBookAppointment(functionTenantId, bookingParams, supabase)
                  if (result.success && result.data?.appointment) {
                    // Update call context
                    webhookCache.updateCallContext(callId, {
                      appointmentId: result.data.appointment.id,
                      tenantId: functionTenantId
                    })
                  }
                } else if (functionName === 'getServices') {
                  result = await handleGetServices(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getAvailability') {
                  result = await handleGetAvailability(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getBusinessHours') {
                  result = await handleGetBusinessHours(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getClientDetails') {
                  result = await handleGetClientDetails(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'rescheduleAppointment') {
                  result = await handleRescheduleAppointment(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'cancelAppointment') {
                  result = await handleCancelAppointment(functionTenantId, paramsToUse, supabase)
                } else {
                  result = createWebhookErrorResponse(`Function ${functionName} not implemented`)
                }
                
                
                // Update call context with latest interaction
                webhookCache.updateCallContext(callId, {
                  lastActivity: Date.now()
                })
                
                // Store the result for VAPI
                toolCallResults.push({
                  toolCallId: toolCall.id,
                  result: result.success ? (result.data || 'Success') : result.error
                })
                
              } catch (error) {
                logger.error(`Error processing real-time function ${functionName}:`, error)
                toolCallResults.push({
                  toolCallId: toolCall.id,
                  error: error instanceof Error ? error.message : 'Unknown error'
                })
              }
            }
          }
          
          // Return the tool call results to VAPI
          return NextResponse.json({
            results: toolCallResults
          })
        }
        
        // Store call event (only if no return above)
        if (call?.id) {
          await handleCallEvent('tool-calls', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'tool-calls-result':
        // Store call event
        if (call?.id) {
          await handleCallEvent('tool-calls-result', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'tool.completed':
        // Store call event
        if (call?.id) {
          await handleCallEvent('tool.completed', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'transfer-update':
        // Store call event
        if (call?.id) {
          await handleCallEvent('transfer-update', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'user-interrupted':
        // Store call event
        if (call?.id) {
          await handleCallEvent('user-interrupted', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'hang':
        // Store call event
        if (call?.id) {
          await handleCallEvent('hang', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      case 'call-log':
        
        // Process the call log and extract function calls
        const toolCallResults = []
        const clientContext: { clientId?: string; clientPhone?: string } = {} // Store client info for subsequent calls
        const appointmentContext: { appointmentId?: string; appointmentStartsAt?: string } = {} // Store appointment info for subsequent calls
        
        // Check if we have toolCalls directly in the call object
        if (call && call.toolCalls && Array.isArray(call.toolCalls)) {
          for (const toolCall of call.toolCalls) {
            if (toolCall.type === 'function') {
              
              const functionName = toolCall.function.name
              try {
                const parameters = JSON.parse(toolCall.function.arguments)
                
                // Validate parameters first
                
                const validation = validateParameters(functionName as FunctionName, parameters)
                if (!validation.success) {
                  logger.error(`Validation failed for ${functionName}:`, validation.error)
                  logger.error('Validation details:', validation.details)
                  
                  // For now, let's continue with the original parameters if validation fails
                  // This is a temporary workaround while we debug the validation
                }
                
                // Process the function call directly
                let result: ApiResponse
                
                // Use validated parameters if validation passed, otherwise use original parameters
                const paramsToUse = validation.success ? validation.data : parameters
                
                // Extract tenant ID from function parameters (each function call includes its own tenant_id)
                // Use parameter tenant_id if provided, otherwise fallback to webhook tenantId
                const functionTenantId = paramsToUse.tenant_id || tenantId
                
                if (functionName === 'bookAppointment') {
                  
                  // Use stored client ID if available
                  let bookingParams = paramsToUse
                  if (clientContext.clientId) {
                    bookingParams = { ...paramsToUse, client_id: clientContext.clientId }
                  }
                  
                  result = await handleBookAppointment(functionTenantId, bookingParams, supabase)
                  
                  // Store appointment info for subsequent calls
                  if (result.success && result.data?.appointment) {
                    appointmentContext.appointmentId = result.data.appointment.id
                    appointmentContext.appointmentStartsAt = result.data.appointment.starts_at
                  }
                } else if (functionName === 'getServices') {
                  result = await handleGetServices(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getAvailability') {
                  result = await handleGetAvailability(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getBusinessHours') {
                  result = await handleGetBusinessHours(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'createClient') {
                  result = await handleCreateClient(functionTenantId, paramsToUse, supabase)
                  // Store client info for subsequent calls
                  if (result.success && result.data?.client) {
                    clientContext.clientId = result.data.client.id
                    clientContext.clientPhone = result.data.client.phone
                  }
                } else if (functionName === 'lookupClient') {
                  result = await handleLookupClient(functionTenantId, paramsToUse, supabase)
                  // Store client info if found
                  if (result.success && result.data?.clients?.length > 0) {
                    const client = result.data.clients[0]
                    clientContext.clientId = client.id
                    clientContext.clientPhone = client.phone
                  }
                } else if (functionName === 'getClientDetails') {
                  // Use stored client ID if available, otherwise use phone lookup
                  if (clientContext.clientId) {
                    const clientDetailsParams = { ...paramsToUse, client_id: clientContext.clientId }
                    result = await handleGetClientDetails(functionTenantId, clientDetailsParams, supabase)
                  } else {
                    result = await handleGetClientDetails(functionTenantId, paramsToUse, supabase)
                  }
                } else if (functionName === 'getPricing') {
                  result = await handleGetPricing(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'checkServiceArea') {
                  result = await handleCheckServiceArea(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'createQuote') {
                  result = await handleCreateQuote(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'updateAppointment') {
                  result = await handleUpdateAppointment(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'cancelAppointment') {
                  result = await handleCancelAppointment(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'rescheduleAppointment') {
                  // Use stored appointment ID if available
                  let rescheduleParams = paramsToUse
                  if (appointmentContext.appointmentId) {
                    rescheduleParams = { ...paramsToUse, appointment_id: appointmentContext.appointmentId }
                  }
                  result = await handleRescheduleAppointment(functionTenantId, rescheduleParams, supabase)
                } else if (functionName === 'endCall') {
                  result = await handleEndCall(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'findServiceForClient') {
                  result = await handleFindServiceForClient(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getServiceKeywords') {
                  result = await handleGetServiceKeywords(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getCurrentDate') {
                  result = await handleGetCurrentDate(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getPricingInfo') {
                  result = await handleGetPricingInfo(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getAppointments') {
                  result = await handleGetAppointments(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'getClientAppointments') {
                  result = await handleGetClientAppointments(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'updateClient') {
                  result = await handleUpdateClient(functionTenantId, paramsToUse, supabase)
                } else if (functionName === 'checkServiceAvailability') {
                  result = await handleCheckServiceAvailability(functionTenantId, paramsToUse, supabase)
                } else {
                  // Function not implemented
                  result = createWebhookErrorResponse(`Function ${functionName} not implemented`)
                }
                
                
                // Store the result for this tool call
                if (result.success) {
                  toolCallResults.push({
                    toolCallId: toolCall.id,
                    result: result.data || 'Success'
                  })
                } else {
                  toolCallResults.push({
                    toolCallId: toolCall.id,
                    error: result.error || 'Unknown error'
                  })
                  logger.error(`Function ${functionName} failed:`, result.error)
                }
                
                // Log the function result for debugging
                
              } catch (error) {
                logger.error(`Error processing function ${functionName}:`, error)
                toolCallResults.push({
                  toolCallId: toolCall.id,
                  error: error instanceof Error ? error.message : 'Unknown error'
                })
              }
            }
          }
        } else if (messages && Array.isArray(messages)) {
          
          for (const msg of messages) {
            if (msg.role === 'tool_calls' && msg.toolCalls) {
              for (const toolCall of msg.toolCalls) {
                if (toolCall.type === 'function') {
                  
                  try {
                    const parameters = JSON.parse(toolCall.function.arguments)
                    const functionName = toolCall.function.name
                    
                    // Validate parameters first
                    logger.debug(`=== VALIDATING ${functionName} ===`)
                    logger.debug('Parameters to validate:', JSON.stringify(parameters, null, 2))
                    
                    const validation = validateParameters(functionName as FunctionName, parameters)
                    if (!validation.success) {
                      logger.error(`Validation failed for ${functionName}:`, validation.error)
                      logger.error('Validation details:', validation.details)
                      
                      // For now, let's continue with the original parameters if validation fails
                      // This is a temporary workaround while we debug the validation
                    }
                    
                    // Process the function call directly
                    let result: ApiResponse
                    
                    // Use validated parameters if validation passed, otherwise use original parameters
                    const paramsToUse = validation.success ? validation.data : parameters

                    // Extract tenant ID from function parameters (each function call includes its own tenant_id)
                    // For bookAppointment, always use metadata tenantId to prevent mismatches
                    const functionTenantId = (functionName === 'bookAppointment') ? tenantId : (paramsToUse.tenant_id || tenantId)

                    if (functionName === 'bookAppointment') {
                      logger.debug('=== CALLING handleBookAppointment ===')
                      logger.debug('Tenant ID:', functionTenantId)
                      logger.debug('Parameters:', JSON.stringify(paramsToUse, null, 2))
                      logger.debug('Client context:', clientContext)
                      
                      // Use stored client ID if available
                      let bookingParams = paramsToUse
                      if (clientContext.clientId) {
                        bookingParams = { ...paramsToUse, client_id: clientContext.clientId }
                      }
                      
                      result = await handleBookAppointment(functionTenantId, bookingParams, supabase)
                      logger.debug('=== handleAppointmentBooking RESULT ===')
                      logger.debug('Result:', JSON.stringify(result, null, 2))
                      
                      // Store appointment info for subsequent calls
                      if (result.success && result.data?.appointment) {
                        appointmentContext.appointmentId = result.data.appointment.id
                        appointmentContext.appointmentStartsAt = result.data.appointment.starts_at
                      }
                    } else if (functionName === 'getServices') {
                      result = await handleGetServices(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'getAvailability') {
                      result = await handleGetAvailability(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'getBusinessHours') {
                      result = await handleGetBusinessHours(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'createClient') {
                      result = await handleCreateClient(functionTenantId, paramsToUse, supabase)
                      // Store client info for subsequent calls
                      if (result.success && result.data?.client) {
                        clientContext.clientId = result.data.client.id
                        clientContext.clientPhone = result.data.client.phone
                      }
                    } else if (functionName === 'lookupClient') {
                      result = await handleLookupClient(functionTenantId, paramsToUse, supabase)
                      // Store client info if found
                      if (result.success && result.data?.clients?.length > 0) {
                        const client = result.data.clients[0]
                        clientContext.clientId = client.id
                        clientContext.clientPhone = client.phone
                      }
                    } else if (functionName === 'getClientDetails') {
                      // Use stored client ID if available, otherwise use phone lookup
                      if (clientContext.clientId) {
                        const clientDetailsParams = { ...paramsToUse, client_id: clientContext.clientId }
                        result = await handleGetClientDetails(functionTenantId, clientDetailsParams, supabase)
                      } else {
                        result = await handleGetClientDetails(functionTenantId, paramsToUse, supabase)
                      }
                    } else if (functionName === 'getPricing') {
                      result = await handleGetPricing(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'checkServiceArea') {
                      result = await handleCheckServiceArea(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'createQuote') {
                      result = await handleCreateQuote(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'updateAppointment') {
                      result = await handleUpdateAppointment(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'cancelAppointment') {
                      result = await handleCancelAppointment(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'rescheduleAppointment') {
                      // Use stored appointment ID if available
                      let rescheduleParams = paramsToUse
                      if (appointmentContext.appointmentId) {
                        rescheduleParams = { ...paramsToUse, appointment_id: appointmentContext.appointmentId }
                      }
                      result = await handleRescheduleAppointment(functionTenantId, rescheduleParams, supabase)
                    } else if (functionName === 'endCall') {
                      result = await handleEndCall(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'findServiceForClient') {
                      result = await handleFindServiceForClient(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'getServiceKeywords') {
                      result = await handleGetServiceKeywords(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'getCurrentDate') {
                      result = await handleGetCurrentDate(functionTenantId, paramsToUse, supabase)
                    } else if (functionName === 'getPricingInfo') {
                      result = await handleGetPricingInfo(functionTenantId, paramsToUse, supabase)
                    } else {
                      // Function not implemented
                      result = createWebhookErrorResponse(`Function ${functionName} not implemented`)
                    }
                    
                    
                    // Store the result for this tool call
                    if (result.success) {
                      toolCallResults.push({
                        toolCallId: toolCall.id,
                        result: result.data || 'Success'
                      })
                    } else {
                      toolCallResults.push({
                        toolCallId: toolCall.id,
                        error: result.error || 'Unknown error'
                      })
                      logger.error(`Function ${functionName} failed:`, result.error)
                    }
                    
                    // Log the function result for debugging
                    
                  } catch (error) {
                    logger.error(`Error processing function call ${toolCall.function.name}:`, error)
                    toolCallResults.push({
                      toolCallId: toolCall.id,
                      error: error instanceof Error ? error.message : 'Unknown error'
                    })
                  }
                }
              }
            }
          }
          
          // Return results in VAPI's expected format
          if (toolCallResults.length > 0) {
            return NextResponse.json({ results: toolCallResults })
          } else {
            return NextResponse.json({ success: true })
          }
        }
        
        // Store the call data
        if (call?.id) {
          try {
            // Try to find the client by phone number if available
            let clientId = null
            const phoneNumber = call.customer?.number || call.from
            if (phoneNumber) {
              const { data: clientData } = await supabase
                .from('clients')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('phone', phoneNumber)
                .single()
              clientId = clientData?.id || null
            }

            const callData = {
              tenant_id: tenantId,
              client_id: clientId,
              vapi_call_id: call.id,
              direction: 'inbound' as const,
              from_number: call.customer?.number || call.from || 'unknown',
              to_number: call.assistant?.number || call.to || 'unknown',
              status: mapVapiStatusToDbStatus(call.status) || 'completed' as const,
              duration_seconds: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : null),
              transcript: transcriptText, // Use extracted transcript
              ai_summary: summaryText, // Use extracted summary
              recording_url: call.recordingUrl || call.recording_url || null,
              started_at: call.startedAt || call.createdAt || new Date().toISOString(),
              ended_at: call.endedAt || new Date().toISOString(),
              metadata: {
                cost: call.cost || 0,
                model: call.assistant?.model || 'unknown',
                voice: call.assistant?.voice || 'unknown',
                webhook_source: 'call-start',
                vapi_call_data: call
              }
            }

            
            const { data: insertedCall, error: callError } = await supabase
              .from('calls')
              .insert(callData)
              .select()

            if (callError) {
              logger.error('Error storing call data:', callError)
              logger.error('Call data that failed:', JSON.stringify(callData, null, 2))
            }
          } catch (error) {
            logger.error('Error processing call log data:', error)
          }
        }
        break

      // Note: call-end is processed above with other call-* events

      case 'function-call':
        
        const functionName = body.message?.functionCall?.name
        const parameters = body.message?.functionCall?.parameters || {}
        
        
        if (!functionName) {
          return NextResponse.json({ 
            message: 'No function name provided',
            functionCall: {
              name: 'error',
              parameters: { error: 'No function name provided' }
            }
          })
        }

        try {
          // Enhanced business logic for all function calls
          let functionResult
          
          // Validate parameters first
          logger.debug(`=== VALIDATING ${functionName} ===`)
          logger.debug('Parameters to validate:', JSON.stringify(parameters, null, 2))
          
          const validation = validateParameters(functionName as FunctionName, parameters)
          if (!validation.success) {
            logger.error(`Validation failed for ${functionName}:`, validation.error)
            logger.error('Validation details:', validation.details)
            logger.debug('Continuing with original parameters due to validation failure')
          } else {
            logger.debug(`Validation passed for ${functionName}`)
          }
          
          // Use validated parameters if validation passed, otherwise use original parameters
          let paramsToUse = validation.success ? validation.data : parameters

          // Extract tenant ID from function parameters (each function call includes its own tenant_id)
          // Use parameter tenant_id if provided, otherwise fallback to webhook tenantId
          const functionTenantId = paramsToUse.tenant_id || tenantId
          
          if (functionName === 'bookAppointment') {
            logger.debug('=== PROCESSING bookAppointment FUNCTION CALL ===')
            logger.debug('Function tenant ID:', functionTenantId)
            logger.debug('Webhook tenant ID:', tenantId)
            logger.debug('Parameters:', JSON.stringify(paramsToUse, null, 2))
          }

          // Map VAPI parameters to expected function parameters
          if (functionName === 'bookAppointment') {
            
            // Map VAPI appointment booking parameters to expected format
            paramsToUse = {
              ...paramsToUse,
              client_phone: paramsToUse.client_phone || paramsToUse.phone,
              client_name: paramsToUse.client_name || `${paramsToUse.first_name || ''} ${paramsToUse.last_name || ''}`.trim(),
              client_email: paramsToUse.client_email || paramsToUse.email,
              client_address: paramsToUse.client_address || paramsToUse.address,
              starts_at: paramsToUse.starts_at || (paramsToUse.date && paramsToUse.time ? `${paramsToUse.date}T${paramsToUse.time}:00` : undefined) || (paramsToUse.date ? `${paramsToUse.date}T09:00:00` : undefined),
              service_type: paramsToUse.service_type || paramsToUse.service_id,
              notes: paramsToUse.notes || paramsToUse.description
            }
            
            // If we have a date string that needs parsing, parse it here
            if (paramsToUse.starts_at && typeof paramsToUse.starts_at === 'string' && !paramsToUse.starts_at.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              try {
                const { parseDateTimeString } = await import('@/lib/date-parsing')
                const parsed = parseDateTimeString(paramsToUse.starts_at, 'America/Chicago') // Default to Chicago timezone
                if (parsed.date) {
                  const timeStr = parsed.time || '09:00'
                  paramsToUse.starts_at = `${parsed.date}T${timeStr}:00`
                }
              } catch (error) {
                logger.error('Error parsing date:', error)
              }
            }
            
            // Enhanced date validation and logging
            if (paramsToUse.starts_at && typeof paramsToUse.starts_at === 'string') {
              const dateStr = paramsToUse.starts_at
              
              
              // Validate ISO format
              const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
              if (!isoFormat.test(dateStr)) {
                return createWebhookErrorResponse('Invalid date format. Expected ISO format: YYYY-MM-DDTHH:MM:SS')
              }
              
              // Parse and validate the date
              const appointmentDate = new Date(dateStr)
              if (isNaN(appointmentDate.getTime())) {
                logger.debug('ERROR: Invalid date - cannot parse')
                return createWebhookErrorResponse('Invalid date - cannot parse the provided date')
              }
              
              // Validate year is 2025
              if (appointmentDate.getFullYear() !== 2025) {
                logger.debug('ERROR: Date is not in year 2025')
                logger.debug('Received year:', appointmentDate.getFullYear())
                return createWebhookErrorResponse('Appointments must be scheduled in 2025')
              }
              
              // Validate date is not in the past
              const now = new Date()
              if (appointmentDate < now) {
                logger.debug('ERROR: Date is in the past')
                logger.debug('Appointment date:', appointmentDate.toISOString())
                logger.debug('Current date:', now.toISOString())
                return createWebhookErrorResponse('Cannot schedule appointments in the past')
              }
              
              // Validate reasonable date range (not too far in future)
              const maxDate = new Date('2025-12-31T23:59:59')
              if (appointmentDate > maxDate) {
                logger.debug('ERROR: Date is too far in the future')
                logger.debug('Appointment date:', appointmentDate.toISOString())
                logger.debug('Max allowed date:', maxDate.toISOString())
                return createWebhookErrorResponse('Cannot schedule appointments beyond 2025')
              }
              
              // Validate time is reasonable (0-23 hours, 0-59 minutes)
              const hours = appointmentDate.getHours()
              const minutes = appointmentDate.getMinutes()
              if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                logger.debug('ERROR: Invalid time')
                logger.debug('Hours:', hours, 'Minutes:', minutes)
                return createWebhookErrorResponse('Invalid time format')
              }
              
              logger.debug('Date validation passed')
              logger.debug('Appointment date:', appointmentDate.toISOString())
              logger.debug('Year:', appointmentDate.getFullYear())
              logger.debug('Month:', appointmentDate.getMonth() + 1)
              logger.debug('Day:', appointmentDate.getDate())
              logger.debug('Hour:', appointmentDate.getHours())
              logger.debug('Minute:', appointmentDate.getMinutes())
              logger.debug('========================')
            }
            
            // Log final processed date
            logger.debug('Final processed starts_at:', paramsToUse.starts_at)
            
            // Convert service_type string to service_id UUID if needed
            if (paramsToUse.service_type && typeof paramsToUse.service_type === 'string' && !paramsToUse.service_type.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              // This is a service name/type string, not a UUID - we'll handle this in the booking function
              logger.debug('Service type is string, will map to UUID in booking function:', paramsToUse.service_type)
            }
            
            logger.debug('After initial mapping:', JSON.stringify(paramsToUse, null, 2))
            
            // If we have client_id but no client_phone, we need to fetch the client details
            logger.debug('Checking client_id:', paramsToUse.client_id, 'client_phone:', paramsToUse.client_phone)
            if (paramsToUse.client_id) {
              try {
                logger.debug('=== FETCHING CLIENT DETAILS ===')
                logger.debug('client_id:', paramsToUse.client_id)
                logger.debug('functionTenantId:', functionTenantId)
                
                const { data: clientData, error: clientError } = await supabase
                  .from('clients')
                  .select('phone, first_name, last_name, email, address')
                  .eq('id', paramsToUse.client_id)
                  .eq('tenant_id', functionTenantId)
                  .single()
                
                logger.debug('Client query result:', { clientData, clientError })
                
                if (clientData && !clientError) {
                  paramsToUse.client_phone = clientData.phone
                  paramsToUse.client_name = `${clientData.first_name} ${clientData.last_name}`.trim()
                  paramsToUse.client_email = clientData.email
                  paramsToUse.client_address = clientData.address
                  logger.debug('Successfully fetched client details:', clientData)
                } else {
                  logger.error('Error fetching client details:', clientError)
                  // If client lookup fails, we cannot proceed with a hardcoded phone number
                  // This would break multi-tenancy. Return an error instead.
                  logger.debug('Client lookup failed - cannot proceed without valid client data')
                  return createWebhookErrorResponse(
                    'Client not found',
                    'The specified client ID does not exist or could not be retrieved'
                  )
                }
              } catch (error) {
                logger.error('Error fetching client details:', error)
              }
            }
            
            logger.debug('Mapped bookAppointment parameters:', JSON.stringify(paramsToUse, null, 2))
          } else if (functionName === 'createClient') {
            // Map VAPI client creation parameters to expected format
            paramsToUse = {
              ...paramsToUse,
              first_name: paramsToUse.first_name || (paramsToUse.name ? paramsToUse.name.split(' ')[0] : undefined),
              last_name: paramsToUse.last_name || (paramsToUse.name ? paramsToUse.name.split(' ').slice(1).join(' ') : undefined),
              phone: paramsToUse.phone || paramsToUse.client_phone,
              email: paramsToUse.email || paramsToUse.client_email,
              address: paramsToUse.address || paramsToUse.client_address
            }
            logger.debug('Mapped createClient parameters:', JSON.stringify(paramsToUse, null, 2))
          } else if (functionName === 'lookupClient') {
            // Map VAPI client lookup parameters to expected format
            paramsToUse = {
              ...paramsToUse,
              phone: paramsToUse.phone || paramsToUse.client_phone,
              email: paramsToUse.email || paramsToUse.client_email,
              name: paramsToUse.name || paramsToUse.client_name || `${paramsToUse.first_name || ''} ${paramsToUse.last_name || ''}`.trim()
            }
            logger.debug('Mapped lookupClient parameters:', JSON.stringify(paramsToUse, null, 2))
          }
          
          // Use the centralized processFunctionCall function for consistency
          functionResult = await processFunctionCall(functionName, paramsToUse, functionTenantId, supabase)
          
          logger.debug(`=== FUNCTION EXECUTION RESULT ===`)
          logger.debug(`Tool: ${functionName}`)
          logger.debug(`Result:`, JSON.stringify(functionResult, null, 2))
          logger.debug(`=================================`)
          
          return NextResponse.json({
            message: `Tool ${functionName} executed successfully`,
            functionCall: {
              name: functionName,
              parameters: functionResult
            }
          })
        } catch (error) {
          logger.error(`Error executing tool ${functionName}:`, error)
          return NextResponse.json({
            message: `Sorry, I had trouble processing your request. Please try again.`,
            functionCall: {
              name: functionName,
              parameters: { error: 'Tool execution failed' }
            }
          })
        }
        
        // Store the call data after processing function calls
        if (call?.id) {
          logger.debug('=== STORING CALL DATA FROM CALL-LOG ===')
          logger.debug('Call ID:', call.id)
          logger.debug('Tenant ID:', tenantId)
          
          // Extract transcript and summary from the call log
          const transcriptText = messages?.map((msg: any) => {
            if (msg.role === 'user' || msg.role === 'bot') {
              return `${msg.role}: ${msg.message || ''}`
            }
            return ''
          }).filter(Boolean).join('\n') || ''
          
          const summaryText = body.message?.analysis?.summary || ''
          
          logger.debug('Transcript length:', transcriptText.length)
          logger.debug('Summary length:', summaryText.length)
          
          // Store the call using handleCallEvent
          logger.debug('About to call handleCallEvent with:')
          logger.debug('- Event type: completed')
          logger.debug('- Call ID:', call.id)
          logger.debug('- Tenant ID:', tenantId)
          logger.debug('- Transcript length:', transcriptText.length)
          logger.debug('- Summary length:', summaryText.length)
          
          try {
          await handleCallEvent('completed', call, tenantId, supabase, transcriptText, summaryText)
          logger.debug('Call data stored successfully from call-log')
          } catch (error) {
            logger.error('Error storing call data from call-log:', error)
          }
        }

        // Store call event for function-call webhooks
        if (call?.id) {
          await handleCallEvent('function-call', call, tenantId, supabase, transcriptText, summaryText)
        }

        // Return the tool call results
        return NextResponse.json({
          success: true,
          message: 'Tool calls processed successfully',
          results: toolCallResults
        })

      case 'end-of-call-report':
        logger.debug('End of call report received for call:', call?.id)
        logger.debug('Call object:', JSON.stringify(call, null, 2))
        logger.debug('Call ID exists:', !!call?.id)
        logger.debug('Body message:', JSON.stringify(body.message, null, 2))
        
        // CRITICAL FIX: Process function calls in end-of-call-report
        logger.debug('=== PROCESSING FUNCTION CALLS IN END-OF-CALL-REPORT ===')
        logger.debug('Messages array length:', messages?.length || 0)
        logger.debug('Messages:', JSON.stringify(messages, null, 2))
        
        if (messages && Array.isArray(messages)) {
          for (const message of messages) {
            // Handle both function-call format and tool_calls format
            if ((message.type === 'function-call' && message.functionCall) || 
                (message.role === 'tool_calls' && message.toolCalls)) {
              
              logger.debug('=== PROCESSING FUNCTION CALL FROM END-OF-CALL-REPORT ===')
              
              // Handle tool_calls format (from VAPI)
              if (message.role === 'tool_calls' && message.toolCalls) {
                for (const toolCall of message.toolCalls) {
                  if (toolCall.type === 'function' && toolCall.function) {
                    logger.debug('Function name:', toolCall.function.name)
                    logger.debug('Parameters:', toolCall.function.arguments)
                    
                    const functionName = toolCall.function.name
                    let parameters = {}
                    
                    try {
                      parameters = JSON.parse(toolCall.function.arguments)
                    } catch (error) {
                      logger.error('Error parsing function arguments:', error)
                      continue
                    }
                    
                    // Use tenant_id from function parameters if available, otherwise use webhook tenant
                    const functionTenantId = (parameters as any).tenant_id || tenantId
                    
                    try {
                      const functionResult = await processFunctionCall(functionName, parameters, functionTenantId, supabase)
                      
                      if (!functionResult.success) {
                        logger.error(`Function ${functionName} failed in end-of-call-report:`, functionResult.error)
                        logger.error('Error details:', functionResult.details)
                      } else {
                        logger.debug(`Function ${functionName} succeeded in end-of-call-report`)
                      }
                    } catch (error) {
                      logger.error(`Error processing ${functionName} in end-of-call-report:`, error)
                    }
                  }
                }
                continue
              }
              
              // Handle function-call format (legacy)
              logger.debug('Function name:', message.functionCall.name)
              logger.debug('Parameters:', JSON.stringify(message.functionCall.parameters, null, 2))
              
              const functionName = message.functionCall.name
              const parameters = message.functionCall.parameters || {}
              
              if (!functionName) {
                logger.error('No function name provided in end-of-call-report function call')
                continue
              }

              try {
                // Process the function call using the same logic as other cases
                let functionResult
                
                // Validate parameters first
                
                const validation = validateParameters(functionName as FunctionName, parameters)
                if (!validation.success) {
                  logger.error(`Validation failed for ${functionName}:`, validation.error)
                  logger.error('Validation details:', validation.details)
                }
                
                // Use validated parameters if validation passed, otherwise use original parameters
                let paramsToUse = validation.success ? validation.data : parameters

                // Extract tenant ID from function parameters
                // Use parameter tenant_id if provided, otherwise fallback to webhook tenantId
                const functionTenantId = paramsToUse.tenant_id || tenantId

                // Process the function call using the existing function handlers
                functionResult = await processFunctionCall(functionName, paramsToUse, functionTenantId, supabase)
                
                if (!functionResult.success) {
                  logger.error(`Function ${functionName} failed in end-of-call-report:`, functionResult.error)
                  logger.error('Error details:', functionResult.details)
                } else {
                  logger.debug(`Function ${functionName} succeeded in end-of-call-report`)
                }
                
          } catch (error) {
                logger.error(`Error processing function call ${functionName} in end-of-call-report:`, error)
              }
            }
          }
        }
        
        // Store call data from end-of-call-report with follow-up analysis
        if (call?.id) {
          logger.debug('Processing call with ID:', call.id)
          
          // CRITICAL FIX: Also call handleCallEvent for consistency
          await handleCallEvent('end-of-call-report', call, tenantId, supabase, transcriptText, summaryText)
          logger.debug('End of call report event processed via handleCallEvent')
          
          // Ensure call is marked as completed with final duration
          try {
            const { data: existingCall, error: fetchError } = await supabase
              .from('calls')
              .select('id, status, duration_seconds')
              .eq('vapi_call_id', call.id)
              .eq('tenant_id', tenantId)
              .single()

            if (existingCall && !fetchError) {
              const finalUpdateData = {
                status: 'completed' as const, // Force completed status for end-of-call-report
                duration_seconds: call.duration ? Math.round(call.duration) : (call.durationSeconds ? Math.round(call.durationSeconds) : existingCall.duration_seconds),
                ended_at: call.endedAt || call.ended_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              }

              const { error: updateError } = await supabase
                .from('calls')
                .update(finalUpdateData)
                .eq('id', existingCall.id)
                .eq('tenant_id', tenantId)

              if (updateError) {
                logger.error('Error updating call to completed status:', updateError)
              } else {
                logger.debug(`Call ${call.id} marked as completed with duration: ${finalUpdateData.duration_seconds}s`)
              }
            }
          } catch (error) {
            logger.error('Error in end-of-call-report status update:', error)
          }
          
        } else {
          logger.debug('No call ID found, skipping call storage')
          logger.debug('Call object keys:', call ? Object.keys(call) : 'call is null/undefined')
        }
        
        logger.debug('Call summary:', body.message?.analysis?.summary)
        logger.debug('Call duration:', body.message?.durationSeconds, 'seconds')
        logger.debug('Call cost:', body.message?.cost)
        break

      case 'unknown':
        logger.debug('Unknown webhook format received')
        logger.debug('Full body:', JSON.stringify(body, null, 2))
        logger.debug('Call ID:', call?.id)
        logger.debug('Type:', type)
        
        // Store call data for unknown webhook types if call exists
        if (call?.id) {
          await handleCallEvent('unknown', call, tenantId, supabase, transcriptText, summaryText)
        }
        break

      default:
        logger.debug('Unknown webhook type:', type)
        logger.debug('Full body:', JSON.stringify(body, null, 2))
        logger.debug('Handling unknown webhook type gracefully')
        
        // Store call data for unknown webhook types if call exists
        if (call?.id) {
          await handleCallEvent('unknown', call, tenantId, supabase, transcriptText, summaryText)
        }
    }
    
    logger.debug('=== WEBHOOK COMPLETION ===')
    logger.debug('Webhook type processed:', type)
    logger.debug('Call ID processed:', call?.id)
    logger.debug('Tool call results:', toolCallResults.length)
    logger.debug('========================')
    
    // Final webhook cache update
    if (callId) {
      webhookCache.updateCallContext(callId, {
        lastActivity: Date.now()
      })
      logger.debug('Final webhook cache update completed')
    }
    
    const response = NextResponse.json({ success: true })
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
    
  } catch (error) {
    const duration = Date.now() - startTime
    logStandardError(error as Error, { requestId, duration })
    
    const errorResponse = NextResponse.json(
      createStandardErrorResponse(
        'INTERNAL_ERROR',
        'Webhook processing failed',
        { requestId, duration },
        requestId
      ),
      { status: 500 }
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return errorResponse
  }
}

// Tool handler functions
async function handleGetServices(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== GET SERVICES DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, base_price, hourly_rate, duration_minutes, category')
      .eq('tenant_id', tenantId)
      .order('name')
    
    if (error) {
      logger.error('Error fetching services:', error)
      logger.error('Error details:', JSON.stringify(error, null, 2))
      return createWebhookErrorResponse('Failed to fetch services', error.message)
    }
    
    logger.debug('Services found:', services?.length || 0)
    logger.debug('Services data:', JSON.stringify(services, null, 2))
    
    return createWebhookSuccessResponse({
      services: services || [],
      count: services?.length || 0,
      debug: {
        tenant_id: tenantId,
        query_result: services
      }
    })
  } catch (error) {
    logger.error('Error in handleGetServices:', error)
    return createWebhookErrorResponse('Failed to fetch services', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleGetAvailability(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { date, days = 7 } = parameters
    
    // Normalize year to 2025
    const normalizedDate = normalizeYearTo2025(date)
    logger.debug('Original date:', date)
    logger.debug('Normalized date:', normalizedDate)
    
    // Get business hours from company_settings first, fallback to tenants
    let businessHours: Record<string, string | { open?: string; close?: string; closed?: boolean }> = {}
    let timezone = 'America/Chicago'
    
    const { data: companySettings, error: companyError } = await supabase
      .from('company_settings')
      .select('business_hours, timezone')
      .eq('tenant_id', tenantId)
      .single()

    if (companySettings && !companyError) {
      businessHours = (companySettings.business_hours as Record<string, string | { open?: string; close?: string; closed?: boolean }>) || {}
      timezone = companySettings.timezone || 'America/Chicago'
    } else {
      // Fallback to tenants table
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('business_hours, timezone')
        .eq('id', tenantId)
        .single()

      if (tenantError || !tenant) {
        return createWebhookErrorResponse('Tenant not found', tenantError?.message)
      }
      
      businessHours = (tenant.business_hours as Record<string, string | { open?: string; close?: string; closed?: boolean }>) || {}
      timezone = tenant.timezone || 'America/Chicago'
    }

    // Parse relative dates if needed
    let actualDate = normalizedDate
    if (normalizedDate && typeof normalizedDate === 'string' && !normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // This looks like a relative date, parse it
      // Note: parseRelativeDate will use system date as fallback since we don't have call context here
      // The AI should call getCurrentDate first to get the accurate current date
      const parsedDate = parseRelativeDate(normalizedDate, timezone)
      actualDate = parsedDate.date
      logger.debug(`Parsed relative date "${normalizedDate}" to actual date: ${actualDate}`)
      logger.debug('Note: Using system date for relative date parsing. AI should call getCurrentDate first for accuracy.')
    }

    // Get services to determine slot duration
    const { data: services } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('tenant_id', tenantId)
    
    // Use average service duration or default to 60 minutes
    const avgDuration = services?.length > 0 
      ? Math.round(services.reduce((sum: number, s: any) => sum + (s.duration_minutes || 60), 0) / services.length)
      : 60
    
    logger.debug('Average service duration:', avgDuration, 'minutes')

    // Generate availability based on business hours and existing appointments
    const availability = []
    const startDate = new Date(actualDate || new Date())
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dayHours = businessHours?.[dayName]
      
      // Type guard for business hours object
      const isBusinessHoursObject = (hours: unknown): hours is { open?: string; close?: string; closed?: boolean } => {
        return typeof hours === 'object' && hours !== null && !Array.isArray(hours)
      }
      
      // Check if day is closed (handle both string and object formats)
      const isClosed = !dayHours || 
                      dayHours === 'Closed' || 
                      (isBusinessHoursObject(dayHours) && dayHours.closed)
      
      if (!isClosed) {
        // Parse business hours (handles both string and object formats)
        const parsedHours = parseBusinessHoursString(dayHours)
        if (!parsedHours) continue
        
        const openTime = parsedHours.open
        const closeTime = parsedHours.close
        
        if (openTime && closeTime) {
          // Get existing appointments for this date
          const { data: existingAppointments } = await supabase
            .from('appointments')
            .select('starts_at, ends_at, duration_minutes')
            .eq('tenant_id', tenantId)
            .gte('starts_at', `${dateStr}T00:00:00`)
            .lt('starts_at', `${dateStr}T23:59:59`)
            .eq('status', 'scheduled')
          
          logger.debug(`Existing appointments for ${dateStr}:`, existingAppointments)
          
          // Generate base time slots
          const baseTimes = generateAvailabilitySlots(openTime, closeTime, avgDuration)
          
          // Filter out booked times and ensure 30-minute buffer
          const availableTimes = baseTimes.filter(timeSlot => {
            const slotStart = new Date(`${dateStr}T${timeSlot}:00`)
            const slotEnd = new Date(slotStart.getTime() + avgDuration * 60000)
            
            // Check if this slot conflicts with existing appointments
            const hasConflict = existingAppointments?.some((apt: any) => {
              const aptStart = new Date(apt.starts_at)
              const aptEnd = new Date(apt.ends_at)
              
              // Check for overlap (with 30-minute buffer)
              const bufferStart = new Date(slotStart.getTime() - 30 * 60000) // 30 minutes before
              const bufferEnd = new Date(slotEnd.getTime() + 30 * 60000) // 30 minutes after
              
              return (bufferStart < aptEnd && bufferEnd > aptStart)
            }) || false
            
            return !hasConflict
          })
          
          logger.debug(`Available times for ${dateStr}:`, availableTimes)
        
        availability.push({
            date: dateStr,
            day: dayName,
            times: availableTimes,
            open: parsedHours.open.hours + ':' + parsedHours.open.minutes.toString().padStart(2, '0'),
            close: parsedHours.close.hours + ':' + parsedHours.close.minutes.toString().padStart(2, '0'),
            slot_duration_minutes: avgDuration,
            total_slots: baseTimes.length,
            available_slots: availableTimes.length,
            booked_slots: baseTimes.length - availableTimes.length
          })
        }
      }
    }
    
    return createWebhookSuccessResponse({
      tenant_id: tenantId,
      date_range: {
        start: startDate.toISOString(),
        end: new Date(startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString()
      },
      timezone: timezone,
      availability,
      slot_duration_minutes: avgDuration
    })
  } catch (error) {
    logger.error('Error in handleGetAvailability:', error)
    return createWebhookErrorResponse('Failed to fetch availability', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleBookAppointment(tenantId: string, parameters: any, supabase: any, tenant?: any): Promise<ApiResponse> {
  try {
    logger.debug('=== HANDLE BOOK APPOINTMENT DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    logger.debug('Tenant:', JSON.stringify(tenant, null, 2))
    
    if (!tenantId) {
      logger.error('CRITICAL: handleBookAppointment called without tenantId!')
      return createWebhookErrorResponse('Tenant ID is required for booking appointments')
    }
    
    // Get tenant data if not provided - try company_settings first
    let tenantData = tenant
    if (!tenantData) {
      // First try company_settings
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()
      
      if (companySettings && !companyError) {
        tenantData = {
          id: tenantId,
          timezone: companySettings.timezone || 'America/Chicago',
          business_hours: companySettings.business_hours || {}
        }
      } else {
        // Fallback to tenants table
        const { data: tenantDataResult, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single()
        
        if (tenantError || !tenantDataResult) {
          return createWebhookErrorResponse('Tenant not found', tenantError?.message)
        }
        tenantData = tenantDataResult
      }
    }
    
    // Get tenant timezone
    const tenantTimezone = tenantData?.timezone
    if (!tenantTimezone) {
      return createWebhookErrorResponse('Tenant timezone not configured', 'Please configure timezone in company settings')
    }
    logger.debug('Using tenant timezone for booking:', tenantTimezone)
    
    const { 
      client_phone, 
      client_name, 
      client_email,
      client_address,
      starts_at, 
      duration_minutes = 60,
      service_id,
      service_type,
      notes,
      priority = 'normal'
    } = parameters

    if (!client_phone || !starts_at) {
      logger.debug('Missing required fields - client_phone:', client_phone, 'starts_at:', starts_at)
      return createWebhookErrorResponse('Missing required fields: client_phone, starts_at')
    }

    // Parse appointment time with comprehensive relative date handling
    let appointmentTime: Date
    
    // Check if this is a relative date/time string
    if (starts_at && typeof starts_at === 'string' && !starts_at.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // This looks like a relative date/time, parse it
      const parsedDateTime = parseDateTimeString(starts_at, tenantTimezone) // Use tenant's timezone
      
      if (parsedDateTime.time) {
        // We have both date and time - create in tenant timezone
        appointmentTime = new Date(`${parsedDateTime.date}T${parsedDateTime.time}:00`)
      } else {
        // Only date, default to 9 AM in tenant timezone
        appointmentTime = new Date(`${parsedDateTime.date}T09:00:00`)
      }
      
      logger.debug(`Parsed relative date/time "${starts_at}" to: ${appointmentTime.toISOString()}`)
    } else {
      // Absolute date/time format - handle timezone conversion
      if (starts_at.endsWith('Z')) {
        // UTC time - convert to tenant timezone for interpretation
        const utcTime = new Date(starts_at)
        // Treat as if it's in tenant timezone, then convert to UTC for storage
        const tenantTime = new Date(utcTime.toLocaleString('en-US', { timeZone: tenantTimezone }))
        appointmentTime = new Date(utcTime.getTime() + (utcTime.getTimezoneOffset() * 60000))
      } else {
        // Assume it's already in tenant timezone
        appointmentTime = new Date(starts_at)
      }
    }

    if (isNaN(appointmentTime.getTime())) {
      return createWebhookErrorResponse('Invalid appointment time format')
    }

    // Find or create client
    let clientId: string
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', client_phone)
      .single()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      // Create new client
      const nameParts = client_name ? client_name.split(' ') : ['Unknown', 'Client']
      const { data: newClient, error: clientError } = await supabase
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
        .single()

      if (clientError) {
        logger.error('Error creating client:', clientError)
        return createWebhookErrorResponse('Failed to create client', clientError.message)
      }

      clientId = newClient.id
    }
    
    // Handle service_id mapping - convert string service names to UUIDs
    // Support both service_id and service_type parameters
    let serviceId: string | null = null
    let serviceData: any = null
    const serviceIdentifier = parameters.service_id || service_type
    if (serviceIdentifier) {
      if (typeof serviceIdentifier === 'string' && serviceIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Already a UUID - use directly and fetch full service data
        serviceId = serviceIdentifier
        logger.debug(`Using service_id UUID: ${serviceId}`)
        const { data: service } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('id', serviceId)
          .single()
        if (service) {
          serviceData = service
        }
      } else {
        // Service name/type string - find matching service
        const { data: services } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .ilike('name', `%${serviceIdentifier}%`)
          .limit(1)
        
        if (services && services.length > 0) {
          serviceId = services[0].id
          serviceData = services[0]
          logger.debug(`Mapped service "${serviceIdentifier}" to UUID: ${serviceId}`)
        } else {
          logger.debug(`No service found matching "${serviceIdentifier}", will create appointment without service`)
        }
      }
    }

    // Get business hours from company_settings first, fallback to tenants
    let businessHours: Record<string, string | { open?: string; close?: string; closed?: boolean }> = {}
    let timezone = 'America/Chicago'
    
    const { data: companySettings, error: companyError } = await supabase
      .from('company_settings')
      .select('business_hours, timezone')
      .eq('tenant_id', tenantId)
      .single()

    if (companySettings && !companyError) {
      businessHours = (companySettings.business_hours as Record<string, string | { open?: string; close?: string; closed?: boolean }>) || {}
      timezone = companySettings.timezone || 'America/Chicago'
    } else {
      // Fallback to tenants table
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('business_hours, timezone')
        .eq('id', tenantId)
        .single()
      
      if (tenantData) {
        businessHours = (tenantData.business_hours as Record<string, string | { open?: string; close?: string; closed?: boolean }>) || {}
        timezone = tenantData.timezone || 'America/Chicago'
      }
    }

    if (businessHours && Object.keys(businessHours).length > 0) {
      const dayName = appointmentTime.toLocaleDateString('en-US', { 
        weekday: 'long' 
      }).toLowerCase()
      
      const dayHours = businessHours[dayName]
      
      // Type guard for business hours object
      const isBusinessHoursObject = (hours: unknown): hours is { open?: string; close?: string; closed?: boolean } => {
        return typeof hours === 'object' && hours !== null && !Array.isArray(hours)
      }
      
      const isDayClosed = !dayHours || 
                          dayHours === 'Closed' || 
                          (isBusinessHoursObject(dayHours) && dayHours.closed)
      
      if (isDayClosed) {
        return createWebhookErrorResponse(`We're closed on ${dayName}. Please choose a different day.`, {
          available_days: Object.keys(businessHours).filter(day => {
            const hours = businessHours[day]
            if (!hours || hours === 'Closed') return false
            if (isBusinessHoursObject(hours) && hours.closed) return false
            return true
          })
        })
      }

      // Check if time is within business hours
      const parsedHours = parseBusinessHoursString(dayHours)
      if (!parsedHours) {
        return createWebhookErrorResponse(`Invalid business hours format for ${dayName}`)
      }
      
      const openTime = parsedHours.open
      const closeTime = parsedHours.close
      
      if (openTime && closeTime) {
        // Assume appointment time is already in tenant's local timezone
        // Compare directly with business hours (no timezone conversion needed)
        const appointmentHour = appointmentTime.getHours() // Use local time, not UTC
        const appointmentMinute = appointmentTime.getMinutes()
        const appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute
        
        // Business hours are already in local time
        const openTimeMinutes = openTime.hours * 60 + openTime.minutes
        const closeTimeMinutes = closeTime.hours * 60 + closeTime.minutes
        
        logger.debug('=== BUSINESS HOURS CHECK DEBUG (LOCAL TIME) ===')
        logger.debug('Appointment time (local):', appointmentTime.toLocaleString())
        logger.debug('Appointment time (local):', `${appointmentHour}:${appointmentMinute.toString().padStart(2, '0')}`)
        logger.debug('Tenant timezone:', timezone)
        logger.debug('Appointment hour:', appointmentHour, 'minute:', appointmentMinute)
        logger.debug('Appointment time minutes:', appointmentTimeMinutes)
        logger.debug('Open time (local):', openTime, 'minutes:', openTimeMinutes)
        logger.debug('Close time (local):', closeTime, 'minutes:', closeTimeMinutes)
        logger.debug('Is within hours:', appointmentTimeMinutes >= openTimeMinutes && appointmentTimeMinutes < closeTimeMinutes)
        
        if (appointmentTimeMinutes < openTimeMinutes || appointmentTimeMinutes >= closeTimeMinutes) {
          logger.debug('APPOINTMENT TIME IS OUTSIDE BUSINESS HOURS')
          return createWebhookErrorResponse(`Appointment time is outside business hours. We're open ${dayHours} on ${dayName}.`, {
            suggested_times: generateSuggestedTimes(openTime, closeTime)
          })
        }
      }
    }

    // Check for follow-up requirements (serviceData already fetched above if service was found)
    let followUpRequired = false
    let followUpReason = ''
    let followUpNotes = ''
    let aiAnalysis = ''

    // Create appointment - VAPI sends times in tenant's timezone, no conversion needed
    const endTime = new Date(appointmentTime.getTime() + duration_minutes * 60000)
    
    // Work directly with the appointment time as tenant's local time
    const appointmentTimeLocal = new Date(appointmentTime)
    const endTimeLocal = new Date(endTime)
    
    logger.debug('=== APPOINTMENT CREATION DEBUG ===')
    logger.debug('Appointment time (tenant local):', appointmentTimeLocal.toISOString())
    logger.debug('End time (tenant local):', endTimeLocal.toISOString())
    logger.debug('Appointment time (local display):', appointmentTimeLocal.toLocaleString())
    logger.debug('Client ID:', clientId)
    logger.debug('Service ID:', serviceId)
    
    // Insert appointment first without select to avoid PGRST116 errors
    // created_by is NULL for VAPI-created appointments (no user context)
    const appointmentInsertData = {
      tenant_id: tenantId,
      client_id: clientId,
      service_id: serviceId,
      title: `Service Appointment`,
      description: notes || `Appointment for ${service_type || 'service'}`,
      starts_at: appointmentTimeLocal.toISOString(),
      ends_at: endTimeLocal.toISOString(),
      duration_minutes: duration_minutes,
      status: 'scheduled',
      priority: priority,
      address: client_address || null,
      city: null,
      state: null,
      zip_code: null,
      created_by: null  // VAPI-created appointments don't have a user context
    }
    
    logger.debug('Inserting appointment with data:', JSON.stringify(appointmentInsertData, null, 2))
    
    const { data: insertedAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert(appointmentInsertData)
      .select('id')
      .single()

    if (insertError) {
      logger.error('=== APPOINTMENT INSERT FAILED ===')
      logger.error('Error inserting appointment:', insertError)
      logger.error('Insert error code:', insertError.code)
      logger.error('Insert error details:', insertError.details)
      logger.error('Insert error hint:', insertError.hint)
      logger.error('Insert error message:', insertError.message)
      logger.error('Appointment data that failed:', JSON.stringify(appointmentInsertData, null, 2))
      return createWebhookErrorResponse('Failed to create appointment', insertError.message || insertError.details || 'Unknown error')
    }
    
    logger.debug('=== APPOINTMENT INSERT SUCCESS ===')
    logger.debug('Inserted appointment ID:', insertedAppointment?.id)
    
    if (!insertedAppointment || !insertedAppointment.id) {
      logger.error('Appointment insert returned no data or ID')
      return createWebhookErrorResponse('Failed to create appointment', 'Insert succeeded but no appointment ID returned')
    }
    
    // Fetch the full appointment data separately
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, title, starts_at, ends_at, duration_minutes')
      .eq('id', insertedAppointment.id)
      .single()
    
    if (fetchError || !appointment) {
      logger.error('Error fetching created appointment:', fetchError)
      // Even if fetch fails, we have the ID, so return success with minimal data
      return createWebhookSuccessResponse({
        appointment: {
          id: insertedAppointment.id,
          title: appointmentInsertData.title,
          starts_at: appointmentInsertData.starts_at,
          ends_at: appointmentInsertData.ends_at,
          duration_minutes: appointmentInsertData.duration_minutes
        },
        message: `Appointment scheduled for ${appointmentTime.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })} at ${appointmentTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`
      })
    }

    // Prepare response with follow-up information if needed
    const responseData: any = {
      appointment: {
        id: appointment.id,
        title: appointment.title,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at
      },
      message: `Appointment scheduled for ${appointmentTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} at ${appointmentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    }

    // Add follow-up information if required
    if (followUpRequired) {
      responseData.follow_up_required = true
      responseData.follow_up_reason = followUpReason
      responseData.follow_up_notes = followUpNotes
      responseData.ai_analysis = aiAnalysis
      responseData.message = `Appointment scheduled for ${appointmentTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} at ${appointmentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}. However, we need to call you back within 10 minutes to provide accurate pricing for ${service_type || 'this service'}.`
    }

    return createWebhookSuccessResponse(responseData)
  } catch (error) {
    logger.error('Error in handleBookAppointment:', error)
    return createWebhookErrorResponse('Failed to book appointment', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleLookupClient(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { phone, email, name } = parameters

    if (!phone && !email && !name) {
      return createWebhookErrorResponse('Please provide phone, email, or name to search')
    }

    let query = supabase
      .from('clients')
      .select('id, first_name, last_name, phone, email, address, created_at')
      .eq('tenant_id', tenantId)

    if (phone) {
      query = query.eq('phone', phone)
    } else if (email) {
      query = query.eq('email', email)
    } else if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`)
    }

    const { data: clients, error } = await query

    if (error) {
      logger.error('Error looking up client:', error)
      return createWebhookErrorResponse('Failed to lookup client', error.message)
    }

    return createWebhookSuccessResponse({
      clients: (clients || []).map((client: any) => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`.trim(),
        phone: client.phone,
        email: client.email,
        address: client.address,
        created_at: client.created_at
      })),
      count: clients?.length || 0
    })
  } catch (error) {
    logger.error('Error in handleLookupClient:', error)
    return createWebhookErrorResponse('Failed to lookup client', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleCreateClient(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== CREATE CLIENT DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { name, first_name, last_name, phone, email, address, city, state, zip_code } = parameters

    // Parse name if provided, otherwise use first_name and last_name
    let parsedFirstName = first_name
    let parsedLastName = last_name
    
    if (name && !first_name && !last_name) {
      const nameParts = name.split(' ')
      parsedFirstName = nameParts[0] || 'Unknown'
      parsedLastName = nameParts.slice(1).join(' ') || 'Client'
    }

    logger.debug('Processed names:', { parsedFirstName, parsedLastName, originalName: name })

    logger.debug('Attempting to insert client into database...')
    const insertData = {
      tenant_id: tenantId,
      first_name: parsedFirstName,
      last_name: parsedLastName,
      phone,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zip_code || null,
      status: 'active'
    }
    logger.debug('Insert data:', JSON.stringify(insertData, null, 2))

    const result = await safeInsert(
      supabase.from('clients'),
      insertData,
      'id, first_name, last_name, phone, email, address, city, state, zip_code'
    )

    if (!result.success) {
      logger.error('Database error creating client:', result.error)
      return createWebhookErrorResponse('Failed to create client', result.details)
    }

    logger.debug('Client created successfully:', JSON.stringify(result.data, null, 2))

    const clientData = result.data as any

    // Invalidate all cache layers for clients
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'clients',
      specificId: clientData.id,
      warmCache: true
    })

    return createWebhookSuccessResponse({
      client: {
        id: clientData.id,
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        name: `${clientData.first_name} ${clientData.last_name}`.trim(),
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        zip_code: clientData.zip_code
      },
      message: `Client ${first_name} ${last_name} created successfully`
    })
  } catch (error) {
    logger.error('Error in handleCreateClient:', error)
    return createWebhookErrorResponse('Failed to create client', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleRescheduleAppointment(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { appointment_id, new_date, new_time, reason, client_phone } = parameters

    if (!new_date || !new_time) {
      return createWebhookErrorResponse('Missing required fields: new_date, new_time')
    }

    let targetAppointmentId = appointment_id

    // If no appointment_id provided, try to find the most recent appointment for the client
    if (!targetAppointmentId && client_phone) {
      logger.debug('No appointment_id provided, looking up by client phone:', client_phone)
      
      // First find the client
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', client_phone)
      
      const client = clients && clients.length > 0 ? clients[0] : null

      if (clientError) {
        return createWebhookErrorResponse('Client lookup failed', clientError.message)
      }

      if (!client) {
        return createWebhookErrorResponse('Client not found', 'No client found with the provided phone number')
      }

      // Find the most recent scheduled appointment for this client
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, starts_at')
        .eq('tenant_id', tenantId)
        .eq('client_id', client.id)
        .eq('status', 'scheduled')
        .order('starts_at', { ascending: false })
        .limit(1)

      if (appointmentsError || !appointments || appointments.length === 0) {
        return createWebhookErrorResponse('No scheduled appointments found', 'No scheduled appointments found for this client')
      }

      targetAppointmentId = appointments[0].id
      logger.debug('Found appointment ID for reschedule:', targetAppointmentId)
    }

    if (!targetAppointmentId) {
      return createWebhookErrorResponse('Appointment ID is required', 'Either provide appointment_id or client_phone to find the appointment')
    }

    // Parse the date and time more flexibly
    let appointmentDateTime: Date
    
    try {
      // Try different date/time formats
      if (new_time.includes('T') || new_time.includes('Z')) {
        // If new_time is already a full datetime
        appointmentDateTime = new Date(new_time)
      } else if (new_date.includes('T') || new_date.includes('Z')) {
        // If new_date is already a full datetime
        appointmentDateTime = new Date(new_date)
      } else {
        // Combine date and time
        appointmentDateTime = new Date(`${new_date}T${new_time}`)
      }
      
      if (isNaN(appointmentDateTime.getTime())) {
        return createWebhookErrorResponse('Invalid date or time format', {
          message: 'Please provide valid date and time values',
          received: { new_date, new_time }
        })
      }
    } catch (error) {
      return createWebhookErrorResponse('Invalid date or time format', {
        message: 'Error parsing date/time values',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, duration_minutes')
      .eq('id', targetAppointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !appointment) {
      return createWebhookErrorResponse('Appointment not found', fetchError?.message)
    }

    const duration = appointment.duration_minutes || 60
    const endTime = new Date(appointmentDateTime.getTime() + duration * 60000)

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        starts_at: appointmentDateTime.toISOString(),
        ends_at: endTime.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', targetAppointmentId)

    if (updateError) {
      logger.error('Error rescheduling appointment:', updateError)
      return createWebhookErrorResponse('Failed to reschedule appointment', updateError.message)
    }

    // Invalidate all cache layers for appointments
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: targetAppointmentId,
      warmCache: true
    })

    return createWebhookSuccessResponse({
      message: `Appointment rescheduled to ${appointmentDateTime.toLocaleString()}`,
      appointment: {
        id: targetAppointmentId,
        starts_at: appointmentDateTime.toISOString(),
        ends_at: endTime.toISOString()
      }
    })
  } catch (error) {
    logger.error('Error in handleRescheduleAppointment:', error)
    return createWebhookErrorResponse('Failed to reschedule appointment', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleUpdateAppointment(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { appointment_id, status, notes } = parameters

    if (!appointment_id) {
      return createWebhookErrorResponse('Appointment ID is required')
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (notes) updateData.description = notes

    // First check if the appointment exists
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, title, starts_at, status')
      .eq('id', appointment_id)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return createWebhookErrorResponse('Appointment not found', 'No appointment found with the provided ID')
    }

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointment_id)
      .eq('tenant_id', tenantId)

    if (error) {
      logger.error('Error updating appointment:', error)
      return createWebhookErrorResponse('Failed to update appointment', error.message)
    }

    // Invalidate all cache layers for appointments
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: appointment_id,
      warmCache: true
    })

    return createWebhookSuccessResponse({
      message: 'Appointment updated successfully',
      appointment: {
        id: existingAppointment.id,
        title: existingAppointment.title,
        starts_at: existingAppointment.starts_at,
        status: updateData.status || existingAppointment.status
      }
    })
  } catch (error) {
    logger.error('Error in handleUpdateAppointment:', error)
    return createWebhookErrorResponse('Failed to update appointment', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleCancelAppointment(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { appointment_id, reason } = parameters

    if (!appointment_id) {
      return createWebhookErrorResponse('Appointment ID is required')
    }

    // First check if the appointment exists
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, title, starts_at, status')
      .eq('id', appointment_id)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return createWebhookErrorResponse('Appointment not found', 'No appointment found with the provided ID')
    }

    // Check if appointment is already cancelled
    if (existingAppointment.status === 'cancelled') {
      return createWebhookSuccessResponse({
        message: 'Appointment is already cancelled',
        appointment: existingAppointment
      })
    }

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        description: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment_id)
      .eq('tenant_id', tenantId)

    if (error) {
      logger.error('Error cancelling appointment:', error)
      return createWebhookErrorResponse('Failed to cancel appointment', error.message)
    }

    // Invalidate all cache layers for appointments
    await simplifiedCacheManager.invalidateData({
      tenantId,
      dataType: 'appointments',
      specificId: appointment_id,
      warmCache: true
    })

    return createWebhookSuccessResponse({
      message: 'Appointment cancelled successfully',
      appointment: {
        id: existingAppointment.id,
        title: existingAppointment.title,
        starts_at: existingAppointment.starts_at,
        status: 'cancelled'
      }
    })
  } catch (error) {
    logger.error('Error in handleCancelAppointment:', error)
    return createWebhookErrorResponse('Failed to cancel appointment', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleGetBusinessHours(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    // First try to get business hours from company_settings
    const { data: companySettings, error: companyError } = await supabase
      .from('company_settings')
      .select('business_hours, timezone')
      .eq('tenant_id', tenantId)
      .single()

    if (companySettings && !companyError) {
      return createWebhookSuccessResponse({
        business_hours: companySettings.business_hours || {},
        timezone: companySettings.timezone || 'America/Chicago'
      })
    }

    // Fallback to tenants table
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('business_hours, timezone')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) {
      return createWebhookErrorResponse('Tenant not found', error?.message)
    }

    return createWebhookSuccessResponse({
      business_hours: tenant.business_hours || {},
      timezone: tenant.timezone || 'America/Chicago'
    })
  } catch (error) {
    logger.error('Error in handleGetBusinessHours:', error)
    return createWebhookErrorResponse('Failed to get business hours', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleGetPricing(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { service_id } = parameters

    if (!service_id) {
      return createWebhookErrorResponse('Service ID is required')
    }

    const { data: service, error } = await supabase
      .from('services')
      .select('name, base_price, hourly_rate, duration_minutes, category')
      .eq('id', service_id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !service) {
      return createWebhookErrorResponse('Service not found', error?.message)
    }

    return createWebhookSuccessResponse({
      service: {
        name: service.name,
        base_price: service.base_price,
        hourly_rate: service.hourly_rate,
        duration_minutes: service.duration_minutes,
        category: service.category
      }
    })
  } catch (error) {
    logger.error('Error in handleGetPricing:', error)
    return createWebhookErrorResponse('Failed to get pricing', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleCheckServiceArea(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { address, zip_code, latitude, longitude } = parameters

    if (!address && !zip_code) {
      return createWebhookErrorResponse('Address or ZIP code is required')
    }

    logger.debug('=== CHECKING SERVICE AREA ===')
    logger.debug('Address:', address)
    logger.debug('ZIP Code:', zip_code)
    logger.debug('Coordinates:', { latitude, longitude })
    logger.debug('Tenant ID:', tenantId)

    // Import the service area utility
    const { checkServiceArea } = await import('@/lib/service-area')
    
    // Use the full address or construct from ZIP
    const fullAddress = address || `ZIP Code ${zip_code}`
    
    // Check service area using the new utility
    const serviceResult = await checkServiceArea(
      tenantId,
      fullAddress,
      latitude ? parseFloat(latitude) : undefined,
      longitude ? parseFloat(longitude) : undefined
    )

    logger.debug('Service area result:', serviceResult)

    return createWebhookSuccessResponse({
      serviceable: serviceResult.is_serviced,
      message: serviceResult.message,
      address: fullAddress,
      service_area_name: serviceResult.service_area_name,
      distance_miles: serviceResult.distance_miles,
      eta_minutes: serviceResult.eta_minutes
    })
  } catch (error) {
    logger.error('Error in handleCheckServiceArea:', error)
    return createWebhookErrorResponse('Failed to check service area', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleGetClientDetails(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { client_id, phone, email } = parameters

    if (!client_id && !phone && !email) {
      return createWebhookErrorResponse('Client ID, phone, or email is required')
    }

    let query = supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)

    if (client_id) {
      query = query.eq('id', client_id)
    } else if (phone) {
      query = query.eq('phone', phone)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data: client, error } = await query.single()

    if (error || !client) {
      return createWebhookErrorResponse('Client not found', error?.message)
    }

    // Get client's appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, title, description, starts_at, ends_at, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('client_id', client.id)
      .order('starts_at', { ascending: true })

    if (appointmentsError) {
      logger.error('Error fetching appointments:', appointmentsError)
    }

    return createWebhookSuccessResponse({
      client: {
        id: client.id,
        name: `${client.first_name} ${client.last_name}`.trim(),
        phone: client.phone,
        email: client.email,
        address: client.address,
        status: client.status,
        created_at: client.created_at
      },
      appointments: appointments || []
    })
  } catch (error) {
    logger.error('Error in handleGetClientDetails:', error)
    return createWebhookErrorResponse('Failed to get client details', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleCreateQuote(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    const { client_id, service_id, description, materials_cost, labor_rate, estimated_hours } = parameters

    if (!client_id || !service_id) {
      return createWebhookErrorResponse('Client ID and Service ID are required')
    }

    const materials = materials_cost || 0
    const labor = (labor_rate || 75) * (estimated_hours || 1)
    const total = materials + labor

    return createWebhookSuccessResponse({
      quote: {
        client_id,
        service_id,
        description: description || 'Service quote',
        materials_cost: materials,
        labor_cost: labor,
        total_cost: total,
        estimated_hours: estimated_hours || 1,
        labor_rate: labor_rate || 75
      },
      message: `Quote created: $${total.toFixed(2)} total`
    })
  } catch (error) {
    logger.error('Error in handleCreateQuote:', error)
    return createWebhookErrorResponse('Failed to create quote', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleGetCurrentDate(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== GET CURRENT DATE HANDLER ===')
    
    // Get tenant timezone from database
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('timezone')
      .eq('id', tenantId)
      .single()
    
    const timezone = tenant?.timezone || 'America/Chicago'
    logger.debug('Using tenant timezone:', timezone)
    
    // Get current date in tenant's timezone using Intl.DateTimeFormat
    const now = new Date()
    
    // Create a formatter for the tenant's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Format the date in the tenant's timezone
    const parts = formatter.formatToParts(now)
    const year = parts.find(part => part.type === 'year')?.value
    const month = parts.find(part => part.type === 'month')?.value
    const day = parts.find(part => part.type === 'day')?.value
    const hour = parts.find(part => part.type === 'hour')?.value
    const minute = parts.find(part => part.type === 'minute')?.value
    const second = parts.find(part => part.type === 'second')?.value
    
    // Validate that we got all required parts
    if (!year || !month || !day || !hour || !minute || !second) {
      logger.error('Failed to extract date parts from formatter:', { year, month, day, hour, minute, second })
      // Fallback to current UTC date if formatting fails
      const fallbackDate = new Date()
      const currentDate = {
        date: fallbackDate.toISOString().split('T')[0],
        day_of_week: fallbackDate.toLocaleDateString('en-US', { weekday: 'long' }),
        time: fallbackDate.toISOString().split('T')[1].split('.')[0],
        timezone: timezone,
        year: fallbackDate.getFullYear(),
        month: fallbackDate.getMonth() + 1,
        day: fallbackDate.getDate(),
        month_name: fallbackDate.toLocaleDateString('en-US', { month: 'long' })
      }
      logger.debug('Using fallback date:', currentDate)
      return createWebhookSuccessResponse(currentDate)
    }
    
    // Create date string in YYYY-MM-DD format
    const dateString = `${year}-${month}-${day}`
    
    // Get day of week
    const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    })
    const dayOfWeek = dayOfWeekFormatter.format(now)
    
    // Get month name
    const monthFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'long'
    })
    const monthName = monthFormatter.format(now)
    
    const currentDate = {
      date: dateString, // YYYY-MM-DD format
      day_of_week: dayOfWeek,
      time: `${hour}:${minute}:${second}`,
      timezone: timezone,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      month_name: monthName
    }
    
    logger.debug('getCurrentDate result:', currentDate)
    logger.debug('Current UTC time:', now.toISOString())
    logger.debug('Tenant timezone time:', `${dateString}T${hour}:${minute}:${second}`)
    
    return createWebhookSuccessResponse(currentDate)
  } catch (error) {
    logger.error('Error in handleGetCurrentDate:', error)
    return createWebhookErrorResponse('Failed to get current date', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleGetPricingInfo(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== GET PRICING INFO HANDLER ===')
    const { client_request } = parameters as { client_request: string; tenant_id: string }
    
    // Load tenant data to get business_type and technician terminology
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('business_type')
      .eq('id', tenantId)
      .single()
    
    // Determine technician terminology based on business type
    const technicianTerm = getTechnicianTerm(tenantData?.business_type)
    
    // Check if client wants exact pricing for General Service
    const wantsExactPricing = /exact|precise|specific|quote|estimate|price|cost|how much|what.*cost|what.*price/i.test(client_request)
    
    // Check if it's an emergency request
    const isEmergency = /emergency|urgent|asap|immediately|now|flooding|burst|leaking|flooded|water everywhere|stop leak|prevent damage|safety hazard|health hazard/i.test(client_request)
    
    // Determine pricing range based on request type
    const pricingRange = isEmergency 
      ? { min: 150, max: 500, type: 'emergency' }
      : { min: 75, max: 200, type: 'standard' }
    
    // Determine if callback is needed
    const needsCallback = wantsExactPricing || isEmergency
    
    const result = {
      service_type: 'General Service',
      pricing_range: pricingRange,
      needs_callback: needsCallback,
      message: needsCallback 
        ? `For ${pricingRange.type} service issues, our General Service typically ranges from $${pricingRange.min}-$${pricingRange.max} depending on the specific problem and time required. Since General Service covers many different types of work, our ${technicianTerm} will need to assess your specific situation to give you an accurate quote.`
        : `For general service work, our General Service typically ranges from $${pricingRange.min}-$${pricingRange.max} depending on the specific issue and complexity.`
    }
    
    logger.debug('getPricingInfo result:', result)
    return createWebhookSuccessResponse(result)
  } catch (error) {
    logger.error('Error in handleGetPricingInfo:', error)
    return createWebhookErrorResponse('Failed to get pricing info', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleEndCall(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== END CALL HANDLER ===')
    logger.debug('Call ended for tenant:', tenantId)
    logger.debug('End call parameters:', parameters)
    
    // Return a response that indicates the call should end
    // The AI should use this as a signal to end the conversation
    return createWebhookSuccessResponse({
      message: 'Call ended successfully',
      timestamp: new Date().toISOString(),
      action: 'end_call',
      summary: parameters.summary || 'Call completed successfully'
    })
  } catch (error) {
    logger.error('Error in handleEndCall:', error)
    return createWebhookErrorResponse('Failed to end call', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Helper function to parse time strings
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  
  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10)
  }
}

// Helper function to generate suggested appointment times
function generateSuggestedTimes(openTime: { hours: number; minutes: number }, closeTime: { hours: number; minutes: number }): string[] {
  const suggestions = []
  const openMinutes = openTime.hours * 60 + openTime.minutes
  const closeMinutes = closeTime.hours * 60 + closeTime.minutes
  
  // Generate 2-hour slots
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += 120) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    
    // Convert to 12-hour format for user-friendly display
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const ampm = hours < 12 ? 'AM' : 'PM'
    suggestions.push(`${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`)
  }
  
  return suggestions.slice(0, 4) // Return up to 4 suggestions
}

// Service matching handler
async function handleFindServiceForClient(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== FIND SERVICE FOR CLIENT DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { client_request } = parameters
    
    if (!client_request) {
      return createWebhookErrorResponse('Missing required parameter: client_request')
    }
    
    // Load tenant data to get business_type and technician terminology
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('business_type')
      .eq('id', tenantId)
      .single()
    
    // Determine technician terminology based on business type
    const technicianTerm = getTechnicianTerm(tenantData?.business_type)
    
    // Import service matching function
    const { findServiceMatch } = await import('@/lib/services/service-matcher')
    
    // Get tenant's active services
    const { data: tenantServices, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (servicesError) {
      logger.error('Error fetching tenant services:', servicesError)
      return createWebhookErrorResponse('Failed to fetch tenant services', servicesError.message)
    }
    
    // Find best matching service (pass supabase client for general service lookup)
    const match = await findServiceMatch(client_request, tenantServices || [], tenantId, supabase)
    
    logger.debug('Service match result:', JSON.stringify(match, null, 2))
    
    // Determine ballpark pricing based on request
    const isEmergency = match.service.is_emergency_service || false
    const ballparkPrice = isEmergency 
      ? { min: 150, max: 500, currency: 'USD' }
      : { min: 75, max: 200, currency: 'USD' }

    return createWebhookSuccessResponse({
      service: match.service,
      matchScore: match.matchScore,
      matchType: match.matchType,
      matchedKeywords: match.matchedKeywords,
      isGeneralService: match.service.id.startsWith('general-service-'),
      isEmergency: match.service.is_emergency_service || false,
      confidence: Math.round(match.matchScore * 100), // Convert to percentage
      ballparkPricing: ballparkPrice,
      pricingNote: `Exact pricing will be determined after assessment by our ${technicianTerm}`
    })
    
  } catch (error) {
    logger.error('Error in handleFindServiceForClient:', error)
    return createWebhookErrorResponse('Failed to find service for client', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Service keywords handler
async function handleGetServiceKeywords(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== GET SERVICE KEYWORDS DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    
    // Get tenant's services with keywords
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, keywords, category')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
    
    if (servicesError) {
      logger.error('Error fetching services:', servicesError)
      return createWebhookErrorResponse('Failed to fetch service keywords', servicesError.message)
    }

    // Extract all keywords from services
    const allKeywords = services?.flatMap((service: any) => service.keywords || []) || []
    const uniqueKeywords = [...new Set(allKeywords)]
    
    // Get general keywords as fallback (tenant-agnostic)
    const generalKeywords = [
      "service", "repair", "fix", "replace", "install", "maintenance", "emergency", "urgent",
      "help", "assistance", "support", "issue", "problem", "broken", "not working", "malfunction"
    ]
    
    return createWebhookSuccessResponse({
      tenant_keywords: uniqueKeywords,
      general_keywords: generalKeywords,
      total_tenant_keywords: uniqueKeywords.length,
      services_with_keywords: services?.filter((s: any) => s.keywords && s.keywords.length > 0).length || 0
    })
    
  } catch (error) {
    logger.error('Error in handleGetServiceKeywords:', error)
    return createWebhookErrorResponse('Failed to get service keywords', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Get appointments handler
async function handleGetAppointments(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== GET APPOINTMENTS DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { date, status } = parameters
    
    let query = supabase
      .from('appointments')
      .select(`
        id,
        title,
        description,
        starts_at,
        ends_at,
        status,
        priority,
        address,
        city,
        state,
        zip_code,
        notes,
        created_at,
        clients (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        services (
          id,
          name,
          description,
          price
        )
      `)
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: true })
    
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z')
      const endOfDay = new Date(date + 'T23:59:59.999Z')
      query = query.gte('starts_at', startOfDay.toISOString()).lte('starts_at', endOfDay.toISOString())
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: appointments, error } = await query
    
    if (error) {
      logger.error('Error fetching appointments:', error)
      return createWebhookErrorResponse('Failed to fetch appointments', error.message)
    }
    
    return createWebhookSuccessResponse({
      appointments: appointments || [],
      count: appointments?.length || 0,
      date: date || 'all',
      status: status || 'all'
    })
    
  } catch (error) {
    logger.error('Error in handleGetAppointments:', error)
    return createWebhookErrorResponse('Failed to get appointments', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Get client appointments handler
async function handleGetClientAppointments(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== GET CLIENT APPOINTMENTS DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { client_id, status } = parameters
    
    if (!client_id) {
      return createWebhookErrorResponse('Client ID is required')
    }
    
    let query = supabase
      .from('appointments')
      .select(`
        id,
        title,
        description,
        starts_at,
        ends_at,
        status,
        priority,
        address,
        city,
        state,
        zip_code,
        notes,
        created_at,
        clients (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        services (
          id,
          name,
          description,
          price
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('client_id', client_id)
      .order('starts_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: appointments, error } = await query
    
    if (error) {
      logger.error('Error fetching client appointments:', error)
      return createWebhookErrorResponse('Failed to fetch client appointments', error.message)
    }
    
    return createWebhookSuccessResponse({
      appointments: appointments || [],
      count: appointments?.length || 0,
      client_id,
      status: status || 'all'
    })
    
  } catch (error) {
    logger.error('Error in handleGetClientAppointments:', error)
    return createWebhookErrorResponse('Failed to get client appointments', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Update client handler
async function handleUpdateClient(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== UPDATE CLIENT DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { client_id, name, email, phone, address } = parameters
    
    if (!client_id) {
      return createWebhookErrorResponse('Client ID is required')
    }
    
    // Build update object with only provided fields
    const updateData: any = {}
    if (name) updateData.first_name = name.split(' ')[0] || name
    if (name && name.includes(' ')) updateData.last_name = name.split(' ').slice(1).join(' ')
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (address) updateData.address = address
    
    if (Object.keys(updateData).length === 0) {
      return createWebhookErrorResponse('No fields to update')
    }
    
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', client_id)
      .eq('tenant_id', tenantId)
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        created_at,
        updated_at
      `)
      .single()
    
    if (error) {
      logger.error('Error updating client:', error)
      return createWebhookErrorResponse('Failed to update client', error.message)
    }
    
    if (!updatedClient) {
      return createWebhookErrorResponse('Client not found')
    }
    
    return createWebhookSuccessResponse({
      client: updatedClient,
      message: 'Client updated successfully'
    })
    
  } catch (error) {
    logger.error('Error in handleUpdateClient:', error)
    return createWebhookErrorResponse('Failed to update client', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Check service availability handler
async function handleCheckServiceAvailability(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== CHECK SERVICE AVAILABILITY DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { service_id } = parameters
    
    if (!service_id) {
      return createWebhookErrorResponse('Service ID is required')
    }
    
    const { data: service, error } = await supabase
      .from('services')
      .select('id, name, description, is_active, duration_minutes, price')
      .eq('id', service_id)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) {
      logger.error('Error fetching service:', error)
      return createWebhookErrorResponse('Failed to fetch service', error.message)
    }
    
    if (!service) {
      return createWebhookErrorResponse('Service not found')
    }
    
    return createWebhookSuccessResponse({
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        is_available: service.is_active,
        duration_minutes: service.duration_minutes,
        price: service.price
      },
      available: service.is_active
    })
    
  } catch (error) {
    logger.error('Error in handleCheckServiceAvailability:', error)
    return createWebhookErrorResponse('Failed to check service availability', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Export the wrapped handler with error handling
// Helper function to check for emergency requests
async function handleCheckEmergencyRequest(tenantId: string, parameters: any, supabase: any): Promise<ApiResponse> {
  try {
    logger.debug('=== CHECK EMERGENCY REQUEST DEBUG ===')
    logger.debug('Tenant ID:', tenantId)
    logger.debug('Parameters:', JSON.stringify(parameters, null, 2))
    
    const { client_request } = parameters
    
    if (!client_request) {
      return createWebhookErrorResponse('Client request is required')
    }
    
    // Emergency keywords to check for
    const emergencyKeywords = [
      'emergency', 'urgent', 'asap', 'flooding', 'burst', 'leaking', 
      'flooded', 'water everywhere', 'stop leak', 'prevent damage', 
      'safety hazard', 'health hazard', 'immediately', 'right now'
    ]
    
    const requestText = client_request.toLowerCase()
    const isEmergency = emergencyKeywords.some(keyword => requestText.includes(keyword))
    
    logger.debug('Request text:', requestText)
    logger.debug('Is emergency:', isEmergency)
    
    return createWebhookSuccessResponse({
      is_emergency: isEmergency,
      urgency_level: isEmergency ? 'emergency' : 'standard',
      detected_keywords: emergencyKeywords.filter(keyword => requestText.includes(keyword)),
      message: isEmergency 
        ? 'This appears to be an emergency situation requiring immediate attention'
        : 'This is a standard service request'
    })
    
  } catch (error) {
    logger.error('Error in handleCheckEmergencyRequest:', error)
    return createWebhookErrorResponse('Failed to check emergency request', error instanceof Error ? error.message : 'Unknown error')
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const result = await webhookHandler(request)
  
  // Convert ApiResponse to NextResponse
  if ('success' in result) {
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  }
  
  // If it's already a NextResponse, return it
  return result as NextResponse
})

// Health check endpoint
export async function GET() {
  const response = NextResponse.json(
    createStandardSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      functions: [
        'getBusinessHours',
        'getServices', 
        'getAvailability',
        'lookupClient',
        'createClient',
        'bookAppointment',
        'getClientDetails',
        'getPricing',
        'checkServiceArea',
        'createQuote',
        'updateAppointment',
        'cancelAppointment',
        'rescheduleAppointment',
        'endCall',
        'findServiceForClient',
        'getCurrentDate',
        'getPricingInfo',
        'getServiceKeywords',
        'getAppointments',
        'getClientAppointments',
        'updateClient',
        'checkServiceAvailability'
      ]
    })
  )
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}