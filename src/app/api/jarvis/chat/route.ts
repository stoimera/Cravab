import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, executeTenantQuery, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, session_id } = body

    if (!message || !session_id) {
      return createErrorResponse('Message and session_id are required', 400)
    }

    // Use standardized authentication and tenant resolution
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.response
    }
    
    const { user, tenantId, supabase } = authResult

    // Get user's basic info and role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('first_name, last_name, tenant_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData) {
      return createErrorResponse('User not found', 404, { tenantId })
    }

    // Check if user has access to Jarvis AI (all roles can use it)
    // No additional role restrictions for Jarvis AI chat

    // Get Jarvis configuration (universal) - fallback to default config if table doesn't exist
    let jarvisConfig
    try {
      const { data: configData, error: configError } = await supabase
        .from('jarvis_configs')
        .select('*')
        .eq('is_active', true)
        .single()

      if (configError) {
        // Jarvis config table not found, using default configuration
        jarvisConfig = getDefaultJarvisConfig()
      } else {
        jarvisConfig = configData
      }
    } catch (error) {
      // Jarvis config table not available, using default configuration
      jarvisConfig = getDefaultJarvisConfig()
    }

    if (!jarvisConfig) {
      jarvisConfig = getDefaultJarvisConfig()
    }

    // Save user message to conversation history (optional - table might not exist)
    try {
      const { error: userMessageError } = await supabase
        .from('jarvis_conversations')
        .insert({
          tenant_id: userData.tenant_id,
          user_id: user.id,
          session_id,
          message_type: 'user',
          message: message,
          intent: null,
          confidence_score: null,
          response_source: null
        })

      if (userMessageError) {
        // Conversation history table not available, skipping save
      }
    } catch (error) {
      // Conversation history table not available, skipping save
    }

    // Process the message and generate response
    const response = await processMessage(message, jarvisConfig)

    // Save assistant response to conversation history (optional - table might not exist)
    try {
      const { error: assistantMessageError } = await supabase
        .from('jarvis_conversations')
        .insert({
          tenant_id: userData.tenant_id,
          user_id: user.id,
          session_id,
          message_type: 'assistant',
          message: typeof response.message === 'string' ? response.message : JSON.stringify(response.message),
          intent: response.intent,
          confidence_score: response.confidence_score,
          response_source: response.response_source
        })

      if (assistantMessageError) {
        // Conversation history table not available, skipping save
      }
    } catch (error) {
      // Conversation history table not available, skipping save
    }

    return NextResponse.json(response)

  } catch (error) {
    // Error in Jarvis chat
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processMessage(message: string, config: Record<string, unknown>) {
  const lowerMessage = message.toLowerCase()
  
  // Extract help data from config
  const helpData = (config.help_data as Record<string, unknown>) || {}
  const features = (helpData.features as Array<{ question: string; answer: string; keywords?: string[] }>) || []
  const tutorials = (helpData.tutorials as Array<{ question: string; answer: string; keywords?: string[] }>) || []
  const faqs = (helpData.faqs as Array<{ question: string; answer: string; keywords?: string[] }>) || []
  const troubleshooting = (helpData.troubleshooting as Array<{ question: string; answer: string; keywords?: string[] }>) || []
  const shortcuts = (helpData.shortcuts as Array<{ question: string; answer: string; keywords?: string[] }>) || []
  const tips = (helpData.tips as Array<{ question: string; answer: string; keywords?: string[] }>) || []

  // Intent detection
  let intent = 'general_question'
  let confidence_score = 0.5
  let response_source = 'general'
  let response = config.fallback_message || "I'm not sure about that. Let me connect you with our support team or try rephrasing your question."

  // Check for feature-related questions
  if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    intent = 'appointment_help'
    confidence_score = 0.8
    response_source = 'feature'
    response = getAppointmentHelp()
  }
  else if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
    intent = 'client_help'
    confidence_score = 0.8
    response_source = 'feature'
    response = getClientHelp()
  }
  else if (lowerMessage.includes('service') || lowerMessage.includes('pricing')) {
    intent = 'service_help'
    confidence_score = 0.8
    response_source = 'feature'
    response = getServiceHelp()
  }
  else if (lowerMessage.includes('call') || lowerMessage.includes('phone')) {
    intent = 'call_help'
    confidence_score = 0.8
    response_source = 'feature'
    response = getCallHelp()
  }
  else if (lowerMessage.includes('sop') || lowerMessage.includes('training') || lowerMessage.includes('video')) {
    intent = 'sop_help'
    confidence_score = 0.8
    response_source = 'feature'
    response = getSOPHelp()
  }
  else if (lowerMessage.includes('notification') || lowerMessage.includes('alert')) {
    intent = 'notification_help'
    confidence_score = 0.8
    response_source = 'feature'
    response = getNotificationHelp()
  }
  else if (lowerMessage.includes('how to') || lowerMessage.includes('tutorial')) {
    intent = 'tutorial_request'
    confidence_score = 0.7
    response_source = 'tutorial'
    response = getTutorialHelp(lowerMessage)
  }
  else if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('error')) {
    intent = 'troubleshooting'
    confidence_score = 0.7
    response_source = 'troubleshooting'
    response = getTroubleshootingHelp(lowerMessage)
  }
  else {
    // Check against FAQ data
    const faqMatch = findFAQMatch(lowerMessage, faqs)
    if (faqMatch) {
      intent = 'faq'
      confidence_score = 0.9
      response_source = 'faq'
      response = faqMatch.answer
    }
  }

  return {
    message: response,
    intent,
    confidence_score,
    response_source
  }
}

