# Database Utilities

This directory contains all the database-related utilities for Cravab Service Business Platform.

## Files Overview

### `types/database.ts`
Complete TypeScript types generated from your comprehensive Supabase schema. This file should be regenerated whenever your database schema changes using:
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### `schemas.ts`
Zod validation schemas for all database entities. These provide:
- Runtime validation
- Type inference
- Form validation helpers
- API request/response validation

### `database.ts`
Main database service class with all CRUD operations. Provides:
- Type-safe database operations
- Error handling
- Utility methods for common queries
- Search and filtering capabilities

### `database-helpers.ts`
Individual helper functions for specific database operations. Useful for:
- Quick access to specific operations
- Backward compatibility
- Modular imports

## Usage Examples

### Basic CRUD Operations

```typescript
import { DatabaseService } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// Get all clients for a company
const clients = await DatabaseService.getClients(tenantId)

// Create a new client
const newClient = await DatabaseService.createClient({
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  email: 'john@example.com'
}, tenantId)

// Update a client
const updatedClient = await DatabaseService.updateClient(clientId, {
  first_name: 'Jane'
})

// Delete a client
await DatabaseService.deleteClient(clientId)
```

### Appointment Management

```typescript
// Get today's appointments
const todaysAppointments = await DatabaseService.getTodaysAppointments(tenantId)

// Get upcoming appointments (next 7 days)
const upcomingAppointments = await DatabaseService.getUpcomingAppointments(tenantId, 7)

// Get appointments by date range
const appointments = await DatabaseService.getAppointmentsByDateRange(
  tenantId, 
  '2024-01-01', 
  '2024-01-31'
)
```

### Payment Status Checking

```typescript
// Check if company has valid subscription
const isValid = await DatabaseService.isSubscriptionValid(tenantId)

// Get detailed payment status
const status = await DatabaseService.checkPaymentStatus(tenantId)
console.log({
  hasPaidSetup: status.hasPaidSetup,
  subscriptionActive: status.subscriptionActive,
  subscriptionExpired: status.subscriptionExpired
})
```

### Search and Filtering

```typescript
// Search clients by name or phone
const searchResults = await DatabaseService.searchClients(tenantId, 'John')

// Get calls with client information
const calls = await DatabaseService.getCalls(tenantId)
```

### Using with Forms

```typescript
import { createClientSchema } from '@/lib/schemas'
import { DatabaseService } from '@/lib/database'

// Validate form data
const formData = createClientSchema.parse({
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  email: 'john@example.com'
})

// Create client with validated data
const client = await DatabaseService.createClient(formData, tenantId)
```

### Error Handling

```typescript
try {
  const client = await DatabaseService.getClient(clientId)
} catch (error) {
  console.error('Failed to get client:', error.message)
  // Handle error appropriately
}
```

## Environment Variables

Make sure you have these environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Database Schema

The database includes these main tables:
- `companies` - Company information and payment status
- `users` - User accounts linked to companies
- `clients` - Client information
- `calls` - Call records from Vapi AI
- `appointments` - Scheduled appointments
- `payments` - Payment records
- `services` - Company service offerings
- `invoices` - Invoice management
- `equipment` - Equipment tracking
- `notifications` - User notifications
- `sop_materials` - SOP Hub training materials
- `jarvis_configs` - AI chatbot configuration
- `audit_logs` - Complete audit trail

All tables include proper RLS (Row Level Security) policies to ensure users can only access their company's data.

## Best Practices

1. **Always use the DatabaseService class** for consistency
2. **Handle errors appropriately** - all methods throw descriptive errors
3. **Validate data with Zod schemas** before database operations
4. **Use the utility methods** for common queries like upcoming appointments
5. **Check payment status** before allowing access to paid features
6. **Use proper TypeScript types** for better development experience

## Regenerating Types

When your database schema changes, regenerate the types:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

This ensures your TypeScript types stay in sync with your actual database schema.
