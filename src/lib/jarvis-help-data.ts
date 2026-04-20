// Comprehensive help data structure for Jarvis AI chatbot
// This provides detailed information about all Cravab features and functionality
// This can be customized per company or loaded from the database

export const defaultHelpData = {
  features: [
    {
      id: 'appointments',
      name: 'Appointments',
      description: 'Schedule and manage customer appointments with full calendar integration',
      keywords: ['appointment', 'schedule', 'booking', 'calendar', 'meeting', 'visit'],
      steps: [
        'Navigate to the Appointments page',
        'Click "Create New Appointment" or use the calendar view',
        'Select a client or add a new one',
        'Choose the service and set the date/time',
        'Add travel time and special instructions',
        'Assign to team member if applicable',
        'Set appointment status and save'
      ]
    },
    {
      id: 'clients',
      name: 'Client Management',
      description: 'Comprehensive customer relationship management with search and filtering',
      keywords: ['client', 'customer', 'contact', 'profile', 'search', 'filter'],
      steps: [
        'Go to the Clients page',
        'Use the search bar to find existing clients',
        'Click "Add New Client" for new customers',
        'Enter contact information and address',
        'Add preferences, notes, and tags',
        'Upload documents and photos',
        'Save the client profile'
      ]
    },
    {
      id: 'services',
      name: 'Service Management',
      description: 'Configure services, pricing, and service areas',
      keywords: ['service', 'pricing', 'rate', 'cost', 'repair'],
      steps: [
        'Navigate to Services page',
        'Click "Add New Service"',
        'Enter service details and description',
        'Set pricing structure (hourly, flat rate, etc.)',
        'Configure service categories and tags',
        'Set service area coverage',
        'Add required materials or tools'
      ]
    },
    {
      id: 'calls',
      name: 'Call Management & VAPI Integration',
      description: 'AI-powered call handling with VAPI integration for automated customer service',
      keywords: ['call', 'phone', 'recording', 'transcript', 'vapi', 'ai', 'automation'],
      steps: [
        'Go to the Calls page to view call dashboard',
        'Review AI-handled calls and summaries',
        'Listen to call recordings and transcripts',
        'Check call analytics and success rates',
        'Set up VAPI webhooks for automation',
        'Configure AI assistant responses',
        'Monitor call quality and performance'
      ]
    },
    {
      id: 'reports',
      name: 'Analytics & Reports',
      description: 'Comprehensive business analytics and performance reporting',
      keywords: ['reports', 'analytics', 'metrics', 'performance', 'dashboard'],
      steps: [
        'Navigate to the Reports page',
        'View key performance metrics',
        'Check call success rates and revenue',
        'Review appointment completion rates',
        'Export data for external analysis',
        'Set up automated report scheduling'
      ]
    },
    {
      id: 'documents',
      name: 'Document Management',
      description: 'Upload, organize, and manage client documents and contracts',
      keywords: ['documents', 'files', 'upload', 'contracts', 'invoices', 'photos'],
      steps: [
        'Go to the Documents page',
        'Click "Upload" to add new documents',
        'Select files (PDF, images, Word docs)',
        'Add descriptions and tags',
        'Organize by client or category',
        'Search and filter documents',
        'Download or share as needed'
      ]
    },
    {
      id: 'sop',
      name: 'SOP Hub & Training',
      description: 'Access training materials, procedures, and company policies',
      keywords: ['sop', 'training', 'video', 'procedure', 'policy', 'education'],
      steps: [
        'Access the SOP Hub from the More menu',
        'Browse available training materials',
        'Start with required training modules',
        'Watch instructional videos',
        'Read procedure guides',
        'Complete assessments and quizzes',
        'Track your training progress'
      ]
    },
    {
      id: 'settings',
      name: 'Settings & Configuration',
      description: 'Configure system settings, user management, and integrations',
      keywords: ['settings', 'configuration', 'users', 'notifications', 'integrations'],
      steps: [
        'Go to Settings from the More menu',
        'Configure company information',
        'Manage user accounts and permissions',
        'Set up notification preferences',
        'Configure VAPI and webhook settings',
        'Adjust system preferences',
        'Save all changes'
      ]
    }
  ],
  
  tutorials: [
    {
      id: 'getting-started',
      title: 'Getting Started with Cravab',
      description: 'Complete setup guide for new users and companies',
      steps: [
        'Set up your company profile and business hours',
        'Configure your service area and radius',
        'Add your first client and create a test appointment',
        'Set up your services and pricing structure',
        'Configure VAPI integration for AI call handling',
        'Set up notifications and user permissions',
        'Upload company documents and SOP materials'
      ],
      keywords: ['setup', 'getting started', 'tutorial', 'guide', 'beginner', 'onboarding']
    },
    {
      id: 'vapi-setup',
      title: 'VAPI AI Integration Setup',
      description: 'Complete guide to setting up AI-powered call handling',
      steps: [
        'Obtain VAPI API credentials from your dashboard',
        'Configure webhook endpoints in VAPI settings',
        'Set up your AI assistant with proper system prompts',
        'Test the integration with a sample call',
        'Configure call routing and escalation rules',
        'Set up call recording and transcription',
        'Monitor call performance and adjust settings'
      ],
      keywords: ['vapi', 'ai', 'integration', 'setup', 'calls', 'automation', 'webhook']
    },
    {
      id: 'appointment-workflow',
      title: 'Complete Appointment Management Workflow',
      description: 'End-to-end guide for managing appointments from creation to completion',
      steps: [
        'Create a new appointment from calendar or client page',
        'Select or add client information',
        'Choose appropriate service and set duration',
        'Assign to team member and set travel time',
        'Add special instructions and required materials',
        'Send confirmation to client via SMS/email',
        'Track appointment status and completion',
        'Generate invoice and follow-up tasks'
      ],
      keywords: ['appointments', 'workflow', 'calendar', 'scheduling', 'management', 'complete']
    },
    {
      id: 'client-management',
      title: 'Advanced Client Management',
      description: 'Comprehensive guide to managing client relationships and data',
      steps: [
        'Add new clients with complete contact information',
        'Upload client documents and photos',
        'Set client preferences and service history',
        'Use search and filtering to find clients quickly',
        'Create client tags and categories',
        'Track client communication and interactions',
        'Generate client reports and analytics'
      ],
      keywords: ['clients', 'management', 'customer', 'crm', 'advanced', 'relationships']
    },
    {
      id: 'call-management',
      title: 'AI Call Management & Analytics',
      description: 'How to effectively manage AI-handled calls and analyze performance',
      steps: [
        'Review incoming calls on the Calls dashboard',
        'Listen to AI-generated call recordings and transcripts',
        'Analyze call success rates and conversion metrics',
        'Set up call routing rules and escalation procedures',
        'Monitor AI performance and adjust prompts',
        'Handle callbacks and follow-up actions',
        'Export call data for further analysis'
      ],
      keywords: ['calls', 'ai', 'management', 'analytics', 'vapi', 'performance', 'monitoring']
    },
    {
      id: 'document-management',
      title: 'Document Organization & Management',
      description: 'Best practices for organizing and managing business documents',
      steps: [
        'Upload documents with proper naming conventions',
        'Categorize documents by type (contracts, invoices, photos)',
        'Add tags and descriptions for easy searching',
        'Organize documents by client or project',
        'Set up document templates for common forms',
        'Configure document sharing and permissions',
        'Regularly backup and archive old documents'
      ],
      keywords: ['documents', 'organization', 'management', 'files', 'storage', 'backup']
    }
  ],
  
  faqs: [
    {
      id: 'what-is-CRAVAB-os',
      question: 'What is Cravab and what does it do?',
      answer: 'Cravab is a comprehensive business management system designed for service-based businesses across various industries. It helps you manage appointments, clients, services, AI-powered call handling, documents, and business analytics all in one platform.',
      keywords: ['what', 'CRAVAB', 'os', 'system', 'business', 'management']
    },
    {
      id: 'how-to-create-appointment',
      question: 'How do I create a new appointment?',
      answer: 'Go to the Appointments page, click "Create New Appointment", select a client (or add a new one), choose a service, set the date/time, add travel time and special instructions, assign to a team member, and save.',
      keywords: ['create', 'appointment', 'new', 'schedule', 'booking']
    },
    {
      id: 'how-to-add-client',
      question: 'How do I add a new client?',
      answer: 'Navigate to the Clients page, click "Add New Client", fill in their contact information and address, add preferences and notes, upload any documents, and save the client profile.',
      keywords: ['add', 'client', 'new', 'customer', 'contact']
    },
    {
      id: 'how-to-search-clients',
      question: 'How do I search for existing clients?',
      answer: 'Use the search bar on the Clients page to search by name, phone number, email, address, or any notes. The search will filter results in real-time as you type.',
      keywords: ['search', 'client', 'find', 'filter', 'lookup']
    },
    {
      id: 'how-to-manage-services',
      question: 'How do I manage my services and pricing?',
      answer: 'Go to the Services page to add, edit, or deactivate services. Set pricing structures (hourly, flat rate, etc.), add descriptions, configure service categories, and set service area coverage.',
      keywords: ['manage', 'service', 'pricing', 'edit', 'configure']
    },
    {
      id: 'how-to-view-calls',
      question: 'How do I view and manage my call history?',
      answer: 'Visit the Calls page to see all incoming and outgoing calls handled by our AI system. You can listen to recordings, read transcripts, review call summaries, and analyze call performance metrics.',
      keywords: ['view', 'call', 'history', 'recording', 'transcript', 'ai']
    },
    {
      id: 'what-is-vapi',
      question: 'What is VAPI and how does it work?',
      answer: 'VAPI (Voice AI Platform Integration) is our AI-powered call handling system that automatically answers your business phone calls, books appointments, answers customer questions, and handles basic inquiries 24/7. It integrates seamlessly with your Cravab system.',
      keywords: ['vapi', 'ai', 'voice', 'calls', 'automation', 'integration']
    },
    {
      id: 'how-to-setup-vapi',
      question: 'How do I set up VAPI for my business?',
      answer: 'Go to Settings > Integrations > VAPI, enter your VAPI API credentials, configure webhook endpoints, set up your AI assistant with custom prompts, and test the integration. Our support team can help with the initial setup.',
      keywords: ['setup', 'vapi', 'configure', 'integration', 'webhook', 'api']
    },
    {
      id: 'how-to-upload-documents',
      question: 'How do I upload and organize documents?',
      answer: 'Go to the Documents page, click "Upload", select your files (PDF, images, Word docs), add descriptions and tags, choose categories, and organize by client or project for easy searching.',
      keywords: ['upload', 'documents', 'files', 'organize', 'categorize']
    },
    {
      id: 'how-to-access-sop',
      question: 'How do I access training materials and SOPs?',
      answer: 'Go to the SOP Hub from the More menu to browse training videos, procedure guides, company policies, and educational materials. Complete required modules and track your training progress.',
      keywords: ['access', 'sop', 'training', 'video', 'materials', 'procedures']
    },
    {
      id: 'how-to-view-reports',
      question: 'How do I view business reports and analytics?',
      answer: 'Navigate to the Reports page to see key performance metrics, call success rates, appointment completion rates, revenue tracking, and other business analytics. Export data for external analysis.',
      keywords: ['reports', 'analytics', 'metrics', 'performance', 'dashboard']
    },
    {
      id: 'how-to-configure-notifications',
      question: 'How do I configure notifications and alerts?',
      answer: 'Go to Settings > Notifications to choose your notification preferences, methods (email, SMS, in-app), timing, and which events trigger notifications.',
      keywords: ['configure', 'notification', 'settings', 'preferences', 'alerts']
    },
    {
      id: 'how-to-manage-users',
      question: 'How do I add and manage team members?',
      answer: 'Go to Settings > User Management to add new team members, set their roles and permissions, configure their access levels, and manage user accounts.',
      keywords: ['users', 'team', 'members', 'permissions', 'roles', 'management']
    },
    {
      id: 'how-to-export-data',
      question: 'How do I export my data?',
      answer: 'Most pages have export functionality. Go to the specific page (Clients, Appointments, Reports) and look for the "Export" or "Download" button to export data in CSV or PDF format.',
      keywords: ['export', 'download', 'data', 'csv', 'pdf', 'backup']
    },
    {
      id: 'how-to-mobile-access',
      question: 'Can I access Cravab on my mobile device?',
      answer: 'Yes! Cravab is a Progressive Web App (PWA) that works on all mobile devices. You can add it to your home screen for easy access and use it just like a native app.',
      keywords: ['mobile', 'phone', 'tablet', 'pwa', 'app', 'access']
    }
  ],
  
  troubleshooting: [
    {
      id: 'appointment-not-saving',
      issue: 'Appointment not saving or creating',
      solutions: [
        'Check that all required fields are filled (client, service, date/time)',
        'Verify the client exists in your system',
        'Ensure the service is active and properly configured',
        'Check your internet connection',
        'Try refreshing the page and creating again',
        'Clear your browser cache and cookies',
        'Check for any error messages in the console'
      ],
      keywords: ['appointment', 'save', 'error', 'not working', 'create']
    },
    {
      id: 'client-not-found',
      issue: 'Client not found when creating appointment',
      solutions: [
        'Use the search bar to find the client by name, phone, or email',
        'Check the spelling of the client name',
        'Try adding the client first before creating appointment',
        'Refresh the client list',
        'Check if client was accidentally deleted',
        'Verify the client is in the correct tenant/company'
      ],
      keywords: ['client', 'not found', 'missing', 'appointment', 'search']
    },
    {
      id: 'search-not-working',
      issue: 'Client search not working properly',
      solutions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Clear your browser cache',
        'Make sure you have the correct permissions',
        'Try searching with different keywords',
        'Contact support if the issue persists'
      ],
      keywords: ['search', 'not working', 'client', 'filter', 'find']
    },
    {
      id: 'document-upload-failing',
      issue: 'Document upload failing or not saving',
      solutions: [
        'Check file size (must be under 10MB)',
        'Verify file type is supported (PDF, JPG, PNG, DOC, etc.)',
        'Check your internet connection',
        'Ensure you have proper permissions',
        'Try uploading one file at a time',
        'Clear browser cache and try again',
        'Check if storage quota is exceeded'
      ],
      keywords: ['document', 'upload', 'failing', 'not saving', 'file']
    },
    {
      id: 'vapi-calls-not-working',
      issue: 'VAPI calls not being handled or recorded',
      solutions: [
        'Check your VAPI configuration in Settings',
        'Verify webhook endpoints are correctly set',
        'Ensure VAPI API credentials are valid',
        'Check that call recording is enabled',
        'Verify your phone number is properly configured',
        'Test the integration with a sample call',
        'Check VAPI dashboard for any errors',
        'Contact VAPI support if needed'
      ],
      keywords: ['vapi', 'calls', 'not working', 'recording', 'ai', 'webhook']
    },
    {
      id: 'vapi-webhook-errors',
      issue: 'VAPI webhook errors or failed integrations',
      solutions: [
        'Verify webhook URL is accessible and correct',
        'Check that webhook endpoints are properly configured',
        'Ensure your server is running and accessible',
        'Check webhook authentication settings',
        'Review webhook logs for specific error messages',
        'Test webhook endpoints manually',
        'Contact technical support for assistance'
      ],
      keywords: ['vapi', 'webhook', 'error', 'integration', 'failed', 'api']
    },
    {
      id: 'reports-not-loading',
      issue: 'Reports page not loading or showing data',
      solutions: [
        'Check your internet connection',
        'Refresh the page and try again',
        'Clear browser cache and cookies',
        'Ensure you have proper permissions to view reports',
        'Check if there is data to display',
        'Try logging out and back in',
        'Contact support if the issue persists'
      ],
      keywords: ['reports', 'not loading', 'data', 'analytics', 'dashboard']
    },
    {
      id: 'notification-not-receiving',
      issue: 'Not receiving notifications or alerts',
      solutions: [
        'Check notification settings in Settings > Notifications',
        'Verify email/SMS preferences are configured',
        'Check spam/junk folders for email notifications',
        'Ensure notifications are enabled for your account',
        'Try sending a test notification',
        'Check if your email/SMS service is working',
        'Verify your contact information is correct'
      ],
      keywords: ['notification', 'not receiving', 'email', 'sms', 'alerts']
    },
    {
      id: 'mobile-app-not-working',
      issue: 'Mobile app or PWA not working properly',
      solutions: [
        'Clear your browser cache and data',
        'Try accessing from a different browser',
        'Ensure you have a stable internet connection',
        'Try adding the app to your home screen again',
        'Check if your device supports PWA features',
        'Update your mobile browser to the latest version',
        'Restart your mobile device'
      ],
      keywords: ['mobile', 'app', 'pwa', 'not working', 'phone', 'tablet']
    },
    {
      id: 'login-issues',
      issue: 'Having trouble logging in or staying logged in',
      solutions: [
        'Check your email and password are correct',
        'Try resetting your password',
        'Clear browser cache and cookies',
        'Check if your account is active and not suspended',
        'Try logging in from a different browser or device',
        'Ensure your internet connection is stable',
        'Contact support if you cannot access your account'
      ],
      keywords: ['login', 'password', 'access', 'authentication', 'account']
    }
  ],
  
  shortcuts: [
    {
      id: 'quick-appointment',
      title: 'Quick Appointment Creation',
      description: 'Create appointment directly from client page',
      shortcut: 'Click "New Appointment" button on client profile page'
    },
    {
      id: 'quick-call',
      title: 'Quick Call Client',
      description: 'Call client directly from their profile',
      shortcut: 'Click phone number on client card or profile'
    },
    {
      id: 'quick-notes',
      title: 'Quick Notes Addition',
      description: 'Add notes to any appointment or client',
      shortcut: 'Click "Add Note" or "Edit" button on any item'
    },
    {
      id: 'calendar-view',
      title: 'Calendar View Toggle',
      description: 'Switch between list and calendar view for appointments',
      shortcut: 'Click calendar icon on appointments page'
    },
    {
      id: 'search-clients',
      title: 'Quick Client Search',
      description: 'Search for clients using the search bar',
      shortcut: 'Type in the search bar on clients page'
    },
    {
      id: 'export-data',
      title: 'Quick Data Export',
      description: 'Export data from any page with export functionality',
      shortcut: 'Click "Export" or "Download" button on relevant pages'
    },
    {
      id: 'today-button',
      title: 'Jump to Today',
      description: 'Quickly navigate to today\'s date in calendar',
      shortcut: 'Click "Today" button on calendar view'
    },
    {
      id: 'mobile-menu',
      title: 'Mobile Navigation',
      description: 'Access main features from mobile bottom navigation',
      shortcut: 'Use bottom navigation bar on mobile devices'
    }
  ],
  
  tips: [
    {
      id: 'use-templates',
      title: 'Create Service Templates',
      description: 'Set up service templates for common service jobs to save time when scheduling appointments.',
      category: 'efficiency'
    },
    {
      id: 'set-reminders',
      title: 'Enable Appointment Reminders',
      description: 'Configure automatic SMS and email reminders to reduce no-shows and improve customer satisfaction.',
      category: 'customer-service'
    },
    {
      id: 'track-travel-time',
      title: 'Account for Travel Time',
      description: 'Always add travel time between appointments for more accurate scheduling and realistic time estimates.',
      category: 'scheduling'
    },
    {
      id: 'use-detailed-notes',
      title: 'Use Comprehensive Notes',
      description: 'Add detailed notes to appointments and clients including customer preferences, previous issues, and special instructions.',
      category: 'organization'
    },
    {
      id: 'review-ai-calls',
      title: 'Monitor AI Call Performance',
      description: 'Regularly review AI-generated call summaries and recordings to identify areas for improvement and training.',
      category: 'analytics'
    },
    {
      id: 'organize-documents',
      title: 'Organize Documents by Client',
      description: 'Upload and categorize client documents (photos, contracts, invoices) for easy reference during future visits.',
      category: 'organization'
    },
    {
      id: 'use-client-search',
      title: 'Master Client Search',
      description: 'Use the search bar to quickly find clients by name, phone, address, or any notes you\'ve added.',
      category: 'efficiency'
    },
    {
      id: 'set-up-vapi',
      title: 'Optimize VAPI Integration',
      description: 'Configure your VAPI AI assistant with specific prompts about your services, pricing, and availability for better customer interactions.',
      category: 'automation'
    },
    {
      id: 'regular-reports',
      title: 'Review Business Reports',
      description: 'Check your reports dashboard regularly to track call success rates, appointment completion, and revenue trends.',
      category: 'analytics'
    },
    {
      id: 'mobile-access',
      title: 'Use Mobile App Features',
      description: 'Add Cravab to your mobile home screen for quick access to client info, appointments, and call management on the go.',
      category: 'efficiency'
    },
    {
      id: 'backup-data',
      title: 'Regular Data Backup',
      description: 'Export your client and appointment data regularly to ensure you have backups of important business information.',
      category: 'safety'
    },
    {
      id: 'team-training',
      title: 'Train Your Team',
      description: 'Use the SOP Hub to train team members on proper procedures and ensure consistent service quality.',
      category: 'management'
    }
  ]
}