function getAppointmentHelp() {
  return `Here's how to manage appointments:

**Creating an Appointment:**
1. Go to the Appointments page
2. Click "Create New Appointment"
3. Select a client or add a new one
4. Choose the service and set the date/time
5. Add any notes and save

**Managing Appointments:**
- View all appointments in the calendar or list view
- Click on any appointment to edit details
- Mark appointments as completed or cancelled
- Set reminders for upcoming appointments

**Quick Tips:**
- Use the calendar view to see your schedule at a glance
- Set travel time for accurate scheduling
- Add notes to remember important details about the job

Need help with anything specific about appointments?`
}

function getClientHelp() {
  return `Here's how to manage clients:

**Adding a New Client:**
1. Go to the Clients page
2. Click "Add New Client"
3. Fill in their contact information
4. Add any notes or preferences
5. Save the client

**Managing Client Information:**
- View all clients in the clients list
- Click on a client to see their full profile
- Edit contact information anytime
- View their appointment history
- Add notes about their preferences

**Client Features:**
- Store multiple contact methods (phone, email)
- Track appointment history
- Add notes for special instructions
- Set preferred appointment times

Need help with anything specific about client management?`
}

function getServiceHelp() {
  return `Here's how to manage your services:

**Adding a New Service:**
1. Go to the Services page
2. Click "Add New Service"
3. Enter service name and description
4. Set your pricing (base price and hourly rate)
5. Choose if it's an emergency service
6. Save the service

**Service Management:**
- Edit service details anytime
- Set different pricing tiers
- Mark services as active/inactive
- Categorize services (repair, installation, maintenance, etc.)

**Pricing Options:**
- Base price for standard jobs
- Hourly rate for time-based work
- Emergency service pricing
- Custom pricing tiers

Need help with anything specific about services?`
}

function getCallHelp() {
  return `Here's how to manage calls:

**Viewing Call History:**
1. Go to the Calls page
2. See all incoming and outgoing calls
3. Filter by date, status, or client
4. Click on any call for details

**Call Features:**
- View call transcripts
- Listen to call recordings
- See call summaries and analysis
- Track follow-up requirements
- Rate call quality

**AI Call Handling:**
- Calls are automatically handled by our AI
- Get instant call summaries
- Automatic follow-up reminders
- Sentiment analysis of customer calls

Need help with anything specific about calls?`
}

