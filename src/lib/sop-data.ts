export interface SOPVideo {
  id: string
  title: string
  description: string
  loomUrl: string
  duration: string
  category: string
  order: number
}

export interface SOPTextGuide {
  id: string
  title: string
  description: string
  content: string
  category: string
  order: number
}

export interface SOPSection {
  id: string
  title: string
  description: string
  icon: string
  order: number
  videos: SOPVideo[]
  guides: SOPTextGuide[]
}

export const sopSections: SOPSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using Cravab',
    icon: '🚀',
    order: 1,
    videos: [
      {
        id: 'welcome-tour',
        title: 'Welcome to Cravab',
        description: 'A complete walkthrough of the app interface and main features',
        loomUrl: 'https://www.loom.com/embed/example-welcome-tour',
        duration: '5:30',
        category: 'getting-started',
        order: 1
      },
      {
        id: 'initial-setup',
        title: 'Initial Setup & Configuration',
        description: 'How to set up your company profile and configure basic settings',
        loomUrl: 'https://www.loom.com/embed/example-initial-setup',
        duration: '8:15',
        category: 'getting-started',
        order: 2
      }
    ],
    guides: [
      {
        id: 'first-steps',
        title: 'First Steps Guide',
        description: 'Quick start checklist for new users',
        content: `# First Steps Guide

## Welcome to Cravab!

Follow these steps to get started with your service business management:

### 1. Complete Your Profile
- Add your company information
- Set up your contact details
- Configure your service area

### 2. Add Your Services
- Go to More > Services
- Add your services
- Set pricing for each service

### 3. Import Your Clients
- Go to Clients tab
- Add existing clients manually
- Import from CSV if available

### 4. Set Up Appointments
- Go to Appointments tab
- Schedule your first appointment
- Test the calendar functionality

### 5. Configure AI Assistant
- Set up your Vapi AI integration
- Test the call handling system
- Customize AI responses

## Need Help?
- Check the video tutorials above
- Contact support if you need assistance
- Join our community forum`,
        category: 'getting-started',
        order: 1
      }
    ]
  },
  {
    id: 'client-management',
    title: 'Client Management',
    description: 'Managing your client database and relationships',
    icon: '👥',
    order: 2,
    videos: [
      {
        id: 'adding-clients',
        title: 'Adding & Managing Clients',
        description: 'How to add new clients and manage your client database',
        loomUrl: 'https://www.loom.com/embed/example-adding-clients',
        duration: '6:45',
        category: 'client-management',
        order: 1
      },
      {
        id: 'client-communication',
        title: 'Client Communication Best Practices',
        description: 'Tips for effective client communication and follow-up',
        loomUrl: 'https://www.loom.com/embed/example-client-communication',
        duration: '7:20',
        category: 'client-management',
        order: 2
      }
    ],
    guides: [
      {
        id: 'client-data-organization',
        title: 'Organizing Client Data',
        description: 'Best practices for keeping client information organized',
        content: `# Organizing Client Data

## Client Information Structure

### Essential Information
- **Full Name**: First and last name
- **Phone Number**: Primary contact number
- **Email**: For digital communication
- **Address**: Service location

### Additional Details
- **Service History**: Track past work
- **Notes**: Special instructions or preferences
- **Emergency Contact**: Alternative contact person
- **Preferred Service Times**: When they prefer appointments

## Data Entry Tips

### Consistency is Key
- Use the same format for phone numbers
- Standardize address formatting
- Keep notes concise but informative

### Regular Updates
- Update contact information regularly
- Add notes after each service call
- Mark inactive clients appropriately

### Privacy & Security
- Never share client information
- Use secure communication methods
- Follow data protection guidelines`,
        category: 'client-management',
        order: 1
      }
    ]
  },
  {
    id: 'appointment-scheduling',
    title: 'Appointment Scheduling',
    description: 'Scheduling and managing appointments effectively',
    icon: '📅',
    order: 3,
    videos: [
      {
        id: 'scheduling-appointments',
        title: 'Scheduling Appointments',
        description: 'How to create, edit, and manage appointments',
        loomUrl: 'https://www.loom.com/embed/example-scheduling-appointments',
        duration: '9:10',
        category: 'appointment-scheduling',
        order: 1
      },
      {
        id: 'calendar-management',
        title: 'Calendar Management',
        description: 'Using the calendar view and managing your schedule',
        loomUrl: 'https://www.loom.com/embed/example-calendar-management',
        duration: '6:30',
        category: 'appointment-scheduling',
        order: 2
      }
    ],
    guides: [
      {
        id: 'appointment-best-practices',
        title: 'Appointment Best Practices',
        description: 'Tips for efficient appointment scheduling',
        content: `# Appointment Best Practices

## Scheduling Guidelines

### Time Management
- **Buffer Time**: Add 15-30 minutes between appointments
- **Travel Time**: Factor in travel between locations
- **Emergency Slots**: Keep some time slots open for urgent calls

### Appointment Details
- **Clear Descriptions**: Be specific about the work to be done
- **Address Verification**: Double-check service addresses
- **Contact Information**: Include client phone numbers

### Preparation
- **Review Client History**: Check past work and notes
- **Gather Materials**: Prepare necessary tools and parts
- **Route Planning**: Optimize your daily route

## Common Scheduling Mistakes

### Avoid These Issues
- Overbooking your schedule
- Not accounting for travel time
- Forgetting to confirm appointments
- Not leaving buffer time for unexpected issues

### Pro Tips
- Use the app's route optimization
- Set up appointment reminders
- Keep a backup schedule
- Communicate changes promptly`,
        category: 'appointment-scheduling',
        order: 1
      }
    ]
  },
  {
    id: 'ai-call-handling',
    title: 'AI Call Handling',
    description: 'Using the AI assistant for call management',
    icon: '🤖',
    order: 4,
    videos: [
      {
        id: 'ai-setup',
        title: 'Setting Up AI Call Handling',
        description: 'How to configure and test your AI call assistant',
        loomUrl: 'https://www.loom.com/embed/example-ai-setup',
        duration: '10:25',
        category: 'ai-call-handling',
        order: 1
      },
      {
        id: 'ai-optimization',
        title: 'Optimizing AI Responses',
        description: 'Customizing AI responses for your business needs',
        loomUrl: 'https://www.loom.com/embed/example-ai-optimization',
        duration: '8:45',
        category: 'ai-call-handling',
        order: 2
      }
    ],
    guides: [
      {
        id: 'ai-best-practices',
        title: 'AI Call Handling Best Practices',
        description: 'Maximizing the effectiveness of your AI assistant',
        content: `# AI Call Handling Best Practices

## Initial Setup

### Configuration
- **Business Hours**: Set accurate operating hours
- **Service Areas**: Define your service coverage
- **Emergency Procedures**: Configure after-hours handling
- **Pricing Information**: Keep rates up to date

### Testing
- **Test Calls**: Make test calls to verify setup
- **Response Quality**: Review AI responses regularly
- **Fallback Options**: Ensure human backup is available

## Optimization Tips

### Response Customization
- **Tone**: Match your business personality
- **Information**: Include relevant service details
- **Call-to-Action**: Clear next steps for clients

### Monitoring
- **Review Transcripts**: Check call quality regularly
- **Update Responses**: Refine based on common questions
- **Track Metrics**: Monitor success rates

## Common Issues

### Troubleshooting
- **Poor Audio Quality**: Check microphone settings
- **Incorrect Responses**: Update knowledge base
- **Technical Problems**: Contact support immediately

### Maintenance
- **Regular Updates**: Keep AI responses current
- **Seasonal Changes**: Update for seasonal services
- **Feedback Integration**: Use client feedback to improve`,
        category: 'ai-call-handling',
        order: 1
      }
    ]
  },
  {
    id: 'services-pricing',
    title: 'Services & Pricing',
    description: 'Managing your service offerings and pricing',
    icon: '💰',
    order: 5,
    videos: [
      {
        id: 'service-setup',
        title: 'Setting Up Services',
        description: 'How to add and manage your services',
        loomUrl: 'https://www.loom.com/embed/example-service-setup',
        duration: '7:50',
        category: 'services-pricing',
        order: 1
      },
      {
        id: 'pricing-strategies',
        title: 'Pricing Strategies',
        description: 'Best practices for setting competitive prices',
        loomUrl: 'https://www.loom.com/embed/example-pricing-strategies',
        duration: '9:15',
        category: 'services-pricing',
        order: 2
      }
    ],
    guides: [
      {
        id: 'pricing-guide',
        title: 'Pricing Guide',
        description: 'Comprehensive guide to setting service prices',
        content: `# Pricing Guide

## Setting Your Prices

### Base Pricing
- **Service Cost**: Calculate material and labor costs
- **Overhead**: Include business expenses
- **Profit Margin**: Add desired profit percentage
- **Market Research**: Check competitor pricing

### Hourly Rates
- **Labor Costs**: Your time and expertise
- **Travel Time**: Include travel between jobs
- **Equipment Usage**: Factor in tool wear and tear
- **Emergency Premium**: Higher rates for urgent calls

## Common Services & Pricing

### Drain Services
- **Drain Cleaning**: $150-300
- **Drain Repair**: $200-500
- **Sewer Line**: $1,000-3,000

### Service Repairs
- **Faucet Repair**: $100-250
- **Toilet Repair**: $150-300
- **Pipe Repair**: $200-800

### Installation Services
- **Faucet Installation**: $200-400
- **Toilet Installation**: $300-600
- **Water Heater**: $800-2,000

## Pricing Tips

### Value-Based Pricing
- Focus on value delivered, not just time spent
- Consider client's urgency and situation
- Bundle services for better value

### Dynamic Pricing
- Adjust for peak times
- Consider seasonal variations
- Factor in location and accessibility

### Communication
- Be transparent about pricing
- Provide detailed estimates
- Explain value proposition clearly`,
        category: 'services-pricing',
        order: 1
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and how to resolve them',
    icon: '🔧',
    order: 6,
    videos: [
      {
        id: 'common-issues',
        title: 'Common Issues & Solutions',
        description: 'Troubleshooting common app and integration issues',
        loomUrl: 'https://www.loom.com/embed/example-common-issues',
        duration: '12:30',
        category: 'troubleshooting',
        order: 1
      }
    ],
    guides: [
      {
        id: 'troubleshooting-guide',
        title: 'Troubleshooting Guide',
        description: 'Step-by-step solutions to common problems',
        content: `# Troubleshooting Guide

## Common Issues & Solutions

### App Issues

#### App Won't Load
1. Check internet connection
2. Clear browser cache
3. Try refreshing the page
4. Contact support if persistent

#### Data Not Syncing
1. Check internet connection
2. Log out and log back in
3. Clear app data
4. Check server status

#### Slow Performance
1. Close other browser tabs
2. Clear browser cache
3. Check internet speed
4. Restart browser

### Integration Issues

#### AI Not Responding
1. Check Vapi AI configuration
2. Verify webhook settings
3. Test with a sample call
4. Check API key validity

#### Calendar Sync Problems
1. Verify calendar permissions
2. Check timezone settings
3. Refresh calendar data
4. Re-authorize calendar access

### Data Issues

#### Missing Information
1. Check if data was saved
2. Look for validation errors
3. Try refreshing the page
4. Check for duplicate entries

#### Incorrect Data
1. Verify input format
2. Check for typos
3. Update information
4. Contact support if needed

## Getting Help

### Self-Service
- Check this troubleshooting guide
- Review video tutorials
- Search help articles

### Contact Support
- Use the in-app support chat
- Email support@CRAVAB.com
- Call support during business hours

### Emergency Issues
- For critical business issues
- Contact emergency support
- Use backup procedures if available`,
        category: 'troubleshooting',
        order: 1
      }
    ]
  }
]