// Types for help data
interface HelpFeature {
  id: string
  name: string
  description: string
  keywords: string[]
  steps: string[]
}

interface HelpTutorial {
  id: string
  title: string
  description: string
  steps: string[]
  keywords: string[]
}

interface HelpFAQ {
  question: string
  answer: string
  keywords: string[]
}

interface HelpTroubleshooting {
  id: string
  issue: string
  solutions: string[]
  keywords: string[]
}

interface HelpShortcut {
  id: string
  title: string
  description: string
  shortcut: string
}

interface HelpTip {
  id: string
  title: string
  description: string
  category: string
}

interface HelpData {
  features: HelpFeature[]
  tutorials: HelpTutorial[]
  faqs: HelpFAQ[]
  troubleshooting: HelpTroubleshooting[]
  shortcuts: HelpShortcut[]
  tips: HelpTip[]
}

// Helper function to search help data
export function searchHelpData(query: string, helpData: HelpData = defaultHelpData) {
  const lowerQuery = query.toLowerCase()
  const results = {
    features: [] as HelpFeature[],
    tutorials: [] as HelpTutorial[],
    faqs: [] as HelpFAQ[],
    troubleshooting: [] as HelpTroubleshooting[],
    shortcuts: [] as HelpShortcut[],
    tips: [] as HelpTip[]
  }

  // Search features
  helpData.features.forEach((feature: HelpFeature) => {
    if (feature.keywords.some((keyword: string) => lowerQuery.includes(keyword.toLowerCase()))) {
      results.features.push(feature)
    }
  })

  // Search tutorials
  helpData.tutorials.forEach((tutorial: HelpTutorial) => {
    if (tutorial.title.toLowerCase().includes(lowerQuery) || 
        tutorial.description.toLowerCase().includes(lowerQuery)) {
      results.tutorials.push(tutorial)
    }
  })

  // Search FAQs
  helpData.faqs.forEach((faq: HelpFAQ) => {
    if (faq.question.toLowerCase().includes(lowerQuery) ||
        faq.keywords.some((keyword: string) => lowerQuery.includes(keyword.toLowerCase()))) {
      results.faqs.push(faq)
    }
  })

  // Search troubleshooting
  helpData.troubleshooting.forEach((item: HelpTroubleshooting) => {
    if (item.issue.toLowerCase().includes(lowerQuery) ||
        item.keywords.some((keyword: string) => lowerQuery.includes(keyword.toLowerCase()))) {
      results.troubleshooting.push(item)
    }
  })

  // Search shortcuts
  helpData.shortcuts.forEach((shortcut: HelpShortcut) => {
    if (shortcut.title.toLowerCase().includes(lowerQuery) ||
        shortcut.description.toLowerCase().includes(lowerQuery)) {
      results.shortcuts.push(shortcut)
    }
  })

  // Search tips
  helpData.tips.forEach((tip: HelpTip) => {
    if (tip.title.toLowerCase().includes(lowerQuery) ||
        tip.description.toLowerCase().includes(lowerQuery)) {
      results.tips.push(tip)
    }
  })

  return results
}