function getSOPHelp() {
  return `Here's how to access SOP materials:

**SOP Hub:**
1. Go to the SOP Hub page
2. Browse available training materials
3. Watch Loom videos and read guides
4. Complete required training modules

**Training Features:**
- Video tutorials and guides
- Interactive checklists
- Progress tracking
- Required vs optional materials
- Search and filter content

**Progress Tracking:**
- See your completion status
- Track time spent on training
- Get reminders for incomplete modules
- Earn certificates for completed courses

Need help with anything specific about SOP materials?`
}

function getNotificationHelp() {
  return `Here's how to manage notifications:

**Notification Settings:**
1. Go to Settings > Notifications
2. Choose your notification preferences
3. Select notification methods (email, SMS, push)
4. Set notification types you want to receive

**Notification Types:**
- Appointment reminders
- Call notifications
- System updates
- Payment reminders
- Training reminders

**Managing Notifications:**
- Mark notifications as read/unread
- Set quiet hours
- Choose notification frequency
- Enable/disable specific types

Need help with anything specific about notifications?`
}

function getTutorialHelp(message: string) {
  const tutorials = [
    'appointments', 'clients', 'services', 'calls', 'sop', 'notifications'
  ]
  
  const matchedTutorial = tutorials.find(tutorial => 
    message.includes(tutorial)
  )
  
  if (matchedTutorial) {
    return `I can help you with ${matchedTutorial}! Here's a step-by-step guide:

${getTutorialSteps(matchedTutorial)}

Would you like me to walk you through any specific part?`
  }
  
  return `I can help you with tutorials for:
- Appointments (scheduling and management)
- Clients (adding and managing customers)
- Services (setting up your offerings)
- Calls (viewing call history)
- SOP (training materials)
- Notifications (managing alerts)

What specific tutorial would you like?`
}

function getTutorialSteps(tutorial: string) {
  const steps = {
    appointments: `1. Navigate to the Appointments page
2. Click "Create New Appointment"
3. Select or add a client
4. Choose the service and time
5. Add any special notes
6. Save and confirm`,
    clients: `1. Go to the Clients page
2. Click "Add New Client"
3. Enter contact information
4. Add preferences and notes
5. Save the client profile`,
    services: `1. Navigate to Services page
2. Click "Add New Service"
3. Enter service details
4. Set pricing structure
5. Configure service options
6. Save and activate`,
    calls: `1. Go to the Calls page
2. View call history and details
3. Listen to recordings
4. Review call summaries
5. Set follow-up actions`,
    sop: `1. Access the SOP Hub
2. Browse available materials
3. Start with required training
4. Watch videos and read guides
5. Complete assessments
6. Track your progress`,
    notifications: `1. Go to Settings
2. Select Notifications
3. Choose your preferences
4. Set notification methods
5. Configure timing and frequency
6. Save your settings`
  }
  
  return (steps as Record<string, string>)[tutorial] || 'Tutorial steps not available'
}

function getTroubleshootingHelp(message: string) {
  const commonIssues = [
    'login', 'appointment', 'client', 'service', 'call', 'notification'
  ]
  
  const matchedIssue = commonIssues.find(issue => 
    message.includes(issue)
  )
  
  if (matchedIssue) {
    return `I can help troubleshoot ${matchedIssue} issues. Here are some common solutions:

${getTroubleshootingSteps(matchedIssue)}

If this doesn't solve your problem, please contact support with specific details about what you're experiencing.`
  }
  
  return `I can help troubleshoot common issues with:
- Login and authentication
- Appointment scheduling
- Client management
- Service configuration
- Call handling
- Notifications

What specific issue are you experiencing?`
}

function getTroubleshootingSteps(issue: string) {
  const steps = {
    login: `1. Check your email and password
2. Try resetting your password
3. Clear browser cache and cookies
4. Try a different browser
5. Check your internet connection`,
    appointment: `1. Refresh the appointments page
2. Check if the client exists
3. Verify the service is active
4. Try creating a simple appointment first
5. Check for any error messages`,
    client: `1. Ensure all required fields are filled
2. Check phone number format
3. Verify email address is valid
4. Try adding a client with minimal info first
5. Check for duplicate entries`,
    service: `1. Verify service name is unique
2. Check pricing is entered correctly
3. Ensure service is marked as active
4. Try editing an existing service first
5. Check for any validation errors`,
    call: `1. Refresh the calls page
2. Check if calls are being recorded
3. Verify call settings are correct
4. Try making a test call
5. Check call history filters`,
    notification: `1. Check notification settings
2. Verify email/SMS preferences
3. Check if notifications are enabled
4. Try sending a test notification
5. Check spam/junk folders`
  }
  
  return (steps as Record<string, string>)[issue] || 'Troubleshooting steps not available'
}

function findFAQMatch(message: string, faqs: Array<{ question: string; answer: string; keywords?: string[] }>) {
  if (!Array.isArray(faqs)) return null
  
  return faqs.find(faq => {
    const question = faq.question?.toLowerCase() || ''
    const keywords = faq.keywords || []
    
    return keywords.some((keyword: string) => 
      message.includes(keyword.toLowerCase())
    ) || question.includes(message)
  })
}

function getDefaultJarvisConfig() {
  return {
    fallback_message: "I'm here to help! I can assist you with appointments, clients, services, calls, SOP materials, notifications, reports, documents, settings, and more. What would you like to know?",
    help_data: {
      features: [
        {
          question: "How do I create an appointment?",
          answer: "Go to the Appointments page and click 'Add' button (or use the calendar view). Select a client, choose a service, set the date/time, add travel time and special instructions, assign to a team member, and save.",
          keywords: ["appointment", "schedule", "booking", "calendar", "create", "new"]
        },
        {
          question: "How do I add a new client?",
          answer: "Navigate to the Clients page and click 'Add Client' button. Fill in their contact information, address, preferences, and notes. Upload any documents and save the client profile.",
          keywords: ["client", "customer", "add", "new", "contact", "profile"]
        },
        {
          question: "How do I manage services?",
          answer: "Go to the Services page to add, edit, or deactivate services. Set pricing structures (hourly, flat rate, etc.), add descriptions, configure service categories, and set service area coverage.",
          keywords: ["service", "pricing", "manage", "edit", "configure"]
        },
        {
          question: "How do I view and manage calls?",
          answer: "Visit the Calls page to see all AI-handled calls. You can listen to recordings, read transcripts, review call summaries, analyze performance metrics, and manage call routing.",
          keywords: ["call", "vapi", "ai", "recording", "transcript", "analytics"]
        },
        {
          question: "How do I access reports and analytics?",
          answer: "Navigate to the Reports page to view key performance metrics, call success rates, appointment completion rates, revenue tracking, and other business analytics. Export data for external analysis.",
          keywords: ["reports", "analytics", "metrics", "performance", "dashboard", "export"]
        },
        {
          question: "How do I manage documents?",
          answer: "Go to the Documents page, click 'Upload' to add files (PDF, images, Word docs), add descriptions and tags, organize by client or category, and search/filter documents as needed.",
          keywords: ["documents", "files", "upload", "organize", "contracts", "photos"]
        },
        {
          question: "How do I access training materials?",
          answer: "Go to the SOP Hub from the More menu to browse training videos, procedure guides, company policies, and educational materials. Complete required modules and track your progress.",
          keywords: ["sop", "training", "video", "materials", "procedures", "education"]
        },
        {
          question: "How do I configure settings?",
          answer: "Go to Settings from the More menu to configure company information, manage user accounts and permissions, set up notification preferences, configure VAPI and webhook settings, and adjust system preferences.",
          keywords: ["settings", "configuration", "users", "notifications", "integrations", "preferences"]
        }
      ],
      tutorials: [
        {
          question: "Getting Started with Cravab",
          answer: "Complete setup guide: 1) Set up company profile and business hours, 2) Configure service area and radius, 3) Add your first client and create a test appointment, 4) Set up services and pricing, 5) Configure VAPI integration, 6) Set up notifications and user permissions, 7) Upload company documents and SOP materials.",
          keywords: ["getting started", "setup", "tutorial", "guide", "beginner", "onboarding"]
        },
        {
          question: "VAPI AI Integration Setup",
          answer: "Complete VAPI setup: 1) Obtain VAPI API credentials, 2) Configure webhook endpoints, 3) Set up AI assistant with custom prompts, 4) Test integration with sample call, 5) Configure call routing and escalation, 6) Set up recording and transcription, 7) Monitor performance and adjust settings.",
          keywords: ["vapi", "ai", "integration", "setup", "calls", "automation", "webhook"]
        },
        {
          question: "Complete Appointment Workflow",
          answer: "End-to-end appointment management: 1) Create appointment from calendar or client page, 2) Select/add client information, 3) Choose service and set duration, 4) Assign to team member and set travel time, 5) Add special instructions and materials, 6) Send confirmation to client, 7) Track status and completion, 8) Generate invoice and follow-up tasks.",
          keywords: ["appointments", "workflow", "calendar", "scheduling", "management", "complete"]
        },
        {
          question: "Advanced Client Management",
          answer: "Comprehensive client management: 1) Add clients with complete contact info, 2) Upload documents and photos, 3) Set preferences and service history, 4) Use search and filtering, 5) Create tags and categories, 6) Track communication and interactions, 7) Generate client reports and analytics.",
          keywords: ["clients", "management", "customer", "crm", "advanced", "relationships"]
        },
        {
          question: "AI Call Management & Analytics",
          answer: "Effective call management: 1) Review calls on dashboard, 2) Listen to recordings and transcripts, 3) Analyze success rates and metrics, 4) Set up routing rules and escalation, 5) Monitor AI performance and adjust prompts, 6) Handle callbacks and follow-ups, 7) Export call data for analysis.",
          keywords: ["calls", "ai", "management", "analytics", "vapi", "performance", "monitoring"]
        }
      ],
      faqs: [
        {
          question: "What is Cravab and what does it do?",
          answer: "Cravab is a comprehensive business management system designed for service-based businesses across various industries. It helps you manage appointments, clients, services, AI-powered call handling, documents, and business analytics all in one platform.",
          keywords: ["what", "CRAVAB", "os", "system", "business", "management"]
        },
        {
          question: "How do I create a new appointment?",
          answer: "Go to the Appointments page, click 'Add' button (or use calendar view), select a client (or add new one), choose a service, set the date/time, add travel time and special instructions, assign to team member, and save.",
          keywords: ["create", "appointment", "new", "schedule", "booking", "calendar"]
        },
        {
          question: "How do I add a new client?",
          answer: "Navigate to the Clients page, click 'Add Client' button, fill in contact information and address, add preferences and notes, upload any documents, and save the client profile.",
          keywords: ["add", "client", "new", "customer", "contact", "profile"]
        },
        {
          question: "How do I search for existing clients?",
          answer: "Use the search bar on the Clients page to search by name, phone number, email, address, or any notes. The search filters results in real-time as you type.",
          keywords: ["search", "client", "find", "filter", "lookup", "existing"]
        },
        {
          question: "How do I manage my services and pricing?",
          answer: "Go to the Services page to add, edit, or deactivate services. Set pricing structures (hourly, flat rate, etc.), add descriptions, configure service categories, and set service area coverage.",
          keywords: ["manage", "service", "pricing", "edit", "configure", "rates"]
        },
        {
          question: "How do I view and manage my call history?",
          answer: "Visit the Calls page to see all incoming and outgoing calls handled by our AI system. You can listen to recordings, read transcripts, review call summaries, and analyze call performance metrics.",
          keywords: ["view", "call", "history", "recording", "transcript", "ai", "vapi"]
        },
        {
          question: "What is VAPI and how does it work?",
          answer: "VAPI (Voice AI Platform Integration) is our AI-powered call handling system that automatically answers your business phone calls, books appointments, answers customer questions, and handles basic inquiries 24/7. It integrates seamlessly with your Cravab system.",
          keywords: ["vapi", "ai", "voice", "calls", "automation", "integration", "phone"]
        },
        {
          question: "How do I set up VAPI for my business?",
          answer: "Go to Settings > Integrations > VAPI, enter your VAPI API credentials, configure webhook endpoints, set up your AI assistant with custom prompts, and test the integration. Our support team can help with the initial setup.",
          keywords: ["setup", "vapi", "configure", "integration", "webhook", "api", "credentials"]
        },
        {
          question: "How do I upload and organize documents?",
          answer: "Go to the Documents page, click 'Upload', select your files (PDF, images, Word docs), add descriptions and tags, choose categories, and organize by client or project for easy searching.",
          keywords: ["upload", "documents", "files", "organize", "categorize", "contracts", "photos"]
        },
        {
          question: "How do I access training materials and SOPs?",
          answer: "Go to the SOP Hub from the More menu to browse training videos, procedure guides, company policies, and educational materials. Complete required modules and track your training progress.",
          keywords: ["access", "sop", "training", "video", "materials", "procedures", "education"]
        },
        {
          question: "How do I view business reports and analytics?",
          answer: "Navigate to the Reports page to see key performance metrics, call success rates, appointment completion rates, revenue tracking, and other business analytics. Export data for external analysis.",
          keywords: ["reports", "analytics", "metrics", "performance", "dashboard", "business", "export"]
        },
        {
          question: "How do I configure notifications and alerts?",
          answer: "Go to Settings > Notifications to choose your notification preferences, methods (email, SMS, in-app), timing, and which events trigger notifications.",
          keywords: ["configure", "notification", "settings", "preferences", "alerts", "email", "sms"]
        },
        {
          question: "How do I add and manage team members?",
          answer: "Go to Settings > User Management to add new team members, set their roles and permissions, configure their access levels, and manage user accounts.",
          keywords: ["users", "team", "members", "permissions", "roles", "management", "add"]
        },
        {
          question: "How do I export my data?",
          answer: "Most pages have export functionality. Go to the specific page (Clients, Appointments, Reports) and look for the 'Export' or 'Download' button to export data in CSV or PDF format.",
          keywords: ["export", "download", "data", "csv", "pdf", "backup", "download"]
        },
        {
          question: "Can I access Cravab on my mobile device?",
          answer: "Yes! Cravab is a Progressive Web App (PWA) that works on all mobile devices. You can add it to your home screen for easy access and use it just like a native app.",
          keywords: ["mobile", "phone", "tablet", "pwa", "app", "access", "device"]
        },
        {
          question: "How do I manage business hours?",
          answer: "Go to Settings > Company Settings to configure your business hours for each day of the week. Set open/close times, mark days as closed, and configure timezone settings.",
          keywords: ["business", "hours", "schedule", "open", "close", "timezone", "settings"]
        },
        {
          question: "How do I set up service areas?",
          answer: "In Settings > Company Settings, configure your service area description and set the service radius in miles. This helps with appointment scheduling and travel time calculations.",
          keywords: ["service", "area", "radius", "miles", "coverage", "location", "settings"]
        },
        {
          question: "How do I handle appointment conflicts?",
          answer: "The system will warn you about scheduling conflicts. Check the calendar view for overlapping appointments, adjust times, or assign to different team members to resolve conflicts.",
          keywords: ["appointment", "conflict", "overlap", "schedule", "calendar", "time"]
        },
        {
          question: "How do I track appointment completion?",
          answer: "Update appointment status from 'Scheduled' to 'In Progress' to 'Completed'. Add notes about work performed, materials used, and any follow-up actions needed.",
          keywords: ["appointment", "completion", "status", "track", "progress", "notes"]
        },
        {
          question: "How do I generate invoices?",
          answer: "After completing an appointment, you can generate invoices based on the service performed, materials used, and time spent. Go to the appointment details and click 'Generate Invoice'.",
          keywords: ["invoice", "generate", "billing", "payment", "appointment", "service"]
        }
      ],
      troubleshooting: [
        {
          question: "Appointment not saving or creating",
          answer: "Check that all required fields are filled (client, service, date/time), verify the client exists in your system, ensure the service is active and properly configured, check your internet connection, try refreshing the page, clear browser cache, and check for error messages in the console.",
          keywords: ["appointment", "save", "error", "not working", "create", "troubleshoot"]
        },
        {
          question: "Client not found when creating appointment",
          answer: "Use the search bar to find the client by name, phone, or email, check the spelling of the client name, try adding the client first before creating appointment, refresh the client list, check if client was accidentally deleted, and verify the client is in the correct tenant/company.",
          keywords: ["client", "not found", "missing", "appointment", "search", "troubleshoot"]
        },
        {
          question: "Client search not working properly",
          answer: "Check your internet connection, try refreshing the page, clear your browser cache, make sure you have the correct permissions, try searching with different keywords, and contact support if the issue persists.",
          keywords: ["search", "not working", "client", "filter", "find", "troubleshoot"]
        },
        {
          question: "Document upload failing or not saving",
          answer: "Check file size (must be under 10MB), verify file type is supported (PDF, JPG, PNG, DOC, etc.), check your internet connection, ensure you have proper permissions, try uploading one file at a time, clear browser cache, and check if storage quota is exceeded.",
          keywords: ["document", "upload", "failing", "not saving", "file", "troubleshoot"]
        },
        {
          question: "VAPI calls not being handled or recorded",
          answer: "Check your VAPI configuration in Settings, verify webhook endpoints are correctly set, ensure VAPI API credentials are valid, check that call recording is enabled, verify your phone number is properly configured, test the integration with a sample call, check VAPI dashboard for errors, and contact VAPI support if needed.",
          keywords: ["vapi", "calls", "not working", "recording", "ai", "webhook", "troubleshoot"]
        },
        {
          question: "VAPI webhook errors or failed integrations",
          answer: "Verify webhook URL is accessible and correct, check that webhook endpoints are properly configured, ensure your server is running and accessible, check webhook authentication settings, review webhook logs for specific error messages, test webhook endpoints manually, and contact technical support for assistance.",
          keywords: ["vapi", "webhook", "error", "integration", "failed", "api", "troubleshoot"]
        },
        {
          question: "Reports page not loading or showing data",
          answer: "Check your internet connection, refresh the page and try again, clear browser cache and cookies, ensure you have proper permissions to view reports, check if there is data to display, try logging out and back in, and contact support if the issue persists.",
          keywords: ["reports", "not loading", "data", "analytics", "dashboard", "troubleshoot"]
        },
        {
          question: "Not receiving notifications or alerts",
          answer: "Check notification settings in Settings > Notifications, verify email/SMS preferences are configured, check spam/junk folders for email notifications, ensure notifications are enabled for your account, try sending a test notification, check if your email/SMS service is working, and verify your contact information is correct.",
          keywords: ["notification", "not receiving", "email", "sms", "alerts", "troubleshoot"]
        },
        {
          question: "Mobile app or PWA not working properly",
          answer: "Clear your browser cache and data, try accessing from a different browser, ensure you have a stable internet connection, try adding the app to your home screen again, check if your device supports PWA features, update your mobile browser to the latest version, and restart your mobile device.",
          keywords: ["mobile", "app", "pwa", "not working", "phone", "tablet", "troubleshoot"]
        },
        {
          question: "Having trouble logging in or staying logged in",
          answer: "Check your email and password are correct, try resetting your password, clear browser cache and cookies, check if your account is active and not suspended, try logging in from a different browser or device, ensure your internet connection is stable, and contact support if you cannot access your account.",
          keywords: ["login", "password", "access", "authentication", "account", "troubleshoot"]
        }
      ],
      shortcuts: [
        {
          question: "Quick Appointment Creation",
          answer: "Click 'New Appointment' button on client profile page to create appointment directly from client page.",
          keywords: ["quick", "appointment", "create", "client", "shortcut"]
        },
        {
          question: "Quick Call Client",
          answer: "Click phone number on client card or profile to call client directly from their profile.",
          keywords: ["quick", "call", "client", "phone", "shortcut"]
        },
        {
          question: "Quick Notes Addition",
          answer: "Click 'Add Note' or 'Edit' button on any appointment or client to add notes quickly.",
          keywords: ["quick", "notes", "add", "edit", "shortcut"]
        },
        {
          question: "Calendar View Toggle",
          answer: "Click calendar icon on appointments page to switch between list and calendar view for appointments.",
          keywords: ["calendar", "view", "toggle", "appointments", "shortcut"]
        },
        {
          question: "Quick Client Search",
          answer: "Type in the search bar on clients page to search for clients using the search bar.",
          keywords: ["search", "client", "quick", "find", "shortcut"]
        },
        {
          question: "Quick Data Export",
          answer: "Click 'Export' or 'Download' button on relevant pages to export data from any page with export functionality.",
          keywords: ["export", "download", "data", "quick", "shortcut"]
        },
        {
          question: "Jump to Today",
          answer: "Click 'Today' button on calendar view to quickly navigate to today's date in calendar.",
          keywords: ["today", "calendar", "jump", "date", "shortcut"]
        },
        {
          question: "Mobile Navigation",
          answer: "Use bottom navigation bar on mobile devices to access main features from mobile bottom navigation.",
          keywords: ["mobile", "navigation", "menu", "phone", "shortcut"]
        }
      ],
      tips: [
        {
          question: "Create Service Templates",
          answer: "Set up service templates for common service jobs to save time when scheduling appointments.",
          keywords: ["service", "templates", "efficiency", "tips"]
        },
        {
          question: "Enable Appointment Reminders",
          answer: "Configure automatic SMS and email reminders to reduce no-shows and improve customer satisfaction.",
          keywords: ["appointment", "reminders", "sms", "email", "customer", "tips"]
        },
        {
          question: "Account for Travel Time",
          answer: "Always add travel time between appointments for more accurate scheduling and realistic time estimates.",
          keywords: ["travel", "time", "scheduling", "appointments", "tips"]
        },
        {
          question: "Use Comprehensive Notes",
          answer: "Add detailed notes to appointments and clients including customer preferences, previous issues, and special instructions.",
          keywords: ["notes", "detailed", "organization", "appointments", "tips"]
        },
        {
          question: "Monitor AI Call Performance",
          answer: "Regularly review AI-generated call summaries and recordings to identify areas for improvement and training.",
          keywords: ["ai", "calls", "performance", "analytics", "tips"]
        },
        {
          question: "Organize Documents by Client",
          answer: "Upload and categorize client documents (photos, contracts, invoices) for easy reference during future visits.",
          keywords: ["documents", "organize", "client", "files", "tips"]
        },
        {
          question: "Master Client Search",
          answer: "Use the search bar to quickly find clients by name, phone, address, or any notes you've added.",
          keywords: ["search", "client", "efficiency", "find", "tips"]
        },
        {
          question: "Optimize VAPI Integration",
          answer: "Configure your VAPI AI assistant with specific prompts about your services, pricing, and availability for better customer interactions.",
          keywords: ["vapi", "ai", "optimize", "automation", "tips"]
        },
        {
          question: "Review Business Reports",
          answer: "Check your reports dashboard regularly to track call success rates, appointment completion, and revenue trends.",
          keywords: ["reports", "business", "analytics", "performance", "tips"]
        },
        {
          question: "Use Mobile App Features",
          answer: "Add Cravab to your mobile home screen for quick access to client info, appointments, and call management on the go.",
          keywords: ["mobile", "app", "efficiency", "access", "tips"]
        },
        {
          question: "Regular Data Backup",
          answer: "Export your client and appointment data regularly to ensure you have backups of important business information.",
          keywords: ["backup", "data", "export", "safety", "tips"]
        },
        {
          question: "Train Your Team",
          answer: "Use the SOP Hub to train team members on proper procedures and ensure consistent service quality.",
          keywords: ["training", "team", "sop", "management", "tips"]
        }
      ]
    }
  }
}
